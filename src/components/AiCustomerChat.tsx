import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Bot,
  User,
  ExternalLink,
  ChevronDown,
  FileText,
  HelpCircle,
  Clock,
  Percent,
  PhoneCall,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
  source?: "ai" | "knowledge_base";
}

const QUICK_QUESTIONS = [
  {
    icon: FileText,
    label: "Required Documents",
    query: "What documents do I need to submit for a loan?",
  },
  {
    icon: Percent,
    label: "Interest Rates",
    query: "What are the latest interest rates for Personal, Business, and Home loans?",
  },
  {
    icon: Clock,
    label: "Approval Time",
    query: "How long does loan approval and verification take?",
  },
  {
    icon: HelpCircle,
    label: "CIBIL Score Needed",
    query: "What is the minimum CIBIL score required to apply?",
  },
  {
    icon: PhoneCall,
    label: "Contact Support",
    query: "How do I contact SSN Wealth Capital customer care?",
  },
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome-1",
  role: "model",
  text: `👋 **Hello! Welcome to SSN Wealth Capital.**\n\nI am your **AI Loan Advisor**. I can instantly answer your questions regarding:\n\n• **Interest Rates & Tenures** for all loan types\n• **Document Checklist** for salaried & business applicants\n• **CIBIL Score & Eligibility** criteria\n• **How to complete & submit** your application form\n\nAsk me anything below, or click any topic to get started!`,
  timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  source: "knowledge_base",
};

// Formatter to render bold text, linebreaks, and bullet lists cleanly
function FormattedMessage({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="text-xs sm:text-[13px] leading-relaxed space-y-1.5 break-words">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet point
        const isBullet = trimmed.startsWith("•") || trimmed.startsWith("- ");
        const lineContent = isBullet ? trimmed.replace(/^[•\-]\s*/, "") : trimmed;

        // Render bold segments (**text**)
        const renderFormattedText = (text: string) => {
          const parts = text.split(/(\*\*.*?\*\*)/g);
          return parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-semibold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          });
        };

        if (isBullet) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1 text-slate-700">
              <span className="text-[#D4AF37] font-bold text-xs mt-0.5">•</span>
              <span className="flex-1">{renderFormattedText(lineContent)}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="text-slate-800">
            {renderFormattedText(line)}
          </p>
        );
      })}
    </div>
  );
}

interface AiCustomerChatProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export function AiCustomerChat({
  isOpen: controlledIsOpen,
  onToggle,
  onNavigateSection,
}: AiCustomerChatProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleOpen = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem("ssn_chat_history");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [INITIAL_MESSAGE];
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, messages, isLoading]);

  // Persist messages in session
  useEffect(() => {
    try {
      sessionStorage.setItem("ssn_chat_history", JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      const data = await res.json();
      const answer =
        data?.answer ||
        "Thank you for contacting SSN Wealth Capital. Please feel free to proceed with your application on this portal or call +91 96002 45924.";

      const aiMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: data?.source,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.warn("Error calling AI chat endpoint:", err);
      const errorMsg: ChatMessage = {
        id: `model-err-${Date.now()}`,
        role: "model",
        text: `I apologize for the temporary connection delay. For immediate assistance with your application, you can reach SSN Wealth Capital directly at **+91 96002 45924** or email **ssnwealthestates@gmail.com**. You can also continue filling your application form above.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "knowledge_base",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        ...INITIAL_MESSAGE,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <>
      {/* Floating Launcher Pill (visible when chat is closed) */}
      {!isOpen && (
        <button
          id="ssn-open-ai-chat-btn"
          type="button"
          onClick={toggleOpen}
          aria-label="Open SSN Loan AI Advisor"
          className="fixed bottom-5 right-5 z-40 group flex items-center gap-2.5 px-4 py-3 bg-[#001F3F] hover:bg-[#002b57] text-[#D4AF37] border-2 border-[#D4AF37] rounded-full shadow-2xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#D4AF37] animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#001F3F] rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#001F3F] rounded-full" />
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-bold tracking-wide text-white flex items-center gap-1.5">
              <span>Ask SSN Loan AI</span>
              <span className="text-[9px] bg-[#D4AF37]/20 text-amber-300 px-1 py-0.2 rounded font-semibold uppercase">
                24/7
              </span>
            </div>
            <div className="text-[10px] text-slate-300 font-normal">
              Instant answers for loans &amp; eligibility
            </div>
          </div>
          <div className="sm:hidden text-xs font-bold text-white">Ask AI</div>
        </button>
      )}

      {/* Floating Chat Modal Box */}
      {isOpen && (
        <div
          id="ssn-ai-chat-window"
          className="fixed bottom-3 right-3 sm:bottom-5 sm:right-5 z-50 w-[calc(100vw-24px)] sm:w-[410px] max-w-[95vw] h-[550px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="bg-[#001F3F] text-white p-3.5 sm:p-4 border-b border-[#D4AF37]/50 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-xl bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37] flex-shrink-0">
                <Bot className="w-5 h-5 text-[#D4AF37]" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#001F3F] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#D4AF37] leading-tight">
                    SSN Loan AI Advisor
                  </h3>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-1.5 py-0.2 rounded-full font-medium">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 leading-tight">
                  SSN Wealth &amp; Estates (OPC) Pvt Ltd
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Restart / Clear Conversation"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={toggleOpen}
                title="Close AI Assistant"
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Suggestion Chips */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0 text-slate-700">
            {QUICK_QUESTIONS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(item.query)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-[#001F3F] hover:text-[#D4AF37] text-slate-700 border border-slate-200 hover:border-[#001F3F] rounded-full shadow-xs whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer disabled:opacity-50"
                >
                  <Icon className="w-3 h-3 text-[#D4AF37]" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 bg-slate-100/60">
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${
                      isUser
                        ? "bg-[#001F3F] text-[#D4AF37]"
                        : "bg-amber-100 text-[#001F3F] border border-[#D4AF37]/50"
                    }`}
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-xs ${
                      isUser
                        ? "bg-[#001F3F] text-white rounded-tr-xs"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-xs"
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs sm:text-[13px] leading-relaxed break-words">
                        {msg.text}
                      </p>
                    ) : (
                      <FormattedMessage content={msg.text} />
                    )}

                    <div
                      className={`text-[9px] mt-1.5 flex items-center justify-between gap-2 ${
                        isUser ? "text-slate-300" : "text-slate-400"
                      }`}
                    >
                      <span>{msg.timestamp}</span>
                      {!isUser && msg.source === "ai" && (
                        <span className="flex items-center gap-0.5 text-[#D4AF37] font-semibold">
                          <Sparkles className="w-2.5 h-2.5" /> Gemini AI
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-amber-100 text-[#001F3F] border border-[#D4AF37]/50 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#001F3F] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-medium ml-1">
                      SSN AI Advisor is typing...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about rates, documents, eligibility..."
                disabled={isLoading}
                className="flex-1 bg-slate-50 text-slate-900 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#001F3F] focus:border-transparent transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="bg-[#001F3F] hover:bg-[#002d5c] disabled:opacity-40 text-[#D4AF37] p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center flex-shrink-0 shadow-sm"
                title="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1.5 flex items-center justify-between text-[9px] text-slate-400 px-1">
              <span>Support: 9600245924</span>
              <span>SSN Wealth Capital Official AI</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
