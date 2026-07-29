import React, { useState } from 'react';
import { X, Award, Flame, CheckCircle2, Sparkles, Coins, Zap, RefreshCw, Bot } from 'lucide-react';
import { Mission, UserProfile } from '../types';

interface DailyMissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  onClaimReward: (missionId: string) => void;
  user: UserProfile;
  onRefreshMissions?: () => void;
  isGeneratingMissions?: boolean;
}

export const DailyMissionsModal: React.FC<DailyMissionsModalProps> = ({
  isOpen,
  onClose,
  missions,
  onClaimReward,
  user,
  onRefreshMissions,
  isGeneratingMissions = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl text-slate-100 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>AI Daily Missions</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                  Live Tracked
                </span>
              </h2>
              <p className="text-xs text-slate-400">Personalized real-time tasks for {user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshMissions && (
              <button
                onClick={onRefreshMissions}
                disabled={isGeneratingMissions}
                className="flex items-center gap-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isGeneratingMissions ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                )}
                <span>{isGeneratingMissions ? 'Gemini Generating...' : 'AI Generate New'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Missions List */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {missions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 text-indigo-400 mx-auto animate-pulse" />
              <p className="text-xs font-semibold">No active missions right now.</p>
              {onRefreshMissions && (
                <button
                  onClick={onRefreshMissions}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Generate Daily Missions with Gemini AI
                </button>
              )}
            </div>
          ) : (
            missions.map((m) => {
              const isCompleted = m.currentProgress >= m.targetCount || m.completed;
              return (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl border transition-all ${
                    m.claimed
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : isCompleted
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                        {m.category}
                      </span>
                      <h3 className="font-bold text-sm text-slate-100 mt-1">{m.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{m.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-amber-400" /> +{m.rewardXp} XP
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Coins className="w-3.5 h-3.5" /> +{m.rewardCoins} NC
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Live Progress</span>
                      <span className="font-bold text-slate-200">
                        {m.currentProgress} / {m.targetCount}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-400' : 'bg-amber-400'}`}
                        style={{ width: `${Math.min(100, (m.currentProgress / m.targetCount) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Claim Button */}
                  <div className="flex items-center justify-end mt-3">
                    {m.claimed ? (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Claimed
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => onClaimReward(m.id)}
                        className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-xs shadow-md shadow-amber-500/20 transition-all animate-bounce"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Claim Reward</span>
                      </button>
                    ) : (
                      <span className="text-xs text-slate-500 italic">In progress</span>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
