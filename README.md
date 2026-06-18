# Lumé Support Bot — Premium AI Customer Support

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
FRONTEND_URL=""

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
   *Note: This command will generate the local Prisma Client inside `server/src/generated/prisma` and synchronize the models to your active PostgreSQL instance.*

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
                  │ (Vite + Tailwind/CSS) │
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
    *   `src/App.tsx`: The primary chat controller managing scroll states, key triggers, loaders, dark mode hooks, and session synchronization.
    *   `src/components`: UI components including the suggested question tags and navbar.
    *   `src/api/chatApi.ts`: Client API methods supporting session-based requests.
*   **`/server`**: The API backend.
    *   `src/index.ts`: Entry file setting up body-parser, cookie-parser, and CORS rules.
    *   `src/routes`: Contains `/chat` route handlers mapping endpoints for session generation (`/new`), message posting (`/stream`), and chat recovery (`/history`).
    *   `src/lib/cache.ts`: Resilient cache manager implementing robust synchronization between Redis and PostgreSQL.
    *   `src/services/gemini.ts`: Encapsulation layer for LLM prompt configuration and model triggers.
    *   `src/lib`: Singletons for Redis connections, Prisma client exports, and database instances.

---

## 🔗 Session Management & URL Syncing

Lumé includes a robust, client-first session state management mechanism:
- **URL Synchronization**: The active `sessionId` is synchronized to the URL's query parameters (`?sessionId=<id>`) using `window.history.replaceState`. This makes sharing chat sessions or copying URLs simple.
- **Dynamic Generation**: When starting a "New Chat", the client generates a unique `sessionId` (via `nanoid`), clears the state, and updates the URL.
- **Multimodal Identification**: The backend resolves the user's session ID by checking query parameters (`req.query.sessionId`), the request body (`req.body.sessionId`), or the HTTP-only cookie fallback (`req.cookies.chat_sessionId`).
- **Database Uniqueness**: To guarantee data integrity and prevent collision, the `session_id` field in the database `Conversation` schema is marked `@unique`.

---

## 🛡️ Resilient Caching & Persistence Strategy

Lumé implements a highly resilient, fail-soft caching architecture designed to remain operational even during service disruptions:
1. **Centralized Cache Manager**: The helper `server/src/lib/cache.ts` manages Redis caching. It automatically synchronizes data between PostgreSQL and Redis.
2. **Graceful Fallbacks**: If Redis goes offline or runs into write/read limits, the system catches the exceptions and falls back directly to the PostgreSQL database. This ensures continuous, uninterrupted chat service.
3. **Validation & Error Logging**:
   - If a message exceeds `MAX_MESSAGES_LENGTH` (1000 characters), the error and the original query are persisted to the database and cached.
   - If a backend API error occurs (e.g. Gemini quota issues), the error message is recorded in the conversation stream so the user sees the inline error.
4. **Contextual Memory Workflow**:
   - Previous messages are formatted into a Gemini-compliant format (e.g. mapping roles like `USER` to `'user'` and `ASSISTANT` to `'model'`).
   - The mapped history is injected into the `generateContent` payload array along with the new question.
   - Cached histories in Redis are set with a TTL of 2 hours.

---

## 🧠 LLM Prompting & Memory Strategy

### 1. Model Selection
We use `gemini-2.5-flash` via the official Google GenAI SDK (`@google/genai`). It provides lightning-fast response latency suitable for real-time customer service simulation.

### 2. Prompt Engineering
The system prompt (FAQ knowledge base + instructions) is completely decoupled from the user's message using the native `systemInstruction` configuration. This prevents instruction injection attacks and forces model compliance.

Key instructions:
- **System Prompt**: Seeding detailed guidelines containing Lumé store policy data (Refund rules, Domestic/International delivery timelines, Support hours, Payment gateways, order cancellation terms).
- **Hard Guardrails**: *"Answer only using the store knowledge. If information is unavailable, say: 'I don't have that information.'"*

---

## ⚖️ Trade-offs & Future Improvements

### Trade-offs Made
- **Client-Generated Session-ID**: Session ID is generated on the client via `nanoid()` when a new session is initialized. This enables URL parameters to be clean from step one.
- **Resilient Fallback Overhead**: When Redis is down, querying the database on every message incurs extra latency compared to the cache, but ensures the chat never crashes.
- **In-Memory System Prompt**: Policy details are hardcoded directly in the prompt. For larger scale catalogs, a Retrieval-Augmented Generation (RAG) system with a vector database (e.g. Pinecone/pgvector) would be preferred to save context window tokens.

### Future Enhancements
- **Real-Time Token Streaming**: Implement Server-Sent Events (SSE) to stream tokens in real-time, improving perceived latency.
- **Interactive Tools**: Add function calling to let the bot query actual Order Status APIs from a mock shipping database using the user's order ID.
