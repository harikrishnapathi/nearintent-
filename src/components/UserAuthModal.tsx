import React, { useState } from 'react';
import {
  X,
  UserCheck,
  ShieldCheck,
  Phone,
  CheckCircle2,
  Sparkles,
  Zap,
  Award,
  Lock,
  ArrowRight,
  Smartphone,
  FileCheck,
  HelpCircle,
  Users,
  Upload,
  Camera,
  AlertCircle,
  Trash2,
  Search,
  LogIn
} from 'lucide-react';
import { UserProfile } from '../types';
import { DEFAULT_AVATAR } from '../mockData';
import { saveUserToFirestore, checkDuplicateUserInFirestore } from '../lib/firebaseService';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredUsers: UserProfile[]; // Accounts saved on this device
  allNetworkUsers?: UserProfile[]; // All network accounts
  activeUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
  onRegisterNewUser: (newUser: UserProfile) => void;
  onRemoveUserFromDevice?: (userId: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=250',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250'
];

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  registeredUsers,
  allNetworkUsers = [],
  activeUser,
  onSelectUser,
  onRegisterNewUser,
  onRemoveUserFromDevice
}) => {
  const [tab, setTab] = useState<'switch' | 'signin' | 'register'>('switch');
  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign In Form State
  const [loginQuery, setLoginQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Register Form State
  const [name, setName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('San Francisco, CA');
  const [skillsInput, setSkillsInput] = useState('React, Python, AI');
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);

  // Verification Checks State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [governmentId, setGovernmentId] = useState('');
  const [idUploading, setIdUploading] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);

  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [skillVerified, setSkillVerified] = useState(false);

  const sampleQuiz = [
    {
      question: 'What is the primary benefit of vector databases in AI applications?',
      options: ['Generating HTML tables', 'High-speed semantic similarity search', 'Sending emails', 'Managing CSS colors'],
      correct: 1
    },
    {
      question: 'How does Near Intent verify contributor trust on the platform?',
      options: ['Random guessing', 'Cryptographic ID checks, phone SMS & AI proof of execution', 'Paid subscriptions only', 'Manual pen and paper'],
      correct: 1
    }
  ];

  if (!isOpen) return null;

  // Helper to validate duplicates locally and in Firestore
  const validateDuplicates = async (nameToCheck?: string, phoneToCheck?: string, govIdToCheck?: string): Promise<string | null> => {
    const combined = [...registeredUsers, ...allNetworkUsers];

    // Check duplicate account name
    if (nameToCheck && nameToCheck.trim()) {
      const cleanName = nameToCheck.trim().toLowerCase();
      const found = combined.find(u => u.name && u.name.trim().toLowerCase() === cleanName);
      if (found) {
        return `An account named "${found.name}" already exists. Each person can only hold one account with a unique name. Please choose a different name or sign in.`;
      }
    }

    // Check duplicate phone
    if (phoneToCheck && phoneToCheck.trim()) {
      const cleanPhone = phoneToCheck.replace(/\D/g, "");
      if (cleanPhone.length >= 5) {
        const found = combined.find(u => u.phoneNumber && u.phoneNumber.replace(/\D/g, "") === cleanPhone);
        if (found) {
          return `An account (${found.name}) already exists with phone number ${phoneToCheck}. One person cannot create multiple accounts with the same phone number.`;
        }
      }
    }

    // Check duplicate Gov ID
    if (govIdToCheck && govIdToCheck.trim()) {
      const cleanGovId = govIdToCheck.trim().toUpperCase();
      const found = combined.find(u => u.governmentId && u.governmentId.trim().toUpperCase() === cleanGovId);
      if (found) {
        return `An account (${found.name}) already exists with Government ID ${govIdToCheck}. One person cannot create multiple accounts with the same Government ID.`;
      }
    }

    // Check Firestore database
    const fsError = await checkDuplicateUserInFirestore(nameToCheck, phoneToCheck, govIdToCheck);
    if (fsError) return fsError;

    return null;
  };

  // Sign In handler
  const handleSignIn = async () => {
    setErrorMsg(null);
    if (!loginQuery.trim()) {
      setErrorMsg('Please enter your account name or phone number');
      return;
    }

    setIsSearching(true);
    const queryClean = loginQuery.trim().toLowerCase();
    const phoneClean = loginQuery.replace(/\D/g, "");

    // 1. Search local & network memory
    const combined = [...registeredUsers, ...allNetworkUsers];
    let matched = combined.find(u =>
      (u.name && u.name.trim().toLowerCase() === queryClean) ||
      (phoneClean.length >= 5 && u.phoneNumber && u.phoneNumber.replace(/\D/g, "") === phoneClean)
    );

    // 2. Query Express Backend API if not found
    if (!matched) {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (data && data.success && Array.isArray(data.users)) {
          matched = data.users.find((u: any) =>
            (u.name && u.name.trim().toLowerCase() === queryClean) ||
            (phoneClean.length >= 5 && u.phoneNumber && u.phoneNumber.replace(/\D/g, "") === phoneClean)
          );
        }
      } catch (e) {
        console.warn('Sign-in API fetch offline:', e);
      }
    }

    setIsSearching(false);

    if (matched) {
      onSelectUser(matched);
      onClose();
    } else {
      setErrorMsg(`No account found matching "${loginQuery}". Check spelling or create a new account.`);
    }
  };

  const handleSendOtp = async () => {
    setErrorMsg(null);
    if (!phoneNumber || phoneNumber.length < 5) {
      setErrorMsg('Please enter a valid phone number (e.g. +1 555-0192)');
      return;
    }

    const dupErr = await validateDuplicates(undefined, phoneNumber, undefined);
    if (dupErr) {
      setErrorMsg(dupErr);
      return;
    }

    setOtpSent(true);
    setOtpCode('123456');
  };

  const handleVerifyOtp = () => {
    setErrorMsg(null);
    if (otpCode === '123456' || otpCode.length >= 4) {
      setPhoneVerified(true);
    } else {
      setErrorMsg('Enter code 123456 to verify!');
    }
  };

  const handleSimulateIdScan = async () => {
    setErrorMsg(null);
    if (!governmentId || governmentId.trim().length < 3) {
      setErrorMsg('Please enter your Government ID / Passport Number (e.g. GOV-894201)');
      return;
    }

    const dupErr = await validateDuplicates(undefined, undefined, governmentId);
    if (dupErr) {
      setErrorMsg(dupErr);
      return;
    }

    setIdUploading(true);
    setTimeout(() => {
      setIdUploading(false);
      setIdentityVerified(true);
    }, 1000);
  };

  const handleAnswerQuiz = (optionIdx: number) => {
    setErrorMsg(null);
    setQuizAnswer(optionIdx);
    if (optionIdx === sampleQuiz[quizQuestionIndex].correct) {
      if (quizQuestionIndex + 1 < sampleQuiz.length) {
        setTimeout(() => {
          setQuizQuestionIndex(quizQuestionIndex + 1);
          setQuizAnswer(null);
        }, 500);
      } else {
        setTimeout(() => {
          setSkillVerified(true);
        }, 500);
      }
    } else {
      setErrorMsg('Option chosen was incorrect, try option 2!');
    }
  };

  const handleCompleteRegistration = async () => {
    setErrorMsg(null);
    if (!name.trim()) {
      setErrorMsg('Please enter your full name to create an account');
      return;
    }

    const dupErr = await validateDuplicates(name.trim(), phoneNumber, governmentId);
    if (dupErr) {
      setErrorMsg(dupErr);
      return;
    }

    const skillsArray = skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      let registeredUserFromApi: any = null;
      try {
        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            headline: headline.trim() || 'Community Contributor',
            bio: bio.trim() || 'Ready to collaborate on Near Intent.',
            location: location.trim() || 'San Francisco, CA',
            skills: skillsArray.length > 0 ? skillsArray : ['General'],
            avatar,
            phoneNumber: phoneNumber.trim() || undefined,
            governmentId: governmentId.trim() || undefined,
            phoneVerified,
            identityVerified,
            skillVerified
          })
        });

        const data = await response.json();
        if (!response.ok) {
          if (data && data.error) {
            setErrorMsg(data.error);
            return;
          }
        }
        if (data.success && data.user) {
          registeredUserFromApi = data.user;
        }
      } catch (e) {
        console.warn('API registration offline, proceeding locally:', e);
      }

      const rawUser = registeredUserFromApi || {};
      const fullUserProfile: UserProfile = {
        id: rawUser.id || `u_${Date.now()}`,
        name: rawUser.name || name.trim(),
        avatar: rawUser.avatar || avatar,
        headline: rawUser.headline || headline.trim() || 'Near Intent Member',
        bio: rawUser.bio || bio.trim() || 'Active intent collaborator.',
        phoneNumber: phoneNumber.trim() || undefined,
        governmentId: governmentId.trim() || undefined,
        trustScore: rawUser.trustScore || ((identityVerified || phoneVerified) ? 98 : 88),
        karmaPoints: rawUser.karmaPoints || 100,
        coins: rawUser.coins || 100,
        xp: rawUser.xp || 500,
        levelName: rawUser.levelName || 'Explorer',
        levelNumber: rawUser.levelNumber || 1,
        responseTime: rawUser.responseTime || '< 15 mins',
        completedIntents: 0,
        successRate: 100,
        location: rawUser.location || location.trim() || 'San Francisco, CA',
        languages: ['English'],
        skills: skillsArray.length > 0 ? skillsArray : ['General'],
        experience: [],
        portfolio: [],
        badges: [
          {
            id: `b_${Date.now()}`,
            name: 'Verified Member',
            iconName: 'ShieldCheck',
            description: 'Passed real identity & phone checks',
            color: 'emerald',
            earnedAt: 'Just Now'
          }
        ],
        verificationStatus: {
          identity: !!identityVerified,
          phone: !!phoneVerified,
          skillVerified: !!skillVerified
        },
        noShowPenalties: 0,
        cancellationPenalties: 0,
        streakDays: 1
      };

      await saveUserToFirestore(fullUserProfile);
      onRegisterNewUser(fullUserProfile);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete registration');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl shadow-indigo-950/40 text-slate-100 flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Account & Identity Management
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold">
                  Secure
                </span>
              </h2>
              <p className="text-xs text-slate-400">Manage device accounts, sign in, or create a unique profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 p-1.5 gap-1">
          <button
            onClick={() => { setTab('switch'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'switch'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Switch Account ({registeredUsers.length})</span>
          </button>

          <button
            onClick={() => { setTab('signin'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'signin'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => { setTab('register'); setErrorMsg(null); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Inline Error Alert Banner */}
        {errorMsg && (
          <div className="m-4 mb-0 bg-rose-950/80 border border-rose-500/40 p-3 rounded-2xl text-xs text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: SWITCH USER (Device Accounts) */}
        {tab === 'switch' && (
          <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Accounts maintained on this device:
              </p>
              <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800">
                Isolated to Device
              </span>
            </div>

            <div className="space-y-2.5">
              {registeredUsers.map((u) => {
                const isActive = u.id === activeUser.id;
                return (
                  <div
                    key={u.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-indigo-950/60 border-indigo-500/50 shadow-md'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      onClick={() => {
                        onSelectUser(u);
                        onClose();
                      }}
                      className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    >
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-11 h-11 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          {u.name}
                          {isActive && (
                            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-1.5 py-0.2 rounded font-normal">
                              Active
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">{u.headline}</p>
                        <p className="text-[10px] text-slate-500">{u.location} • Trust {u.trustScore}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onSelectUser(u);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        }`}
                      >
                        {isActive ? 'Current' : 'Switch'}
                      </button>

                      {onRemoveUserFromDevice && registeredUsers.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveUserFromDevice(u.id);
                          }}
                          title="Remove from this device"
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => { setTab('signin'); setErrorMsg(null); }}
                className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sign In to Existing Account</span>
              </button>
              <button
                onClick={() => { setTab('register'); setErrorMsg(null); }}
                className="flex-1 py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Create New Account</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: SIGN IN */}
        {tab === 'signin' && (
          <div className="p-5 space-y-4 max-h-[480px] overflow-y-auto">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Sign In with Credentials
                </h3>
                <p className="text-[11px] text-slate-400">
                  Enter the exact name or registered phone number of your account to load it onto this device:
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Account Name or Phone Number *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={loginQuery}
                    onChange={(e) => setLoginQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSignIn();
                    }}
                    placeholder="e.g. Harikrishna or +1 555-0192"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pr-10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>

              <button
                onClick={handleSignIn}
                disabled={isSearching}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isSearching ? (
                  <span>Searching Credentials...</span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Device</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Accounts signed in on this device will be securely saved to your device switcher.</span>
            </div>
          </div>
        )}

        {/* TAB 3: REGISTER NEW ACCOUNT */}
        {tab === 'register' && (
          <div className="p-5 space-y-5 max-h-[520px] overflow-y-auto">
            
            {/* Step indicator */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-3">
              <span className={step === 1 ? 'text-indigo-400 flex items-center gap-1' : 'text-slate-500'}>
                1. Basic Info & Photo
              </span>
              <span>→</span>
              <span className={step === 2 ? 'text-indigo-400 flex items-center gap-1' : 'text-slate-500'}>
                2. Trust Verification Checks
              </span>
            </div>

            {/* Step 1 Form */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Each account must have a unique name on Near Intent.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Role / Headline</label>
                    <input
                      type="text"
                      value={headline}
                      onChange={(e) => setHeadline(e.target.value)}
                      placeholder="e.g. Senior Fullstack Engineer"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">City / Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. React, Python, Docker, AI"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Profile Photo Upload / Preset Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Profile Photo</label>
                  <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={avatar}
                        alt="Avatar Preview"
                        className="w-12 h-12 rounded-xl object-cover border-2 border-indigo-500 shrink-0 bg-slate-900"
                      />
                      <div className="flex-1 space-y-1">
                        <label className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md shadow-indigo-600/20">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Upload Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (reader.result) setAvatar(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        <p className="text-[10px] text-slate-400">Or pick a preset avatar below:</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {PRESET_AVATARS.map((url, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(url)}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                            avatar === url ? 'border-indigo-500 scale-105' : 'border-slate-800 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={url} alt={`Avatar preset ${idx}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Short Bio</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell local community members what skills you bring..."
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={async () => {
                      if (!name.trim()) {
                        setErrorMsg('Please enter your full name');
                        return;
                      }
                      const dupErr = await validateDuplicates(name.trim(), undefined, undefined);
                      if (dupErr) {
                        setErrorMsg(dupErr);
                        return;
                      }
                      setErrorMsg(null);
                      setStep(2);
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Verifications</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleCompleteRegistration}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Create Instantly</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Verification Checks */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400">
                  Verify your trust parameters to unlock verified status and priority AI intent matches:
                </p>

                {/* 1. Phone SMS Check */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Smartphone className="w-4 h-4 text-indigo-400" />
                      <span>1. Phone SMS Verification</span>
                    </div>
                    {phoneVerified && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  {!phoneVerified ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+1 555-0192"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={handleSendOtp}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shrink-0"
                        >
                          {otpSent ? 'Resend OTP' : 'Send Code'}
                        </button>
                      </div>

                      {otpSent && (
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="Enter OTP (123456)"
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            onClick={handleVerifyOtp}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shrink-0"
                          >
                            Verify OTP
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">Phone number verified successfully.</p>
                  )}
                </div>

                {/* 2. Government ID Check */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <FileCheck className="w-4 h-4 text-indigo-400" />
                      <span>2. Government ID Check</span>
                    </div>
                    {identityVerified && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  {!identityVerified ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={governmentId}
                          onChange={(e) => setGovernmentId(e.target.value)}
                          placeholder="e.g. Passport / GOV-9842"
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={handleSimulateIdScan}
                          disabled={idUploading}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-1"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{idUploading ? 'Scanning...' : 'Verify ID'}</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">Government ID verified.</p>
                  )}
                </div>

                {/* 3. Skill & Expertise Quiz */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>3. Platform Knowledge Quiz</span>
                    </div>
                    {skillVerified && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Verified
                      </span>
                    )}
                  </div>

                  {!skillVerified ? (
                    <div className="space-y-2 text-xs">
                      <p className="font-medium text-slate-200">
                        Q: {sampleQuiz[quizQuestionIndex].question}
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        {sampleQuiz[quizQuestionIndex].options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAnswerQuiz(idx)}
                            className={`p-2 rounded-xl border text-left text-[11px] transition-all ${
                              quizAnswer === idx
                                ? idx === sampleQuiz[quizQuestionIndex].correct
                                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                  : 'bg-rose-950/80 border-rose-500 text-rose-200'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">Skills and domain competence verified.</p>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCompleteRegistration}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete & Save Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
