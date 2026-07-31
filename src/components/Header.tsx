import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Flame,
  Award,
  Bell,
  PlusCircle,
  MessageSquare,
  Trophy,
  Users,
  Shield,
  Coins,
  Bot,
  Sun,
  Moon,
  Settings,
  Menu,
  X,
  Smartphone
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types';

interface HeaderProps {
  user: UserProfile;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateIntent: () => void;
  onOpenCopilot: () => void;
  onOpenMissions: () => void;
  onOpenRewards: () => void;
  onOpenNotifications: () => void;
  onOpenAuthModal: () => void;
  onOpenSettings: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  notifications: NotificationItem[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory?: string;
  radiusKm?: number;
  onOpenCategorySelector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  setActiveTab,
  onOpenCreateIntent,
  onOpenCopilot,
  onOpenMissions,
  onOpenRewards,
  onOpenNotifications,
  onOpenAuthModal,
  onOpenSettings,
  theme,
  onToggleTheme,
  notifications,
  searchQuery,
  setSearchQuery,
  selectedCategory = 'All',
  radiusKm = 30,
  onOpenCategorySelector
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMobileNav = (tab: string) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-all shadow-xs w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4 w-full">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2 cursor-pointer shrink-0" onClick={() => handleMobileNav('explore')}>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-0.5 shadow-md shadow-indigo-500/20 overflow-hidden flex items-center justify-center">
              {!logoError ? (
                <img
                  src="/logo.jpg"
                  alt="NearIntent Logo"
                  className="w-full h-full object-cover rounded-[10px]"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-slate-900 dark:text-white font-sans">
                  Near<span className="text-indigo-600 dark:text-indigo-400">Intent</span>
                </span>
                <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider px-1 py-0.5 bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 rounded border border-indigo-500/30">
                  AI OS
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block font-medium">Intent Operating System</p>
            </div>
          </div>

          {/* AI Natural Language Search Bar (Desktop) */}
          <div className="flex-1 max-w-xl mx-2 hidden md:block">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 dark:group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Describe what you want to achieve... (e.g., 'Need Python dev in SF')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-full pl-10 pr-12 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                AI Search
              </span>
            </div>
          </div>

          {/* Desktop User Gamification Stats & Actions */}
          <div className="hidden lg:flex items-center gap-2 lg:gap-3">
            
            {/* Category / Situation Selector Button */}
          {onOpenCategorySelector && (
            <button
              onClick={onOpenCategorySelector}
              className="hidden sm:flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-2xs"
              title="Change Situation Category & Radius"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span className="truncate max-w-[130px]">{selectedCategory === 'All' ? 'All Intent Categories' : selectedCategory}</span>
              <span className="bg-indigo-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                {radiusKm === 100 ? 'All km' : `${radiusKm}km`}
              </span>
            </button>
          )}

          {/* Create Intent Button */}
            <button
              onClick={onOpenCreateIntent}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all transform active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Intent</span>
            </button>

            {/* AI Copilot Button */}
            <button
              onClick={onOpenCopilot}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-indigo-500/30 text-slate-800 dark:text-indigo-300 px-3 py-2 rounded-xl text-xs font-bold transition-all"
              title="AI Intent Copilot"
            >
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Copilot</span>
            </button>

            {/* Streak & Near Coins */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400" title="Daily Streak">
                <Flame className="w-4 h-4 fill-amber-400/20" />
                <span className="font-bold">{user.streakDays}d</span>
              </div>
              <div className="h-3 w-[1px] bg-slate-300 dark:bg-slate-800" />
              <button 
                onClick={onOpenRewards}
                className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
                title="Near Coins Store"
              >
                <Coins className="w-4 h-4" />
                <span className="font-bold">{user.coins} NC</span>
              </button>
            </div>

            {/* Daily Missions */}
            <button
              onClick={onOpenMissions}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative"
              title="Daily Missions"
            >
              <Award className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            </button>

            {/* Notifications */}
            <button
              onClick={onOpenNotifications}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all relative"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-600 text-[10px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Quick Theme Switcher Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
            </button>

            {/* Settings & Privacy Modal Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              title="App Settings & Privacy"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Join Platform / Switch Accounts Button */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
            >
              <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Account</span>
            </button>

            {/* Profile Avatar Button */}
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 p-1 rounded-xl transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
              title="View & Edit Profile"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover border border-indigo-500/50"
              />
            </button>
          </div>

          {/* Compact Mobile Top Action Bar (< lg) */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-1.5 shrink-0">
            
            {/* Mobile Create Intent Button */}
            <button
              onClick={onOpenCreateIntent}
              className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 py-1.5 rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Intent</span>
            </button>

            {/* Mobile Quick Notifications */}
            <button
              onClick={onOpenNotifications}
              className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-indigo-600 text-[9px] font-bold text-white flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Mobile Quick Theme Button */}
            <button
              onClick={onToggleTheme}
              className="p-1.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />}
            </button>

            {/* 3-Lines Dashboard Hamburger Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none transition-all"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-indigo-600 dark:text-indigo-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

        {/* Desktop Navigation Tabs Bar (hidden on mobile drawer mode) */}
        <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-200 dark:border-slate-800/60 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'explore'
                ? 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Active Intents
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Conversations
          </button>

          <button
            onClick={() => setActiveTab('team')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Team Intents
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
              activeTab === 'profile'
                ? 'bg-indigo-600/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/40'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-500" />
            My Profile
          </button>
        </nav>

      </div>

      {/* Responsive Mobile Sliding Navigation Drawer (Triggered by 3 Lines Button) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto w-full max-w-full">
          
          {/* Mobile AI Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search intents, people or skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* User Profile Card Header */}
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuthModal();
                }}
                className="relative group text-left"
                title="Click to upload profile photo"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-slate-700 bg-indigo-50 dark:bg-slate-900"
                />
                <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white text-[8px] px-1 py-0.2 rounded-full font-bold">
                  📷
                </span>
              </button>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</h4>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuthModal();
                  }}
                  className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline block text-left"
                >
                  Upload your photo & profile
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAuthModal();
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
            >
              Account
            </button>
          </div>

          {/* Navigation Links Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <button
              onClick={() => handleMobileNav('explore')}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                activeTab === 'explore'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Active Intents</span>
            </button>

            <button
              onClick={() => handleMobileNav('chat')}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Conversations</span>
            </button>

            <button
              onClick={() => handleMobileNav('team')}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                activeTab === 'team'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Intents</span>
            </button>

            <button
              onClick={() => handleMobileNav('profile')}
              className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>My Profile</span>
            </button>
          </div>

          {/* Quick Utility Actions List */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs font-bold">
            <div className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500 px-1">
              Quick Shortcuts
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onOpenSettings();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Settings & Privacy</span>
              </button>

              <button
                onClick={onToggleTheme}
                className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>

              <button
                onClick={() => {
                  onOpenCopilot();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>AI Copilot</span>
              </button>

              <button
                onClick={() => {
                  onOpenMissions();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200"
              >
                <Award className="w-4 h-4 text-amber-500" />
                <span>Daily Missions</span>
              </button>
            </div>

            <button
              onClick={() => {
                onOpenAuthModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-700 dark:text-emerald-300 font-bold"
            >
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Join / Switch Demo Account</span>
            </button>
          </div>

        </div>
      )}
    </header>
  );
};
