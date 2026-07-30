import React from 'react';
import { 
  Rocket, 
  Dumbbell, 
  HeartPulse, 
  Wrench, 
  Users, 
  HandHeart, 
  Globe, 
  MapPin, 
  ChevronRight, 
  Sparkles,
  Zap,
  Target
} from 'lucide-react';
import { IntentCategory } from '../types';

interface CategorySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  radiusKm: number;
  onRadiusChange: (radius: number) => void;
  intentsCountByCategory: Record<string, number>;
}

export const CATEGORY_OPTIONS: {
  id: IntentCategory | 'All';
  title: string;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  badgeColor: string;
}[] = [
  {
    id: 'All',
    title: 'All Open Intent Marketplace',
    subtitle: 'Browse all active community requests & offers near you',
    icon: Globe,
    gradient: 'from-slate-700 to-slate-900',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30'
  },
  {
    id: 'Startup/Tech',
    title: 'Startup & Tech Collaboration',
    subtitle: 'Co-founders, AI devs, designers, hackathons & code reviews',
    icon: Rocket,
    gradient: 'from-indigo-600 to-blue-600',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
  },
  {
    id: 'Sports/Fitness',
    title: 'Sports, Fitness & Workouts',
    subtitle: 'Gym partners, tennis/squash buddies, running groups & coaches',
    icon: Dumbbell,
    gradient: 'from-emerald-600 to-teal-600',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  },
  {
    id: 'Emergency/Health',
    title: 'Emergency, Health & Care',
    subtitle: 'Urgent assistance, medical rides, caregiving & rapid aid',
    icon: HeartPulse,
    gradient: 'from-rose-600 to-red-600',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  },
  {
    id: 'Services/Trades',
    title: 'Services, Trades & Local Work',
    subtitle: 'Electricians, plumbers, tutoring, movers & daily tasks',
    icon: Wrench,
    gradient: 'from-amber-600 to-orange-600',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  {
    id: 'Co-founder/Networking',
    title: 'Co-founder & Professional Network',
    subtitle: 'Investors, advisors, mentors & business partnership',
    icon: Users,
    gradient: 'from-purple-600 to-indigo-700',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  },
  {
    id: 'Community/Help',
    title: 'Community, Volunteering & Local Help',
    subtitle: 'Pet sitting, neighborhood favors, events & charity',
    icon: HandHeart,
    gradient: 'from-cyan-600 to-blue-700',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  }
];

export const CategorySelectorModal: React.FC<CategorySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCategory,
  onSelectCategory,
  radiusKm,
  onRadiusChange,
  intentsCountByCategory
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto text-white flex flex-col max-h-[90vh]">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-900 p-6 sm:p-8 border-b border-slate-800 relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Near Intent Discovery OS
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            What is your intent today?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Select a category to immediately connect with verified people and active requests within your location radius.
          </p>

          {/* Radius Selector in Modal Header */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>Matching Radius:</span>
              <span className="text-indigo-400 font-extrabold">{radiusKm === 100 ? '100+ km (Global)' : `${radiusKm} km nearby`}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {[5, 15, 30, 50, 100].map(r => (
                <button
                  key={r}
                  onClick={() => onRadiusChange(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    radiusKm === r
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {r === 100 ? 'All' : `${r}km`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 scrollbar-thin scrollbar-thumb-slate-800">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Select Situational Category
          </p>

          {CATEGORY_OPTIONS.map((cat) => {
            const IconComp = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = intentsCountByCategory[cat.id] || 0;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.id);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 group relative overflow-hidden ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/50'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center shrink-0 shadow-md text-white`}>
                    <IconComp className="w-6 h-6" />
                  </div>

                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {cat.title}
                      </h3>
                      {isSelected && (
                        <span className="bg-indigo-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {cat.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${cat.badgeColor}`}>
                    {count} {count === 1 ? 'intent' : 'intents'}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-indigo-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>Intents are automatically sorted by proximity & AI compatibility score.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all"
          >
            Explore All
          </button>
        </div>

      </div>
    </div>
  );
};
