import React, { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "@tanstack/react-router";
import { HelpCircle, Sparkles, Send, X, Loader2, User, Tractor } from "lucide-react";
import { useFarmerProfile } from "@/lib/farmer/use-farmer";
import { askFarmerRamu, ChatMessage } from "@/lib/api/farmer-copilot-service";

export function FarmerCopilot() {
  const { data: farmer, isLoading: isProfileLoading } = useFarmerProfile();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Ramu should only render on paths starting with /farmer-portal
  const isFarmerPortal = location.pathname.startsWith("/farmer-portal");

  useEffect(() => {
    if (messages.length === 0 && farmer) {
      setMessages([
        {
          role: "model",
          content: `Hello **${farmer.full_name}**! Welcome to **Prajnaa Marketplace**. Ramu at your service! 👨‍🌾\n\nI am your personal **Marketplace Success Manager**. I am here to help you manage your shop and grow your sales. You can ask me:\n- **Check your onboarding / KYC status** (e.g. *"What is my KYC status?"*)\n- **Check stock alerts** (e.g. *"Show low stock"*)\n- **Generate product descriptions** (e.g. *"Generate description for Ghee"*)\n- **Audit product photos** (e.g. *"Audit my product images"*)\n- **Track payouts and settlements** (e.g. *"How much have I earned?"*)\n- **View pending orders** (e.g. *"Which orders need packing?"*)\n\nHow can I help you today?`,
        },
      ]);
      setUnreadCount(1);
    }
  }, [messages.length, farmer]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isFarmerPortal || !farmer) return null;

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const chatHistory = messages.filter((m) => m.role !== "system");
      const response = await askFarmerRamu(text, farmer.user_id, chatHistory);
      setMessages((prev) => [...prev, { role: "model", content: response }]);
    } catch (error) {
      console.error("Failed to ask Ramu:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: "Sorry, I ran into an issue connecting to my knowledge base. Please try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage(inputValue);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  // Custom inline markdown parser to safely render markdown inside the chat
  function renderMarkdown(text: string) {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // 1. Headers
      if (line.startsWith("### ")) {
        return (
          <h4 key={idx} className="font-display font-semibold text-foreground mt-3 mb-1 text-sm">
            {parseInline(line.substring(4))}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3 key={idx} className="font-display font-bold text-foreground mt-4 mb-1.5 text-base">
            {parseInline(line.substring(3))}
          </h3>
        );
      }
      // 2. Unordered lists
      if (line.startsWith("- ") || line.startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs leading-relaxed text-foreground/90 mt-1">
            {parseInline(line.substring(2))}
          </li>
        );
      }
      // 3. Numbered lists
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <li key={idx} className="ml-4 list-decimal text-xs leading-relaxed text-foreground/90 mt-1">
            {parseInline(numMatch[2])}
          </li>
        );
      }
      // 4. Tables
      if (line.startsWith("|")) {
        if (line.includes("---")) return null;
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c !== "");
        if (cells.length === 0) return null;
        return (
          <div key={idx} className="grid grid-cols-4 gap-1 border-b border-border/40 py-1 text-[11px] font-medium">
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className={cIdx === 0 ? "font-bold text-foreground col-span-2" : "text-muted-foreground"}>
                {parseInline(cell)}
              </span>
            ))}
          </div>
        );
      }
      // 5. Normal paragraphs
      if (line.trim() === "") return <div key={idx} className="h-1.5" />;
      return (
        <p key={idx} className="text-xs leading-relaxed text-foreground/90 mt-1">
          {parseInline(line)}
        </p>
      );
    });
  }

  function parseInline(inlineText: string) {
    let segments: React.ReactNode[] = [];
    
    // Parse links [text](url)
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    let lastIdx = 0;
    
    while ((match = linkRegex.exec(inlineText)) !== null) {
      const start = match.index;
      const text = match[1];
      const url = match[2];
      
      if (start > lastIdx) {
        segments.push(inlineText.substring(lastIdx, start));
      }
      
      if (url.startsWith("/")) {
        segments.push(
          <Link
            to={url as any}
            key={start}
            onClick={() => setIsOpen(false)} // Close assistant when navigating
            className="text-amber-800 hover:underline font-semibold"
          >
            {text}
          </Link>
        );
      } else {
        segments.push(
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            key={start}
            className="text-amber-800 hover:underline font-semibold"
          >
            {text}
          </a>
        );
      }
      lastIdx = linkRegex.lastIndex;
    }
    
    if (lastIdx < inlineText.length) {
      segments.push(inlineText.substring(lastIdx));
    }
    
    if (segments.length === 0) {
      segments = [inlineText];
    }
    
    // Parse bold **text**
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const finalSegments: React.ReactNode[] = [];
    
    segments.forEach((seg, sIdx) => {
      if (typeof seg !== "string") {
        finalSegments.push(seg);
        return;
      }
      
      let bMatch;
      let bLastIdx = 0;
      const bSegments: React.ReactNode[] = [];
      
      while ((bMatch = boldRegex.exec(seg)) !== null) {
        const bStart = bMatch.index;
        const bText = bMatch[1];
        
        if (bStart > bLastIdx) {
          bSegments.push(seg.substring(bLastIdx, bStart));
        }
        
        bSegments.push(
          <strong key={bStart} className="font-semibold text-foreground">
            {bText}
          </strong>
        );
        bLastIdx = boldRegex.lastIndex;
      }
      
      if (bLastIdx < seg.length) {
        bSegments.push(seg.substring(bLastIdx));
      }
      
      finalSegments.push(...bSegments);
    });
    
    return finalSegments;
  }

  const suggestions = [
    { label: "KYC Status", text: "What is my KYC and onboarding status?" },
    { label: "Description Generator", text: "Generate description for Turmeric Powder" },
    { label: "Low stock alerts", text: "Show low stock alerts" },
    { label: "Incoming orders", text: "Which orders need packing?" }
  ];

  return (
    <>
      {/* Floating Action Button (Farmer Themed clay-brown) */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-amber-800 hover:bg-amber-700 text-white shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer group hover:shadow-amber-900/30"
        title="Ask Ramu (Farmer Success AI)"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-300 rotate-90" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Tractor className="h-6 w-6" />
            <Sparkles className="h-3 w-3 absolute -top-1.5 -right-1.5 text-amber-300 animate-pulse" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-bold text-amber-950 animate-bounce">
                {unreadCount}
              </span>
            )}
          </div>
        )}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[550px] max-h-[80vh] flex flex-col rounded-3xl bg-background border border-border shadow-2xl overflow-hidden animate-scale-up">
          
          {/* Header (Clay brown theme for Ramu) */}
          <div className="flex items-center justify-between bg-gradient-to-r from-amber-900/95 to-amber-800 p-4 text-white border-b border-border/10">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 border border-white/20">
                <Tractor className="h-5 w-5 text-amber-200" />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold tracking-wide">Ramu (Farmer Success)</h3>
                <span className="text-[10px] text-amber-200/80 flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Marketplace Success Manager · Online
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white rounded-full p-1 bg-white/10 hover:bg-white/20 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-amber-50/10">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2.5 max-w-[85%] ${
                  m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border text-[10px] ${
                    m.role === "user"
                      ? "bg-secondary border-border text-foreground"
                      : "bg-amber-100 border-amber-200 text-amber-900 font-bold"
                  }`}
                >
                  {m.role === "user" ? <User className="h-3.5 w-3.5" /> : "R"}
                </div>

                {/* Message bubble */}
                <div
                  className={`rounded-2xl p-3 shadow-sm text-xs ${
                    m.role === "user"
                      ? "bg-amber-800 text-white rounded-tr-none"
                      : "bg-card border border-border/80 text-foreground rounded-tl-none"
                  }`}
                >
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  ) : (
                    <div className="space-y-1">{renderMarkdown(m.content)}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading / Typing Indicator */}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 border bg-amber-100 border-amber-200 text-amber-900 font-bold">
                  👨‍🌾
                </div>
                <div className="rounded-2xl p-3 shadow-sm bg-card border border-border/80 text-foreground rounded-tl-none flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-800" />
                  <span className="text-[10px] text-muted-foreground font-medium">Analyzing dashboard data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions block (when typing is empty) */}
          {inputValue.trim() === "" && !isLoading && (
            <div className="px-4 py-2 border-t border-border/40 bg-amber-50/5 overflow-x-auto flex gap-2 no-scrollbar">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(s.text)}
                  className="shrink-0 text-[10px] font-semibold bg-card border border-border hover:border-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-50/20 text-foreground/80 cursor-pointer transition-all duration-200"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Input form */}
          <div className="p-3 border-t border-border bg-background flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask Ramu about KYC, listings, payouts..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              className="flex-1 font-subhead h-10 px-3 rounded-full border border-border focus:border-amber-800 text-xs outline-none bg-secondary/25 focus:bg-background transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-800 hover:bg-amber-700 text-white disabled:opacity-40 transition cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
