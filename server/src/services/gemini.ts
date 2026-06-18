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
  "I'm sorry, I don't have details about that request on hand. Please feel free to email our customer care team at support@lumestore.com and we'll resolve it for you!"
`;

  return ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contentsList,
    config: {
      systemInstruction,
    },
  });
}