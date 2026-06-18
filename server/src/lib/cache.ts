import { redis } from "./redis.js";
import { prisma } from "./prisma.js";

const CACHE_TTL = 60 * 60 * 2; // 2 hours

/**
 * Updates the Redis cache for a given session.
 * If messages are provided, it caches them directly.
 * Otherwise, it queries the database, formats the messages, updates Redis, and returns them.
 */
export async function updateChatCache(
  sessionId: string,
  messages?: { role: string; content: string }[]
): Promise<{ role: string; content: string }[]> {
  const cacheKey = `session:${sessionId}`;

  if (messages) {
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(messages));
    } catch (redisError) {
      console.warn("Redis write error in updateChatCache:", redisError);
    }
    return messages;
  }

  try {
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

    if (!conversation) {
      return [];
    }

    const formattedMessages = conversation.messages.map((message: { sender: string; content: string }) => ({
      role: message.sender === "USER" ? "user" : "assistant",
      content: message.content,
    }));

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(formattedMessages));
    } catch (redisError) {
      console.warn("Redis write error in updateChatCache:", redisError);
    }

    return formattedMessages;
  } catch (error) {
    console.error("Failed to update chat cache:", error);
    return [];
  }
}
