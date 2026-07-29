import React, { useState, useEffect } from 'react';
import {
  X,
  Sun,
  Moon,
  Shield,
  Eye,
  Bell,
  Lock,
  Smartphone,
  CheckCircle2,
  Sliders,
  Trash2,
  Download,
  Key,
  Globe,
  Radio,
  UserCheck,
  Sparkles,
  ShieldCheck,
  Database,
  LogOut,
  AlertTriangle
} from 'lucide-react';
import { UserProfile } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onUpdatePrivacy?: (settings: any) => void;
  onDeleteAccount?: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  theme,
  onToggleTheme,
  onUpdatePrivacy,
  onDeleteAccount,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'privacy' | 'notifications' | 'security' | 'data'>('appearance');

  // Delete account double confirmation modal
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Privacy states
  const [locationPrivacy, setLocationPrivacy] = useState<'city' | 'exact' | 'hidden'>('city');
  const [aiDiscoverable, setAiDiscoverable] = useState(true);
  const [showPhoneToMatches, setShowPhoneToMatches] = useState(false);
  const [allowDirectMessages, setAllowDirectMessages] = useState(true);

  // Notification states
  const [notifyAiMatches, setNotifyAiMatches] = useState(true);
  const [notifyDirectMessages, setNotifyDirectMessages] = useState(true);
  const [notifyDailyMissions, setNotifyDailyMissions] = useState(true);
  const [notifyEscrowUpdates, setNotifyEscrowUpdates] = useState(true);

  const [cacheClearedMsg, setCacheClearedMsg] = useState(false);

  if (!isOpen) return null;

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(user, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `near_intent_profile_${user.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleClearCache = () => {
    localStorage.clear();
    setCacheClearedMsg(true);
    setTimeout(() => setCacheClearedMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">App Settings & Privacy</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Preferences, security, theme & account controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation & Content */}
        <div className="flex flex-col md:flex-row min-h-[420px]">
          
          {/* Navigation Tabs */}
          <div className="w-full md:w-56 p-3 border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950/50 space-y-1 shrink-0">
            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'appearance'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-300" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Theme & Display</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'privacy'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Privacy & Location</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'notifications'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Security & Verification</span>
            </button>

            <button
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'data'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800/60'
              }`}
            >
              <Database className="w-4 h-4 text-pink-600 dark:text-pink-400" />
              <span>Data & Storage</span>
            </button>
          </div>

          {/* Content Panel */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[60vh]">
            
            {/* Tab 1: Appearance & Theme */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Theme Mode</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Choose visual theme for Near Intent application.</p>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => theme === 'light' && onToggleTheme()}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        theme === 'dark'
                          ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Dark Mode</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Deep slate UI for night and low-light focus</p>
                      </div>
                    </button>

                    <button
                      onClick={() => theme === 'dark' && onToggleTheme()}
                      className={`p-4 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        theme === 'light'
                          ? 'bg-indigo-50 border-indigo-500 text-slate-900 shadow-md'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">Light Mode</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Clean bright interface for high clarity</p>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 mb-2">Interface Density</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Adjust spacing and density for mobile & desktop layouts.</p>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg">Comfortable (Default)</button>
                    <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700">Compact</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Privacy */}
            {activeTab === 'privacy' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Privacy & Matching Rules</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Control how AI matchmakers and other users discover your intents.</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Discoverability</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Allow Gemini AI matchmaker to recommend your profile to intent creators.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={aiDiscoverable}
                      onChange={(e) => setAiDiscoverable(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Direct Messages</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Allow verified community members to start direct chat sessions.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowDirectMessages}
                      onChange={(e) => setAllowDirectMessages(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Location Visibility</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="loc"
                        checked={locationPrivacy === 'city'}
                        onChange={() => setLocationPrivacy('city')}
                        className="accent-indigo-600"
                      />
                      <span>City Level Only (e.g., San Francisco, CA)</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="loc"
                        checked={locationPrivacy === 'exact'}
                        onChange={() => setLocationPrivacy('exact')}
                        className="accent-indigo-600"
                      />
                      <span>Proximity Radius (e.g., within 1.2 km)</span>
                    </label>

                    <label className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="radio"
                        name="loc"
                        checked={locationPrivacy === 'hidden'}
                        onChange={() => setLocationPrivacy('hidden')}
                        className="accent-indigo-600"
                      />
                      <span>Hidden / Remote Only</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Notifications */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Notification Preferences</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Choose alerts you receive on web and mobile devices.</p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Match Alerts</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Get notified immediately when Gemini AI finds an intent match.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyAiMatches}
                      onChange={(e) => setNotifyAiMatches(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Direct Chat Messages</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Alerts for new messages from matched partners.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyDirectMessages}
                      onChange={(e) => setNotifyDirectMessages(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Daily Missions & XP Rewards</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Daily prompts to claim your streak coins and rewards.</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyDailyMissions}
                      onChange={(e) => setNotifyDailyMissions(e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Security */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Security & Verification Status</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Verification levels protect trust score and transaction rights.</p>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Phone SMS Verification</span>
                    </div>
                    {user.verificationStatus?.phone ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Unverified</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Government ID Scan</span>
                    </div>
                    {user.verificationStatus?.identity ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Unverified</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Data & Account */}
            {activeTab === 'data' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Account & Data Management</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Export your user profile data or reset application session cache.</p>

                <div className="space-y-3">
                  <button
                    onClick={handleExportData}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Export My Data (JSON)</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Download all your registered intents and profile statistics</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleClearCache}
                    className="w-full flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <div>
                        <h4 className="text-xs font-bold text-amber-700 dark:text-amber-300">Clear Local Session Cache</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Reset browser storage without deleting server records</p>
                      </div>
                    </div>
                  </button>

                  {cacheClearedMsg && (
                    <div className="p-2.5 bg-emerald-950/50 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Local cache and session storage cleared!</span>
                    </div>
                  )}

                  {/* Danger Zone */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-500 dark:text-red-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Danger Zone & Account Controls
                    </h4>

                    {onLogout && (
                      <button
                        onClick={() => {
                          onLogout();
                          onClose();
                        }}
                        className="w-full flex items-center justify-between p-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 text-left transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Log Out / Switch Account</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Exit current user session and return to authentication</p>
                          </div>
                        </div>
                      </button>
                    )}

                    {onDeleteAccount && (
                      <button
                        onClick={() => {
                          setDeleteConfirmText('');
                          setShowDeleteConfirm(true);
                        }}
                        className="w-full flex items-center justify-between p-3.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/30 text-left transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <h4 className="text-xs font-bold text-red-600 dark:text-red-400">Delete Account Permanently</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">Permanently delete your profile, phone/ID records, and database entries</p>
                          </div>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <div className="p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Account Permanently</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">This action cannot be undone!</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You are about to permanently delete account <strong>{user.name}</strong> ({user.id}). All associated intent posts, trust score history, verified phone number, and Government ID records will be erased from Firestore & server databases.
              </p>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Type <strong className="text-red-500">DELETE</strong> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                  onClick={async () => {
                    if (deleteConfirmText === 'DELETE' && onDeleteAccount) {
                      setIsDeleting(true);
                      await onDeleteAccount();
                      setIsDeleting(false);
                      setShowDeleteConfirm(false);
                      onClose();
                    }
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-500">Near Intent Engine v2.4 (Live)</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20"
          >
            Save & Done
          </button>
        </div>

      </div>
    </div>
  );
};
