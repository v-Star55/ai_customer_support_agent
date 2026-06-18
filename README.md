# 🌿 Lumé Support Bot — Premium AI Customer Support

Lumé is a high-fidelity, premium AI-powered customer support chat application designed to simulate live support interactions for a modern lifestyle e-commerce store. 

Built with **React (Vite)**, **TypeScript**, **Express**, **Prisma**, **PostgreSQL**, **Redis**, and the **Google Gemini API** (`gemini-2.5-flash`).

---

## 🚀 Quick Start (Local Setup)

Follow these steps to run the application locally on your machine.

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A running [PostgreSQL](https://www.postgresql.org/) database (e.g. Supabase, local PostgreSQL, or Neon)
- A running [Redis](https://redis.io/) cache server (e.g. Upstash Redis)

---

### 2. Environment Variables Configuration

Create a `.env` file in the `/server` directory and configure the following:

```env
PORT=5000

# PostgreSQL Connection Strings
# For migration tasks (direct connection to Postgres)
DIRECT_URL="postgresql://username:password@hostname:5432/databasename"
# Transaction pool connection string
DATABASE_URL="postgresql://username:password@hostname:6543/databasename?pgbouncer=true"

# Gemini API Key (Generate one at Google AI Studio)
GEMINI_API="your-gemini-api-key-here"

# Upstash Redis Credentials for memory caching
UPSTASH_REDIS_REST_URL="https://your-redis-instance-name.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token-here"
```

Create a `.env` file in the `/client` directory:

```env
VITE_API_URL="http://localhost:5000/api"
```

---

### 3. Database Initialization & Setup

Deploy the database schema using Prisma:

1. Navigate to the `/server` directory.
2. Run database migration sync:
   ```bash
   npm install
   npx prisma db push
   ```
   *Note: This command will generate the local Prisma Client inside `server/src/generated/prisma` and synchronise the models to your active PostgreSQL instance.*

---

### 4. Running Client and Server

#### Run the Backend Server
```bash
cd server
npm run dev
```
The server will run on `http://localhost:5000` with hot-reloading active.

#### Run the Frontend Client
```bash
cd client
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🏛️ System Architecture Overview

The project uses a clean **layered separation of concerns** pattern:

```
                  ┌───────────────────────┐
                  │   React Chat Client   │
                  │   (Vite + Tailwind)   │
                  └───────────┬───────────┘
                              │
                    HTTP / JSON / Cookies
                              │
                              ▼
                  ┌───────────────────────┐
                  │    Express Server     │
                  │  (TypeScript Router)  │
                  └─────┬───────────┬─────┘
                        │           │
          Check Cache   │           │   Fetch / Save Message
         & Save History │           │   To Persistent Store
                        ▼           ▼
                  ┌─────────┐   ┌─────────┐
                  │  Redis  │   │ Prisma  │ ──► PostgreSQL
                  │ (Cache) │   │  (ORM)  │
                  └─────────┘   └─────────┘
                        ▲
                        │
                  Format Chat History & Query
                        │
                        ▼
                  ┌─────────┐
                  │ Gemini  │
                  │   API   │
                  └─────────┘
```

### 📂 Folder Structure
*   **`/client`**: The UI codebase.
    *   `src/App.tsx`: The primary chat controller managing scroll states, key triggers, loaders, and dark mode hooks.
    *   `src/components`: UI components including standard styling for the suggested question tags and navbar.
    *   `src/utils`: Utilities for custom markdown parsing (bold, lists, code styles) and API error formatting.
*   **`/server`**: The API backend.
    *   `src/index.ts`: Entry file setting up body-parser, cookie-parser, and CORS rules.
    *   `src/routes`: Contains `/chat` route handlers mapping endpoints for session generation (`/new`), message posting (`/stream`), and chat recovery (`/history`).
    *   `src/services/gemini.ts`: Encapsulation layer for LLM prompt configuration and model triggers.
    *   `src/lib`: Singletons for Redis connections, Prisma client exports, and database instances.

---

## 🧠 LLM Prompting & Memory Strategy

### 1. Model Selection
We use `gemini-2.5-flash` via the official Google GenAI SDK (`@google/genai`). It provides lightning-fast response latency suitable for real-time customer service simulation.

### 2. Prompt Engineering
The system prompt (FAQ knowledge base + instructions) is completely decoupled from the user's message using the native `systemInstruction` configuration. This prevents instruction injection attacks and forces model compliance.

Key instructions:
- **System Prompt**: Seeding detailed guidelines containing Lumé store policy data (Refund rules, Domestic/International delivery timelines, Support hours, Payment gateways, order cancellation terms).
- **Hard Guardrails**: *"Answer only using the store knowledge. If information is unavailable, say: 'I don't have that information.'"*

### 3. Contextual Memory Workflow
Unlike basic chatbot implementations, Lumé preserves complete conversation memory:
1.  **Retrieve History**: On receiving a new query, the server first attempts to read history from Redis cache. If expired, it queries PostgreSQL via Prisma.
2.  **Mapping Roles**: Previous messages are formatted into Gemini-compliant structure (e.g. converting `USER` to `'user'` and `ASSISTANT` to `'model'`).
3.  **In-flight Context Submission**: The history sequence is passed in the `contents` parameter array of the `generateContent` call along with the current question.
4.  **Optimized Caching**: After generation, we append both user question and response to our local history array and push it to Redis with a TTL of 2 hours, keeping database reads at a minimum.

---

## ⚖️ Trade-offs & Future Improvements

### Trade-offs Made
- **Cookie Session-ID**: Session ID management uses HTTP-only browser cookies for convenience. A header-based token system (`Authorization` or query parameters) would be preferred if this were integrated into a native app or third-party CRM chat widget.
- **RAG vs Context Windows**: Policy details are hardcoded directly in the prompt. While this is cost-effective and highly reliable for small-medium stores, a real production bot would leverage RAG (Retrieval-Augmented Generation) from a Vector database to fetch only relevant context on-demand for massive catalogs.

### If I Had More Time...
- **Real-Time Token Streaming**: Implement SSE (Server-Sent Events) to stream response tokens word-by-word into the React client interface, raising visual responsiveness.
- **Auto-Summarization**: Summarize history if a conversation goes beyond 20 turns, keeping token counts low and preventing prompt fatigue.
- **Interactive Tools**: Add function calling to let the bot query actual Order Status APIs from a mock shipping database using the user's order ID.
