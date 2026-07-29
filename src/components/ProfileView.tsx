import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Flame,
  Coins,
  CheckCircle2,
  Clock,
  Briefcase,
  ExternalLink,
  Zap,
  Globe,
  Star,
  Users,
  Code,
  HeartHandshake,
  Lock,
  Settings,
  Edit3,
  X,
  Camera,
  Check,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileViewProps {
  user: UserProfile;
  onOpenRewards: () => void;
  onOpenAuthModal?: () => void;
  onOpenSettings?: () => void;
  onUpdateUser?: (updatedUser: UserProfile) => void;
  onLogout?: () => void;
}

const PRESET_AVATARS = [
  { name: 'Default Male', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250' },
  { name: 'Default Female', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250' },
  { name: 'Neutral Human', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=250' },
  { name: 'Profile Photo B', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250' },
  { name: 'Profile Photo C', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=250' }
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onOpenRewards,
  onOpenAuthModal,
  onOpenSettings,
  onUpdateUser,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editHeadline, setEditHeadline] = useState(user.headline);
  const [editBio, setEditBio] = useState(user.bio);
  const [editLocation, setEditLocation] = useState(user.location);
  const [editAvatar, setEditAvatar] = useState(user.avatar);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [editSkills, setEditSkills] = useState(user.skills.join(', '));

  const xpForNextLevel = 5000;
  const xpProgress = Math.min(100, Math.floor((user.xp / xpForNextLevel) * 100));

  const handleOpenEdit = () => {
    setEditName(user.name);
    setEditHeadline(user.headline);
    setEditBio(user.bio);
    setEditLocation(user.location);
    setEditAvatar(user.avatar);
    setCustomAvatarUrl('');
    setEditSkills(user.skills.join(', '));
    setIsEditing(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : editAvatar;
    const skillsArray = editSkills.split(',').map(s => s.trim()).filter(Boolean);

    const updated: UserProfile = {
      ...user,
      name: editName.trim() || 'Account Holder',
      headline: editHeadline.trim() || 'Community Member',
      bio: editBio.trim() || 'No bio provided.',
      location: editLocation.trim() || 'San Francisco, CA',
      avatar: finalAvatar,
      skills: skillsArray.length > 0 ? skillsArray : ['Community', 'Collaboration']
    };

    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setIsEditing(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-slate-900 dark:text-slate-100">
      
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        
        {/* Background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
          <div className="relative group cursor-pointer" onClick={handleOpenEdit}>
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-xl"
            />
            <div className="absolute inset-0 bg-slate-950/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="absolute -bottom-2 -right-2 bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full border-2 border-slate-900 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> {user.trustScore}% TRUST
            </span>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name}</h1>
                <span className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-bold text-xs px-3 py-1 rounded-full shadow-md">
                  Level {user.levelNumber} - {user.levelName}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenEdit}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                  >
                    <Settings className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Settings & Privacy</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    title="Log Out of Account"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300">{user.headline}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">{user.bio}</p>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                📍 {user.location}
              </span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium">
                ⚡ Avg Response: <strong className="text-slate-900 dark:text-white">{user.responseTime}</strong>
              </span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> {user.successRate}% Success Rate
              </span>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              XP Progress ({user.xp} / {xpForNextLevel} XP)
            </span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">{xpProgress}% to Level 6 (Legend)</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Trust & Reputation Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Trust Score</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-6 h-6" />
            {user.trustScore}%
          </div>
          <span className="text-[10px] text-slate-500">Based on verified platform history</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Permanent Karma</span>
          <div className="text-2xl font-black text-amber-500 dark:text-amber-400 flex items-center gap-1">
            <Award className="w-6 h-6" />
            {user.karmaPoints}
          </div>
          <span className="text-[10px] text-slate-500">Earned helping community</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Completed Intents</span>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {user.completedIntents}
          </div>
          <span className="text-[10px] text-slate-500">100% On-time resolution</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-1 shadow-xs">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Penalties</span>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-200">
            0
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">No-show / Cancellation penalties: 0</span>
        </div>

      </div>

      {/* Badges Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              Verified Reputation Badges ({(user.badges || []).length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Public badges earned through intent fulfillments & community contributions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {(user.badges || []).map((badge) => (
            <div
              key={badge.id}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl flex items-start gap-3 hover:border-amber-500/40 transition-colors"
            >
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{badge.name}</h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight mt-0.5">{badge.description}</p>
                <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">Earned {badge.earnedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Skills & Verification</h3>
          
          <div className="flex flex-wrap gap-2">
            {(user.skills || []).map((skill, idx) => (
              <span
                key={idx}
                className="text-xs bg-indigo-50 dark:bg-slate-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 px-3 py-1 rounded-xl font-medium"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block">Trust Verifications:</span>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Government Identity Verified</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Phone & Location Verified</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>AI Technical Skill Assessment Passed</span>
            </div>
          </div>
        </div>

        {/* Portfolio & Verified Work */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">Verified Work & Portfolio</h3>

          {user.portfolio && user.portfolio.length > 0 ? (
            <div className="space-y-3">
              {user.portfolio.map((item, idx) => (
                <a
                  key={idx}
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  className="block bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 p-3.5 rounded-xl transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {item.title}
                      <ExternalLink className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    </h4>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {item.tags.map((t, i) => (
                      <span key={i} className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 px-2 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              No custom external portfolio links added yet. You can add skills and bio details using the Edit Profile button.
            </p>
          )}
        </div>

      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Edit Account Profile</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Update your account name, bio, skills and picture</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              
              {/* Profile Avatar Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Select Profile Picture / Avatar
                </label>
                <div className="flex flex-wrap gap-3 items-center">
                  {PRESET_AVATARS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditAvatar(preset.url);
                        setCustomAvatarUrl('');
                      }}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                        editAvatar === preset.url && !customAvatarUrl
                          ? 'border-indigo-600 ring-2 ring-indigo-500/50'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt={preset.name} className="w-12 h-12 object-cover rounded-lg" />
                      {editAvatar === preset.url && !customAvatarUrl && (
                        <span className="absolute bottom-1 right-1 bg-indigo-600 text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Or paste custom image URL:
                  </label>
                  <input
                    type="url"
                    value={customAvatarUrl}
                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Your Name / Preferred Title"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Headline */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Headline / Role
                </label>
                <input
                  type="text"
                  value={editHeadline}
                  onChange={(e) => setEditHeadline(e.target.value)}
                  placeholder="e.g. Community Contributor, Freelance Designer, Tech Volunteer"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Bio / About
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  placeholder="Brief description about yourself and what intents you create or fulfill..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Location
                </label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Skills */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Skills & Interests (comma-separated)
                </label>
                <input
                  type="text"
                  value={editSkills}
                  onChange={(e) => setEditSkills(e.target.value)}
                  placeholder="e.g. React, Design, Community, Sports, Tutoring"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
                >
                  Save Profile
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

