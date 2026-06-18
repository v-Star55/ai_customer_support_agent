import { Router } from "express";
import { redis } from "../../lib/redis.js";
import { prisma } from "../../lib/prisma.js";
import { nanoid } from "nanoid";
import { updateChatCache } from "../../lib/cache.js";

const router = Router();
const CACHE_TTL = 60 * 60 * 2; // 2 hours

// GET /api/chat/history
router.get("/", async (req, res) => {
  let sessionId = (req.query.sessionId as string) || req.cookies.chat_sessionId;

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
    sessionId = newSessionId;
  }

  // Always set or refresh the cookie
  res.cookie("chat_sessionId", sessionId, {
    httpOnly: true,
    secure: true,
    maxAge: 3600 * 24 * 7, // 1 week
    sameSite: "none",
  });

  // retrieve messages from redis
  try {
    const cacheKey = `session:${sessionId}`;
    let cachedMessages = null;
    try {
      cachedMessages = await redis.get(cacheKey);
    } catch (redisError) {
      console.warn("Redis read error in chatHistory, falling back to database:", redisError);
    }

    if (cachedMessages) {
      const parsedMessages = typeof cachedMessages === "string"
        ? JSON.parse(cachedMessages)
        : cachedMessages;
      return res.json({ messages: parsedMessages, sessionId: sessionId });
    }

    // retrieve messages from database and update cache
    const formattedMessages = await updateChatCache(sessionId);
    return res.json({ messages: formattedMessages, sessionId: sessionId });
  } catch (error) {
    console.error("Failed to retrieve messages:", error);
    return res.status(500).json({ error: "Failed to retrieve messages" });
  }
});

export default router;