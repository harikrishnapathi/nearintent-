import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Clock,
  MapPin,
  Tag,
  AlertCircle,
  Users,
  DollarSign,
  Send,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { Intent, UrgencyLevel, IntentCategory } from '../types';

interface CreateIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateIntent: (newIntent: Intent) => void;
}

const PRESET_EXAMPLES = [
  "Need a Python backend developer for a startup this weekend.",
  "Looking for a badminton partner tonight near Bay Badminton Club.",
  "Need an O-Negative blood donor urgently at UCSF Parnassus.",
  "Need an electrician near me to fix circuit breaker in Downtown SF.",
  "Looking for an AI co-founder for a pre-seed multi-agent platform.",
  "Need 5 volunteers for Ocean Beach cleanup & trash sorting this Sunday."
];

export const CreateIntentModal: React.FC<CreateIntentModalProps> = ({
  isOpen,
  onClose,
  onCreateIntent
}) => {
  const [promptInput, setPromptInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [extractedIntent, setExtractedIntent] = useState<Partial<Intent> | null>(null);
  const [isTeamIntent, setIsTeamIntent] = useState(false);
  const [targetCount, setTargetCount] = useState(3);

  if (!isOpen) return null;

  const handleAIParse = async (inputToParse?: string) => {
    const textToAnalyze = inputToParse || promptInput;
    if (!textToAnalyze.trim()) return;

    setIsAiLoading(true);
    try {
      const response = await fetch('/api/ai/parse-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: textToAnalyze })
      });

      const result = await response.json();
      if (result.success && result.data) {
        const d = result.data;
        setExtractedIntent({
          title: d.title || 'Untitled Intent',
          category: (d.category as IntentCategory) || 'Startup/Tech',
          skills: d.skills || ['General'],
          location: d.location || 'San Francisco, CA',
          availability: d.availability || 'Immediate',
          budget: d.budget || undefined,
          urgency: (d.urgency as UrgencyLevel) || 'Normal',
          durationHours: d.durationHours || 24,
          aiSuggestedKeywords: d.aiSuggestedKeywords || []
        });
      }
    } catch (err) {
      console.error('Error parsing intent:', err);
      // Fallback extraction if server endpoint fails
      setExtractedIntent({
        title: textToAnalyze.slice(0, 60),
        category: 'Startup/Tech',
        skills: ['Collaboration', 'Real-time'],
        location: 'San Francisco, CA',
        availability: 'Today',
        urgency: 'Normal',
        durationHours: 24
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;

    const duration = extractedIntent?.durationHours || 24;
    const now = Date.now();

    const newIntent: Intent = {
      id: `int_${Date.now()}`,
      creatorId: 'usr_me',
      creatorName: 'Alex Rivera',
      creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
      creatorTrustScore: 98,
      creatorBadge: 'Elite Collaborator',
      title: extractedIntent?.title || promptInput.slice(0, 60),
      rawPrompt: promptInput,
      category: (extractedIntent?.category as IntentCategory) || 'Startup/Tech',
      skills: extractedIntent?.skills || ['Collaboration'],
      location: extractedIntent?.location || 'San Francisco, CA',
      distanceKm: 0.1,
      availability: extractedIntent?.availability || 'Immediate',
      budget: extractedIntent?.budget,
      urgency: (extractedIntent?.urgency as UrgencyLevel) || 'Normal',
      durationHours: duration,
      createdAt: now,
      expiresAt: now + duration * 3600 * 1000,
      status: 'active',
      isTeamIntent: isTeamIntent,
      targetCount: isTeamIntent ? targetCount : 1,
      filledCount: 0,
      matchesCount: Math.floor(Math.random() * 5) + 3,
      viewsCount: 12,
      aiSuggestedKeywords: extractedIntent?.aiSuggestedKeywords || ['NearIntent']
    };

    onCreateIntent(newIntent);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl text-slate-100 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Describe Your Intent</h2>
              <p className="text-xs text-slate-400">No long forms. AI understands your requirements automatically.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Natural Language Prompt Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Natural Language Statement</span>
              <span className="text-[10px] text-indigo-400 font-normal">AI Auto-Extracts Details</span>
            </label>
            <div className="relative">
              <textarea
                value={promptInput}
                onChange={(e) => {
                  setPromptInput(e.target.value);
                  if (extractedIntent) setExtractedIntent(null);
                }}
                rows={3}
                placeholder="e.g., 'Need a Python backend developer for a startup this weekend in SF with FastAPI experience.'"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
              <button
                type="button"
                onClick={() => handleAIParse()}
                disabled={isAiLoading || !promptInput.trim()}
                className="absolute right-3 bottom-3 flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract Intent</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Preset Example Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-slate-400">Try an example:</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_EXAMPLES.map((example, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPromptInput(example);
                    handleAIParse(example);
                  }}
                  className="text-left text-[11px] bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-all truncate max-w-full"
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>

          {/* AI Extracted Details Preview Card */}
          {extractedIntent && (
            <div className="bg-slate-950/90 border border-indigo-500/30 rounded-xl p-4 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  AI Extracted Intent Metadata
                </span>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/20 font-medium">
                  {extractedIntent.category}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Extracted Title:</span>
                  <p className="text-slate-100 font-semibold">{extractedIntent.title}</p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Location & Proximity:</span>
                  <p className="text-slate-100 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                    {extractedIntent.location}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Urgency & Expiry:</span>
                  <p className="text-slate-100 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    {extractedIntent.urgency} ({extractedIntent.durationHours}h expiry)
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Budget / Rate:</span>
                  <p className="text-slate-100 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    {extractedIntent.budget || 'None specified'}
                  </p>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] block mb-1">Required Skills & Attributes:</span>
                <div className="flex flex-wrap gap-1">
                  {extractedIntent.skills?.map((sk, i) => (
                    <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Team Recruitment Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200">Team Intent Recruitment</span>
                <p className="text-[10px] text-slate-400">Recruit multiple people (e.g. 5 volunteers, 3 developers)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isTeamIntent && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">Target:</span>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={targetCount}
                    onChange={(e) => setTargetCount(Number(e.target.value))}
                    className="w-14 bg-slate-900 border border-slate-700 rounded p-1 text-center text-xs text-white"
                  />
                </div>
              )}
              <input
                type="checkbox"
                checked={isTeamIntent}
                onChange={(e) => setIsTeamIntent(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!promptInput.trim()}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Publish Intent</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
