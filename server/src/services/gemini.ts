import { GoogleGenAI } from "@google/genai";
import { STORE_KNOWLEDGE } from "../lib/store.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API,
});

export async function askStoreBot(history: { role: string; content: string }[], message: string) {
  const contentsList = history.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  contentsList.push({
    role: "user",
    parts: [{ text: message }],
  });

  const systemInstruction = `
You are a helpful customer support agent for Lumé Store, a modern e-commerce store selling lifestyle products.

STORE KNOWLEDGE BASE:
${STORE_KNOWLEDGE}

Instructions:
- Answer only using the store knowledge.
- If information is unavailable, say:
  "I don't have that information."
`;

  return ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contentsList,
    config: {
      systemInstruction,
    },
  });
}