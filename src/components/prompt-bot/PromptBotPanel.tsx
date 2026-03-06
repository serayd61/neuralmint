"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Copy, Sparkles, Bot } from "lucide-react";
import { motion } from "framer-motion";
import { PromptScoreBadge } from "@/components/shared/PromptScoreBadge";
import { PROMPT_TIER_CONFIG, getPromptTier } from "@/lib/prompt-utils";
import type { ChatMessage, PromptSuggestion } from "@/lib/types";

interface PromptBotPanelProps {
  onClose: () => void;
  onApplyPrompt: (prompt: string) => void;
  selectedModel: string;
}

export function PromptBotPanel({ onClose, onApplyPrompt, selectedModel }: PromptBotPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "system-welcome",
      role: "assistant",
      content: "Hey! I'm PromptGenius, your AI prompt engineering assistant. Describe the NFT you want to create, and I'll craft the perfect prompt for you with scoring.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/prompt-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          model: selectedModel,
        }),
      });

      const data = await res.json();

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I couldn't generate suggestions. Please try again.",
        timestamp: Date.now(),
        suggestions: data.suggestions || [],
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "tween", duration: 0.3 }}
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 flex flex-col border-l border-white/10"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,26,0.98), rgba(5,5,16,0.99))",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(0,229,255,0.1)", border: "1px solid rgba(0,229,255,0.2)" }}
          >
            <Bot size={16} className="text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-primary">PromptGenius</h3>
            <p className="text-[10px] text-text-muted">AI Prompt Engineer</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-full p-2 text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id}>
            {/* Message bubble */}
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs leading-relaxed max-w-[90%] ${
                msg.role === "user"
                  ? "ml-auto bg-neon-cyan/10 border border-neon-cyan/20 text-text-primary"
                  : "bg-neon-purple/8 border border-neon-purple/15 text-text-secondary"
              }`}
            >
              {msg.content}
            </div>

            {/* Suggestions */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="mt-3 space-y-2.5">
                {msg.suggestions.map((suggestion, i) => (
                  <SuggestionCard
                    key={i}
                    suggestion={suggestion}
                    index={i + 1}
                    onApply={() => onApplyPrompt(suggestion.prompt)}
                    onCopy={() => handleCopy(suggestion.prompt)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <Loader2 size={14} className="animate-spin text-neon-purple" />
            Crafting prompts...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Describe your NFT vision..."
            className="flex-1 rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-cyan/50 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="rounded-lg border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-2.5 text-neon-cyan hover:bg-neon-cyan/20 transition-colors disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-text-muted text-center">
          Powered by GPT-4o-mini · Target: {selectedModel === "dall-e-3" ? "DALL·E 3" : "Stable Diffusion"}
        </p>
      </div>
    </motion.div>
  );
}

function SuggestionCard({
  suggestion,
  index,
  onApply,
  onCopy,
}: {
  suggestion: PromptSuggestion;
  index: number;
  onApply: () => void;
  onCopy: () => void;
}) {
  const tier = getPromptTier(suggestion.score);
  const tierConfig = PROMPT_TIER_CONFIG[tier];

  return (
    <div
      className="rounded-xl p-3 space-y-2"
      style={{ background: tierConfig.bgColor, border: `1px solid ${tierConfig.borderColor}` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-text-muted">Suggestion {index}</span>
        <PromptScoreBadge score={suggestion.score} size="sm" showLabel />
      </div>
      <p className="text-[11px] text-text-secondary font-mono leading-relaxed line-clamp-4">
        {suggestion.prompt}
      </p>
      {suggestion.improvements.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestion.improvements.map((imp, i) => (
            <span key={i} className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-text-muted">
              + {imp}
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={onApply}
          className="flex-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 py-1.5 text-[11px] font-medium text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
        >
          <span className="inline-flex items-center justify-center gap-1">
            <Sparkles size={10} /> Apply
          </span>
        </button>
        <button
          onClick={onCopy}
          className="rounded-md border border-white/10 bg-bg-card px-3 py-1.5 text-[11px] text-text-muted hover:text-text-primary transition-colors"
        >
          <Copy size={10} />
        </button>
      </div>
    </div>
  );
}
