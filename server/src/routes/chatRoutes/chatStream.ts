import { Router } from "express";
import { askStoreBot } from "../../services/gemini.js";
import { redis } from "../../lib/redis.js";
import { prisma } from "../../lib/prisma.js";
import { nanoid } from "nanoid";

const router = Router();
const CACHE_TTL = 60 * 60 * 2; // 2 hours
const MAX_MESSAGES_LENGTH = 500;

// POST /api/chat/stream
router.post("/", async (req, res) => {
  const { question } = req.body;
  let sessionId = req.cookies.chat_sessionId;

  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "Invalid question" });
  }

  if(question.length > MAX_MESSAGES_LENGTH){
    return res.status(400).json({ error: `Question is too long. Please ask a question with less than ${MAX_MESSAGES_LENGTH} characters.` });
  }

  if (!sessionId) {
    sessionId = nanoid();
    res.cookie("chat_sessionId", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600 * 24 * 7, // 1 week
      sameSite: "lax",
    });
  }

  const cacheKey = `session:${sessionId}`;

  try {
    // Ensure conversation exists in DB
    let conversation = await prisma.conversation.findFirst({
      where: { session_id: sessionId },
    });
    conversation ??= await prisma.conversation.create({
        data: {
          session_id: sessionId,
        },
      });

    // Fetch previous history from cache or DB before saving new message
    let history: { role: string; content: string }[] = [];
    const cachedMessages = await redis.get(cacheKey);
    if (cachedMessages) {
      history = typeof cachedMessages === "string" ? JSON.parse(cachedMessages) : cachedMessages;
    } else {
      const dbMessages = await prisma.message.findMany({
        where: { conversation_id: conversation.id },
        orderBy: { created_at: "asc" },
      });
      history = dbMessages.map((message) => ({
        role: message.sender === "USER" ? "user" : "assistant",
        content: message.content,
      }));
    }

    // Save user message to DB
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender: "USER",
        content: question,
      },
    });

    // Get response from Gemini with history
    const result = await askStoreBot(history, question);
    const assistantReply = result.text || "";

    // Send response back
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send(assistantReply);

    // Save assistant response and update cache
    if (assistantReply) {
      await prisma.message.create({
        data: {
          conversation_id: conversation.id,
          sender: "ASSISTANT",
          content: assistantReply,
        },
      });

      const updatedHistory = [
        ...history,
        { role: "user", content: question },
        { role: "assistant", content: assistantReply },
      ];
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(updatedHistory));
    }
  } catch (error: any) {
    console.error("Error in chatStream:", error);
    let errorMsg = "Sorry, I am having trouble responding right now. Please try again later.";
    if (error?.status === 429 || error?.status === 503) {
      errorMsg = "We are experiencing high traffic. Please try again later.";
    } else if (error?.status === 401 || error?.status === 403) {
      errorMsg = "There's a configuration issue on our end. Please try again later.";
    } else if (error?.status === 500) {
      errorMsg = "We are experiencing server issues. Please try again later.";
    }

    return res.status(500).json({ error: errorMsg });
  }
});

export default router;
