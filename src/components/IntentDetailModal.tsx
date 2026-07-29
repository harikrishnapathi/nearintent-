import React from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Clock,
  MapPin,
  CheckCircle2,
  MessageSquare,
  Award,
  DollarSign,
  Briefcase,
  Star,
  Zap,
  Phone,
  Video,
  Trash2
} from 'lucide-react';
import { Intent, Match } from '../types';

interface IntentDetailModalProps {
  intent: Intent | null;
  matches: Match[];
  onClose: () => void;
  onContactCandidate: (match: Match, intent: Intent) => void;
  onCreateEscrow: (intent: Intent, match: Match) => void;
  onStartCall?: (participantName: string, participantAvatar: string, intentTitle: string, callType: 'audio' | 'video') => void;
  onDeleteIntent?: (intentId: string) => void;
}

export const IntentDetailModal: React.FC<IntentDetailModalProps> = ({
  intent,
  matches,
  onClose,
  onContactCandidate,
  onCreateEscrow,
  onStartCall,
  onDeleteIntent
}) => {
  if (!intent) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl text-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {intent.category}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {intent.urgency} Urgency
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{intent.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {onDeleteIntent && intent.status !== 'matched' && (
              <button
                onClick={() => {
                  onDeleteIntent(intent.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold transition-all"
                title="Delete Intent"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Intent Overview Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Creator</span>
              <div className="flex items-center gap-2">
                <img src={intent.creatorAvatar} className="w-6 h-6 rounded-full object-cover" />
                <span className="font-semibold text-slate-100">{intent.creatorName}</span>
                <span className="text-emerald-400 font-bold">({intent.creatorTrustScore}%)</span>
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Location & Budget</span>
              <p className="text-slate-200 font-medium flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {intent.location}
              </p>
              {intent.budget && <p className="text-slate-300 font-semibold mt-0.5">{intent.budget}</p>}
            </div>

            <div>
              <span className="text-slate-400 block mb-1">Availability Window</span>
              <p className="text-slate-200 font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {intent.availability}
              </p>
            </div>
          </div>

          {/* AI Matches Section Header */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">
                  AI-Matched Candidates ({matches.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">Sorted by Intent Compatibility</span>
            </div>

            {/* Candidates List */}
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className={`bg-slate-950 border rounded-xl p-5 space-y-4 transition-all ${
                    match.recommendedFirst
                      ? 'border-indigo-500/50 shadow-lg shadow-indigo-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Candidate Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={match.userAvatar}
                        alt={match.userName}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-sm">{match.userName}</h4>
                          {match.recommendedFirst && (
                            <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3 fill-white" /> AI Top Pick
                            </span>
                          )}
                          <span className="text-[10px] font-medium bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            Level {match.levelName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{match.userTitle}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                            <ShieldCheck className="w-3.5 h-3.5" /> {match.trustScore}% Trust
                          </span>
                          <span>⚡ Resp: {match.responseTime}</span>
                          <span>📍 {match.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Compatibility Score Circle */}
                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="text-2xl font-black text-indigo-400">{match.matchPercentage}%</span>
                        <span className="block text-[10px] text-slate-400 font-medium">Compatibility</span>
                      </div>
                    </div>
                  </div>

                  {/* Compatibility Breakdown Bars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80 text-[10px]">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Skills Match</span>
                        <span className="text-indigo-300 font-semibold">{match.breakdown.skills}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${match.breakdown.skills}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Proximity</span>
                        <span className="text-emerald-300 font-semibold">{match.breakdown.proximity}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${match.breakdown.proximity}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Trust Score</span>
                        <span className="text-amber-300 font-semibold">{match.breakdown.trust}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${match.breakdown.trust}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-1">
                        <span>Availability</span>
                        <span className="text-purple-300 font-semibold">{match.breakdown.availability}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500" style={{ width: `${match.breakdown.availability}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* AI Reasoning Text */}
                  <div className="text-xs text-slate-300 bg-indigo-950/30 border border-indigo-500/20 p-3 rounded-lg leading-relaxed">
                    <span className="font-semibold text-indigo-400">AI Recommendation: </span>
                    {match.aiReasoning}
                  </div>

                  {/* Candidate Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    {onStartCall && (
                      <>
                        <button
                          onClick={() => onStartCall(match.userName, match.userAvatar, intent.title, 'audio')}
                          className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          title="Voice Call Candidate"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Voice Call</span>
                        </button>
                        <button
                          onClick={() => onStartCall(match.userName, match.userAvatar, intent.title, 'video')}
                          className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                          title="Video Call Candidate"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Video Call</span>
                        </button>
                      </>
                    )}

                    {intent.budget && (
                      <button
                        onClick={() => onCreateEscrow(intent, match)}
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Escrow</span>
                      </button>
                    )}

                    <button
                      onClick={() => onContactCandidate(match, intent)}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
