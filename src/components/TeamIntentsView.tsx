import React from 'react';
import { Users, Sparkles, CheckCircle2, UserPlus, ShieldCheck, ArrowRight } from 'lucide-react';
import { Intent } from '../types';

interface TeamIntentsViewProps {
  intents: Intent[];
  onOpenCreateIntent: () => void;
  onSelectIntent: (intent: Intent) => void;
}

export const TeamIntentsView: React.FC<TeamIntentsViewProps> = ({
  intents,
  onOpenCreateIntent,
  onSelectIntent
}) => {
  const teamIntents = intents.filter(i => i.isTeamIntent);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Intents & Multi-Recruitment</h1>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
              Recruit teams automatically with AI matching (e.g., 5 volunteers, 3 developers, 10 event coordinators).
            </p>
          </div>

          <button
            onClick={onOpenCreateIntent}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-md shadow-purple-600/20 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Team Intent</span>
          </button>
        </div>
      </div>

      {/* Team Intents List */}
      {teamIntents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4 max-w-2xl mx-auto my-4">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/60 rounded-2xl flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
            <Users className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">No Team Intents Yet</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Recruit teams automatically with AI matching (e.g., 5 volunteers for beach cleanup, 3 startup engineers, 10 event staff).
            </p>
          </div>
          <button
            onClick={onOpenCreateIntent}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create First Team Intent</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {teamIntents.map((intent) => {
            const filled = intent.filledCount || 0;
            const target = intent.targetCount || 5;
            const percentage = Math.min(100, Math.floor((filled / target) * 100));

            return (
              <div
                key={intent.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 p-6 rounded-2xl shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      {intent.category}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">📍 {intent.location}</span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{intent.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic">"{intent.rawPrompt}"</p>

                  {/* Team Progress */}
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-purple-700 dark:text-purple-300">Team Assembly Progress</span>
                      <span className="text-slate-800 dark:text-slate-200">{filled} / {target} Positions Filled</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => onSelectIntent(intent)}
                  className="w-full py-2.5 bg-purple-50 dark:bg-purple-600/20 hover:bg-purple-100 dark:hover:bg-purple-600/30 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>AI Auto-Fill Candidate Matches ({intent.matchesCount})</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
