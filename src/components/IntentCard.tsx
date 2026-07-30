import React, { useEffect, useState } from 'react';
import {
  Clock,
  MapPin,
  Users,
  MessageSquare,
  Sparkles,
  Zap,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Trash2,
  CheckCircle2,
  Globe,
  Handshake
} from 'lucide-react';
import { Intent, UserProfile } from '../types';

interface IntentCardProps {
  intent: Intent;
  currentUser?: UserProfile;
  onSelect: (intent: Intent) => void;
  onStartChat: (intent: Intent) => void;
  onBoost: (intentId: string) => void;
  onAcceptIntent?: (intent: Intent) => void;
  onDelete?: (intentId: string) => void;
}

export const IntentCard: React.FC<IntentCardProps> = ({
  intent,
  currentUser,
  onSelect,
  onStartChat,
  onBoost,
  onAcceptIntent,
  onDelete
}) => {
  const [timeLeftStr, setTimeLeftStr] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = intent.expiresAt - now;

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeftStr('Expired');
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const hours = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeftStr(`${days}d ${hours % 24}h left`);
      } else if (hours > 0) {
        setTimeLeftStr(`${hours}h ${mins}m left`);
      } else {
        setTimeLeftStr(`${mins}m ${secs}s left`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [intent.expiresAt]);

  const getUrgencyBadge = () => {
    switch (intent.urgency) {
      case 'Immediate':
        return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/40 animate-pulse';
      case 'Urgent':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40';
      case 'High':
        return 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const getCategoryColor = () => {
    switch (intent.category) {
      case 'Emergency/Health':
        return 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/30';
      case 'Sports/Fitness':
        return 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'Startup/Tech':
        return 'text-indigo-700 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
      case 'Services/Trades':
        return 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Co-founder/Networking':
        return 'text-purple-700 dark:text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-blue-700 dark:text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  const isOwner = currentUser?.id === intent.creatorId;
  const isServing = intent.status === 'serving' || intent.status === 'accepted';
  const isAcceptedByMe = intent.acceptedByUserId === currentUser?.id;

  return (
    <div className={`group bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-900 border transition-all rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md relative overflow-hidden ${
      isExpired ? 'opacity-60 border-slate-200 dark:border-slate-800' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10'
    }`}>
      
      {/* Top Banner: Urgency & Ownership & Countdown Expiration */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryColor()}`}>
            {intent.category}
          </span>
          {isOwner && (
            <span className="text-[10px] font-extrabold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
              Your Posted Intent
            </span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${getUrgencyBadge()}`}>
            {intent.urgency === 'Immediate' && <AlertTriangle className="w-3 h-3 text-rose-500 dark:text-rose-400" />}
            {intent.urgency}
          </span>
        </div>

        {/* Expiration Timer Badge */}
        <div className={`flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded-lg border shrink-0 ${
          intent.urgency === 'Immediate'
            ? 'bg-rose-500/10 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800/80 font-bold'
            : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 font-semibold'
        }`}>
          <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{timeLeftStr}</span>
        </div>
      </div>

      {/* Main Content Title & Raw Prompt */}
      <div className="space-y-2 mb-4 cursor-pointer" onClick={() => onSelect(intent)}>
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors line-clamp-2">
          {intent.title}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed italic">
          "{intent.rawPrompt}"
        </p>
      </div>

      {/* Skills Required */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {intent.skills.slice(0, 4).map((skill, idx) => (
          <span
            key={idx}
            className="text-[10px] font-bold bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800/80"
          >
            {skill}
          </span>
        ))}
        {intent.skills.length > 4 && (
          <span className="text-[10px] text-slate-500 font-semibold self-center">
            +{intent.skills.length - 4} more
          </span>
        )}
      </div>

      {/* Creator Info & Proximity */}
      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-3 text-xs mb-4">
        <div className="flex items-center gap-2">
          <img
            src={intent.creatorAvatar}
            alt={intent.creatorName}
            className="w-7 h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
          />
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-slate-900 dark:text-slate-200 text-xs">{intent.creatorName}</span>
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
              {intent.creatorBadge || 'Verified Member'}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1 text-[11px] font-medium">
            <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" />
            {intent.distanceKm} km away
          </span>
          {intent.budget && (
            <span className="text-[11px] font-bold text-slate-900 dark:text-slate-200 block">
              {intent.budget}
            </span>
          )}
        </div>
      </div>

      {/* Team intent indicator if applicable */}
      {intent.isTeamIntent && (
        <div className="mb-3 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between text-xs">
          <span className="text-purple-700 dark:text-purple-300 font-bold flex items-center gap-1 text-[11px]">
            <Users className="w-3.5 h-3.5" /> Team Intent Recruitment
          </span>
          <span className="text-[11px] font-bold text-purple-800 dark:text-purple-200">
            {intent.filledCount} / {intent.targetCount} Joined
          </span>
        </div>
      )}

      {/* Broadcast Platforms */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto scrollbar-none pb-0.5">
        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 shrink-0">
          <Globe className="w-3 h-3 text-indigo-400" /> Serving on:
        </span>
        {(intent.platforms || ['WhatsApp', 'Telegram', 'Discord', 'Slack', 'LinkedIn', 'Web App']).map((plat, idx) => (
          <span
            key={idx}
            className="text-[9px] font-extrabold bg-indigo-500/10 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full shrink-0"
          >
            {plat}
          </span>
        ))}
      </div>

      {/* Serving / Accepted Status Banner if applicable */}
      {isServing && (
        <div className="mb-3 px-3 py-2 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
          <span className="text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 text-[11px]">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            {isOwner ? `Accepted by ${intent.acceptedByUserName || 'Provider'}` : (isAcceptedByMe ? 'You are Serving this Intent' : 'Active Deal in Progress')}
          </span>
          <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md truncate max-w-[110px]">
            {intent.acceptedByPlatform || 'Web App'}
          </span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col gap-2 pt-1">
        {isOwner ? (
          /* Creator View: Manage & View Candidates */
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelect(intent)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Manage & View Matches ({intent.matchesCount})</span>
            </button>

            {isServing && (
              <button
                onClick={() => onStartChat(intent)}
                className="p-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 rounded-xl transition-all border border-emerald-500/30"
                title="Chat with Service Provider"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onBoost(intent.id)}
              className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl transition-all border border-amber-500/30"
              title="Boost Intent Visibility"
            >
              <Zap className="w-4 h-4" />
            </button>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(intent.id);
                }}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-all border border-red-500/30"
                title="Delete Intent"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Provider / Community View: Accept Intent to Serve */
          <>
            {!isServing ? (
              <button
                onClick={() => onAcceptIntent ? onAcceptIntent(intent) : onStartChat(intent)}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/25 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all active:scale-[0.98]"
              >
                <Handshake className="w-4 h-4" />
                <span>Accept Intent to Serve</span>
              </button>
            ) : (
              <button
                onClick={() => onStartChat(intent)}
                className="w-full flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Serving Workspace Chat</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelect(intent)}
                className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>View Details ({intent.matchesCount} candidates)</span>
              </button>

              <button
                onClick={() => onStartChat(intent)}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all border border-slate-200 dark:border-slate-700"
                title="Chat with Intent Creator"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};
