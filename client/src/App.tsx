import { useState, useEffect, useRef } from "react";
import { chatStream, getChatHistory,newChat } from "./api/chatApi";
import { TbSend2, TbUser } from "react-icons/tb";
import Navbar from "./components/Navbar";
import SuggestedQuestions from "./components/SuggestedQuestions";
import { SyncLoader } from "react-spinners";
import { parseMarkdown } from "./utils/markdown";
import { getErrorMessage } from "./utils/error";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function getGreeting(hour: number): string {
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

function updateLastAssistantMessage(messages: ChatMessage[], newContent: string): ChatMessage[] {
  const newMsgs = [...messages];
  if (newMsgs.length > 0 && newMsgs.at(-1)!.role === "assistant") {
    newMsgs[newMsgs.length - 1] = {
      role: "assistant",
      content: newContent,
    };
  }
  return newMsgs;
}

function App() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("lume-theme") === "dark";
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hour = new Date().getHours();
  const greetingText = getGreeting(hour);

  // Apply dark class to <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("lume-theme", isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const response = await getChatHistory();
        setMessages(response.messages || []);
      } catch {
        // silently handle
      }
      setLoading(false);
    };
    fetchMessages();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea height based on content
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [question]);

  const handleSendMessage = async () => {
    if (!question.trim() || isStreaming) return;
    const userQ = question;
    setQuestion("");
    setMessages((prev) => [
      ...prev,
      { role: "user", content: userQ },
      { role: "assistant", content: "" },
    ]);
    setIsStreaming(true);
    try {
      const response = await chatStream(userQ);
      setMessages((prev) => updateLastAssistantMessage(prev, response));
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      setMessages((prev) => updateLastAssistantMessage(prev, errorMessage));
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  };

  const handleNewChat = async () => {
    setLoading(true);
    try {
      const response = await newChat();
      setMessages(response.messages || []);
    } catch (error) {
      console.log("Error creating new chat", error);
    }
    setLoading(false);
    setQuestion("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-black relative overflow-hidden">
      <Navbar onNewChat={handleNewChat} isDark={isDark} onToggleDark={() => setIsDark(!isDark)} />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col pt-24 pb-36 px-4 relative z-10">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-1">
          {/* Loading */}
          {loading && (
            <div className="flex-1 flex items-center justify-center py-20">
              <SyncLoader color={isDark ? "#D4AF37" : "#0A4834"} size={10} margin={4} speedMultiplier={0.8} />
            </div>
          )}

          {/* Empty state */}
          {!loading && messages.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-28 gap-5"
              style={{ animation: "float-in 0.8s ease-out" }}
            >
              <div className="text-center space-y-2">
                <h2 className="font-display text-5xl font-light text-black dark:text-cream tracking-wide">
                  {greetingText}
                </h2>
                <p className="font-body text-lg font-light text-gold-dim dark:text-gold-light tracking-wide max-w-md">
                  Welcome to Lumé Support. How may I assist you today?
                </p>
              </div>
              <SuggestedQuestions
                currentQuestion={question}
                onSelectQuestion={(q) => {
                  setQuestion(q);
                  inputRef.current?.focus();
                }}
              />
            </div>
          )}

          {/* Messages */}
          {!loading &&
            messages.map((msg, idx) => {
              const isLastMessage = idx === messages.length - 1;
              const isAssistantLoading = msg.role === "assistant" && !msg.content && isStreaming && isLastMessage;

              if (msg.role === "assistant" && !msg.content && !isAssistantLoading) return null;
              return (
                <div
                  key={idx}
                  className={`flex gap-3 py-3 px-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  style={{ animation: `float-in 0.4s ease-out ${idx * 0.05}s both` }}
                >
                  {/* Assistant avatar */}
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-forest/10 dark:bg-cream/10 border border-forest/15 dark:border-cream/15 flex items-center justify-center shrink-0 mt-1">
                      <span className="font-display text-xs font-semibold text-forest dark:text-cream">L</span>
                    </div>
                  )}

                  {/* Bubble */}
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3.5 font-body text-sm leading-relaxed tracking-wide ${
                      msg.role === "user"
                        ? "bg-forest text-white rounded-br-md"
                        : "bg-white dark:bg-white/6 border border-cream-dark/50 dark:border-white/8 text-black/85 dark:text-cream/90 rounded-bl-md shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                    }`}
                  >
                    {isAssistantLoading ? (
                      <div className="flex items-center justify-start py-1">
                        <SyncLoader
                          color={isDark ? "#D4AF37" : "#0A4834"}
                          size={8}
                          margin={3}
                          speedMultiplier={0.8}
                        />
                      </div>
                    ) : (
                      parseMarkdown(msg.content)
                    )}
                  </div>

                  {/* User avatar */}
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-gold/15 border border-gold/20 flex items-center justify-center shrink-0 mt-1">
                      <TbUser className="text-gold-dim dark:text-gold-light text-xs" />
                    </div>
                  )}
                </div>
              );
            })}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-6 pt-4 px-4">
        <div className="absolute inset-0 bg-linear-to-t from-white dark:from-black via-white/90 dark:via-black/90 to-transparent pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div
            className="flex items-end gap-3 rounded-[24px] px-5 py-2.5
              border border-black/[0.06] dark:border-white/[0.08]
              shadow-[0_4px_20px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.8)]
              dark:shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.04)]
              transition-all duration-300
              focus-within:border-forest/25 dark:focus-within:border-cream/20
              focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.06),0_0_0_3px_rgba(10,72,52,0.08)]"
            style={{
              background: isDark
                ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
                : "linear-gradient(135deg, rgba(235,225,207,0.45) 0%, rgba(235,225,207,0.25) 100%)",
              backdropFilter: "blur(20px) saturate(1.6)",
              WebkitBackdropFilter: "blur(20px) saturate(1.6)",
            }}
          >
            <textarea
              id="chat-input"
              ref={inputRef}
              rows={1}
              placeholder="Ask anything..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              className="flex-1 bg-transparent border-none outline-none font-body text-sm font-light text-black dark:text-white placeholder-gold-dim/60 dark:placeholder-white/40 tracking-wide disabled:opacity-50 resize-none min-h-[24px] max-h-32 py-[7px] overflow-y-auto no-scrollbar"
            />
            <button
              id="send-button"
              onClick={handleSendMessage}
              disabled={isStreaming || !question.trim()}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0
                border-none cursor-pointer transition-all duration-300
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:shadow-[0_4px_12px_rgba(10,72,52,0.25)]
                active:scale-90 mb-0.5"
              style={{
                background: question.trim() && !isStreaming
                  ? "#0A4834"
                  : isDark ? "rgba(255,255,255,0.06)" : "rgba(10,72,52,0.08)",
              }}
            >
              <TbSend2 className={`text-base ${question.trim() && !isStreaming ? "text-white" : "text-forest/40 dark:text-cream/30"}`} />
            </button>
          </div>

          <p className="text-center font-body text-[10px] font-light text-gold-dim/50 dark:text-white/50 tracking-widest mt-3 uppercase">
            Lumé may make mistakes · Verify important information
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
