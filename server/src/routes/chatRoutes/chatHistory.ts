import { Router } from "express";
import { redis } from "../../lib/redis.js";
import { prisma } from "../../lib/prisma.js";
import { nanoid } from "nanoid";

const router = Router();
const CACHE_TTL = 60 * 60 * 2; // 2 hours

// GET /api/chat/history
router.get("/", async (req, res) => {
  let sessionId = req.cookies.chat_sessionId;

  // creating a new session id if not found
  if (!sessionId) {
    const newSessionId = nanoid();
    try {
      await prisma.conversation.create({
        data: {
          session_id: newSessionId,
        },
      });
    } catch (error) {
      console.error("Failed to create conversation:", error);
      return res.status(500).json({ error: "Failed to create new session" });
    }

    res.cookie("chat_sessionId", newSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600 * 24 * 7, // 1 week
      sameSite: "lax",
    });
    sessionId = newSessionId;
  }

  // retrieve messages from redis
  try {
    const cacheKey = `session:${sessionId}`;
    const cachedMessages = await redis.get(cacheKey);
    if (cachedMessages) {
      const parsedMessages = typeof cachedMessages === "string"
        ? JSON.parse(cachedMessages)
        : cachedMessages;
      return res.json({ messages: parsedMessages });
    }

    // retrieve messages from database
    const conversation = await prisma.conversation.findFirst({
      where: { session_id: sessionId },
      include: {
        messages: {
          orderBy: {
            created_at: "asc",
          },
        },
      },
    });

    if (!conversation?.messages || conversation.messages.length === 0) {
      return res.json({ messages: [] });
    }

    const formattedMessages = conversation.messages.map((message) => {
      return {
        role: message.sender === "USER" ? "user" : "assistant",
        content: message.content,
      };
    });

    // caching messages in redis
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(formattedMessages));

    return res.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Failed to retrieve messages:", error);
    return res.status(500).json({ error: "Failed to retrieve messages" });
  }
});

export default router;