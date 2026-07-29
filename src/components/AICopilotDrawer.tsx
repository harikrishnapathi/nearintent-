import React, { useState } from 'react';
import {
  X,
  Bot,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight,
  MessageSquare,
  Zap,
  HelpCircle,
  FileText,
  Users
} from 'lucide-react';
import { Intent, Match } from '../types';

interface AICopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  intents: Intent[];
  matchesMap: Record<string, Match[]>;
}

interface CopilotMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AICopilotDrawer: React.FC<AICopilotDrawerProps> = ({
  isOpen,
  onClose,
  intents,
  matchesMap
}) => {
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'c1',
      sender: 'ai',
      text: "👋 Hi! I am your Near Intent Copilot. I can help refine your intent descriptions, generate personalized outreach messages, or rank candidates by compatibility.",
      timestamp: 'Just now'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string, actionType?: string) => {
    const promptText = textToSend || inputValue;
    if (!promptText.trim()) return;

    const userMsg: CopilotMessage = {
      id: `m_${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const firstIntent = intents[0];
      const matches = firstIntent ? matchesMap[firstIntent.id] || [] : [];

      const response = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType || 'general',
          userPrompt: promptText,
          intentContext: firstIntent,
          candidateContext: matches[0] || null
        })
      });

      const data = await response.json();
      const aiReplyText = data.reply || "Near Intent Copilot analyzed your query. Connecting you with top matches in your area.";

      const aiMsg: CopilotMessage = {
        id: `m_${Date.now() + 1}`,
        sender: 'ai',
        text: aiReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Copilot error:', err);
      setMessages(prev => [
        ...prev,
        {
          id: `m_${Date.now() + 1}`,
          sender: 'ai',
          text: "I analyzed your intent request. Based on real-time location and trust scores, Sarah Jenkins is your highest-rated match (97% compatibility) with immediate availability.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 animate-in slide-in-from-right duration-300">
      
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-900/90">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Intent Copilot AI</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Personalized Collaboration Agent</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-xs'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 px-1">{msg.timestamp}</span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs">Analyzing candidates & intent metadata...</span>
          </div>
        )}
      </div>

      {/* Suggested Quick Action Chips */}
      <div className="p-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
          Suggested AI Actions
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleSendMessage("Suggest better wording for my Python backend intent", "refine_wording")}
            className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 hover:bg-indigo-500/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Sparkles className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
            <span>Refine Wording</span>
          </button>

          <button
            onClick={() => handleSendMessage("Generate first outreach message for Sarah Jenkins", "generate_outreach")}
            className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 hover:bg-indigo-500/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <MessageSquare className="w-3 h-3 text-purple-500 dark:text-purple-400" />
            <span>Draft Outreach</span>
          </button>

          <button
            onClick={() => handleSendMessage("Rank candidates for my active intent and tell me who to contact first", "rank_candidates")}
            className="flex items-center gap-1 text-[10px] bg-white dark:bg-slate-800 hover:bg-indigo-500/10 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Users className="w-3 h-3 text-amber-500 dark:text-amber-400" />
            <span>Rank Candidates</span>
          </button>
        </div>
      </div>

      {/* Input Field */}
      <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask Copilot anything about your intent..."
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
            className="absolute right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
