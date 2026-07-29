import React, { useState } from 'react';
import { Trophy, Award, MapPin, Building, GraduationCap, Flame, ShieldCheck } from 'lucide-react';
import { LeaderboardItem } from '../types';

interface LeaderboardViewProps {
  items: LeaderboardItem[];
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ items }) => {
  const [activeCategory, setActiveCategory] = useState<'City' | 'College' | 'Company' | 'Profession'>('City');
  const [activeTimeframe, setActiveTimeframe] = useState<'Monthly' | 'All Time'>('Monthly');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-slate-900 dark:text-slate-100">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Karma & Intent Leaderboard</h1>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Honoring community members who help others, donate blood, mentor, and fulfill intents seamlessly.
            </p>
          </div>

          {/* Timeframe Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveTimeframe('Monthly')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTimeframe === 'Monthly' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveTimeframe('All Time')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                activeTimeframe === 'All Time' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pt-6 border-t border-slate-200 dark:border-slate-800/80 text-xs">
          {(['City', 'College', 'Company', 'Profession'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === cat
                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-bold'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat === 'City' && <MapPin className="w-3.5 h-3.5" />}
              {cat === 'College' && <GraduationCap className="w-3.5 h-3.5" />}
              {cat === 'Company' && <Building className="w-3.5 h-3.5" />}
              {cat} Leaderboard
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Rank</th>
                <th className="py-3.5 px-4">Collaborator</th>
                <th className="py-3.5 px-4">Location / Group</th>
                <th className="py-3.5 px-4">Permanent Karma</th>
                <th className="py-3.5 px-4">Trust Score</th>
                <th className="py-3.5 px-4">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-medium">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">🏆 Leaderboard is ready for launch!</p>
                      <p className="text-xs">Publish your first intent or register an account to claim the #1 spot on the leaderboard.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      item.name.includes('(You)') ? 'bg-indigo-50 dark:bg-indigo-950/40 font-bold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      {item.rank === 1 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 flex items-center justify-center font-black">
                          🥇
                        </span>
                      ) : item.rank === 2 ? (
                        <span className="w-6 h-6 rounded-full bg-slate-300/40 text-slate-700 dark:text-slate-300 border border-slate-400/40 flex items-center justify-center font-black">
                          🥈
                        </span>
                      ) : item.rank === 3 ? (
                        <span className="w-6 h-6 rounded-full bg-amber-700/20 text-amber-700 dark:text-amber-600 border border-amber-700/40 flex items-center justify-center font-black">
                          🥉
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-sm px-2">#{item.rank}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img src={item.avatar} alt={item.name} className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{item.name}</span>
                          <span className="block text-[10px] text-indigo-600 dark:text-indigo-300">Level {item.levelName}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{item.location}</td>

                    <td className="py-3.5 px-4 font-bold text-amber-600 dark:text-amber-400 text-sm">
                      {item.karmaPoints} Karma
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {item.trustScore}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {item.badge && (
                        <span className="text-[10px] bg-amber-50 dark:bg-slate-800 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-slate-700 font-semibold">
                          {item.badge}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
