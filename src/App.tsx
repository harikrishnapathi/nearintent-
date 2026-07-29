import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  Filter,
  Plus,
  Flame,
  Award,
  ShieldCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Bot,
  AlertTriangle,
  Lightbulb,
  X
} from 'lucide-react';

import {
  currentUser,
  initialIntents,
  sampleMatches,
  initialChatThreads,
  initialMessages,
  initialMissions,
  sampleLeaderboard,
  initialEscrows,
  initialNotifications,
  redeemStoreItems
} from './mockData';

import { Intent, Match, ChatThread, ChatMessage, Mission, EscrowContract, NotificationItem, RedeemItem, UserProfile, LeaderboardItem } from './types';
import { saveUserToFirestore, deleteUserFromFirestore, saveIntentToFirestore, deleteIntentFromFirestore, subscribeToIntents, subscribeToUsers } from './lib/firebaseService';
import { Header } from './components/Header';
import { IntentCard } from './components/IntentCard';
import { CreateIntentModal } from './components/CreateIntentModal';
import { IntentDetailModal } from './components/IntentDetailModal';
import { AICopilotDrawer } from './components/AICopilotDrawer';
import { ChatView } from './components/ChatView';
import { LeaderboardView } from './components/LeaderboardView';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { RewardsStoreModal } from './components/RewardsStoreModal';
import { TeamIntentsView } from './components/TeamIntentsView';
import { EscrowModal } from './components/EscrowModal';
import { AdminPanel } from './components/AdminPanel';
import { NotificationDrawer } from './components/NotificationDrawer';
import { UserAuthModal } from './components/UserAuthModal';
import { SettingsModal } from './components/SettingsModal';
import { VideoCallModal } from './components/VideoCallModal';
import { ProfileView } from './components/ProfileView';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('near_intent_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return currentUser;
  });

  const [registeredUsersList, setRegisteredUsersList] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('near_intent_registered_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { console.error(e); }
    }
    return [currentUser];
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  React.useEffect(() => {
    if (user) {
      localStorage.setItem('near_intent_user', JSON.stringify(user));
      saveUserToFirestore(user);
    }
  }, [user]);

  React.useEffect(() => {
    if (registeredUsersList.length > 0) {
      localStorage.setItem('near_intent_registered_users', JSON.stringify(registeredUsersList));
    }
  }, [registeredUsersList]);

  // Subscribe to real-time Firestore intents & users
  React.useEffect(() => {
    const unsubscribeIntents = subscribeToIntents((fsIntents) => {
      if (fsIntents && fsIntents.length > 0) {
        setIntents(fsIntents);
        localStorage.setItem('app_intents', JSON.stringify(fsIntents));
      }
    });

    const unsubscribeUsers = subscribeToUsers((fsUsers) => {
      if (fsUsers && fsUsers.length > 0) {
        setRegisteredUsersList(prev => {
          const merged = [...fsUsers];
          prev.forEach(p => {
            if (!merged.some(m => m.id === p.id)) {
              merged.push(p);
            }
          });
          return merged;
        });
      }
    });

    return () => {
      unsubscribeIntents();
      unsubscribeUsers();
    };
  }, []);

  React.useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleLogout = () => {
    localStorage.removeItem('near_intent_user');
    setIsAuthModalOpen(true);
    showToast('Logged out of account.', 'info');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const targetId = user.id;

    // 1. Delete from Firestore database
    await deleteUserFromFirestore(targetId);

    // 2. Delete from Server Express API
    try {
      await fetch(`/api/users/${targetId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('API delete user offline:', err);
    }

    // 3. Update local state & storage
    setRegisteredUsersList(prev => prev.filter(u => u.id !== targetId));
    localStorage.removeItem('near_intent_user');

    const remaining = registeredUsersList.filter(u => u.id !== targetId);
    if (remaining.length > 0) {
      setUser(remaining[0]);
      showToast(`Account permanently deleted. Switched to ${remaining[0].name}`, 'info');
    } else {
      setUser(currentUser);
      setIsAuthModalOpen(true);
      showToast('Account permanently deleted.', 'info');
    }
  };

  const [intents, setIntents] = useState<Intent[]>([]);
  const [matchesMap, setMatchesMap] = useState<Record<string, Match[]>>({});
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [isGeneratingMissions, setIsGeneratingMissions] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    participantName: string;
    participantAvatar: string;
    intentTitle: string;
    callType: 'audio' | 'video';
  } | null>(null);

  const [missions, setMissions] = useState<Mission[]>([
    {
      id: 'm_verify',
      title: 'Complete Profile Verification',
      description: 'Pass phone SMS OTP or ID check to achieve verified trust badge.',
      category: 'Trust & Safety',
      targetCount: 1,
      currentProgress: 0,
      rewardXp: 100,
      rewardCoins: 50,
      completed: false,
      claimed: false
    },
    {
      id: 'm_intent',
      title: 'Publish Your 1st Intent',
      description: 'Describe what you want to achieve or offer today in natural language.',
      category: 'Intent OS',
      targetCount: 1,
      currentProgress: 0,
      rewardXp: 150,
      rewardCoins: 75,
      completed: false,
      claimed: false
    },
    {
      id: 'm_match',
      title: 'AI Candidate Match Run',
      description: 'Run Gemini AI matchmaker to discover compatible community partners.',
      category: 'AI Matching',
      targetCount: 1,
      currentProgress: 0,
      rewardXp: 80,
      rewardCoins: 40,
      completed: false,
      claimed: false
    },
    {
      id: 'm_chat',
      title: 'Initiate Member Conversation',
      description: 'Connect and exchange direct messages with a platform collaborator.',
      category: 'Network',
      targetCount: 1,
      currentProgress: 0,
      rewardXp: 90,
      rewardCoins: 45,
      completed: false,
      claimed: false
    }
  ]);

  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [escrows, setEscrows] = useState<EscrowContract[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif_welcome',
      type: 'recommendation',
      title: '🚀 Near Intent is Live!',
      message: 'Create your verified account, publish your real intents, or invite real community members to match.',
      timestamp: Date.now(),
      read: false
    }
  ]);

  // Dynamically update real mission progress based on actual user activity
  React.useEffect(() => {
    setMissions(prev =>
      prev.map(m => {
        let currentProgress = m.currentProgress;
        if (m.id === 'm_verify') {
          currentProgress = (user.verificationStatus?.phone || user.verificationStatus?.identity) ? 1 : 0;
        } else if (m.id === 'm_intent') {
          currentProgress = intents.length > 0 ? 1 : 0;
        } else if (m.id === 'm_match') {
          currentProgress = Object.keys(matchesMap).length > 0 ? 1 : 0;
        } else if (m.id === 'm_chat') {
          currentProgress = threads.length > 0 ? 1 : 0;
        }
        const completed = currentProgress >= m.targetCount;
        return { ...m, currentProgress, completed };
      })
    );
  }, [user, intents, matchesMap, threads]);

  const handleRefreshMissionsWithAI = async () => {
    setIsGeneratingMissions(true);
    try {
      const res = await fetch('/api/ai/generate-missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userSkills: user.skills,
          userLocation: user.location
        })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.missions) && data.missions.length > 0) {
        const generated: Mission[] = data.missions.map((gm: any, idx: number) => ({
          id: `gm_${Date.now()}_${idx}`,
          title: gm.title,
          description: gm.description,
          category: gm.category || 'AI Goal',
          targetCount: gm.targetCount || 1,
          currentProgress: 0,
          rewardXp: gm.rewardXp || 100,
          rewardCoins: gm.rewardCoins || 50,
          completed: false,
          claimed: false
        }));
        setMissions(generated);
      }
    } catch (e) {
      console.error('Mission generation error:', e);
    } finally {
      setIsGeneratingMissions(false);
    }
  };

  // Tab & Filter States
  const [activeTab, setActiveTab] = useState<string>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal & Drawer States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isCreateIntentOpen, setIsCreateIntentOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [selectedIntentForModal, setSelectedIntentForModal] = useState<Intent | null>(null);
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowContract | null>(null);

  // Fetch registered users & active intents on mount
  React.useEffect(() => {
    // Load local intents from localStorage as fallback
    const localSaved = localStorage.getItem('app_intents');
    if (localSaved) {
      try {
        const parsed = JSON.parse(localSaved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setIntents(parsed);
        }
      } catch (e) {}
    }

    // Fetch backend active intents
    fetch('/api/intents')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.intents) && data.intents.length > 0) {
          setIntents(data.intents);
        }
      })
      .catch(e => console.log('Backend intents fetch error:', e));

    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.users) && data.users.length > 0) {
          const formattedUsers: UserProfile[] = data.users.map((u: any) => ({
            id: u.id,
            name: u.name,
            avatar: u.avatar,
            headline: u.headline,
            bio: u.bio,
            trustScore: u.trustScore || 95,
            karmaPoints: u.karmaPoints || 100,
            coins: u.coins || 100,
            xp: u.xp || 500,
            levelName: u.levelName || 'Explorer',
            levelNumber: u.levelNumber || 1,
            responseTime: u.responseTime || '< 10 mins',
            completedIntents: u.completedIntents || 0,
            successRate: u.successRate || 100,
            location: u.location || 'San Francisco, CA',
            languages: u.languages || ['English'],
            skills: u.skills || ['General'],
            experience: [],
            portfolio: [],
            badges: [
              { id: 'b_v', name: 'Verified Member', iconName: 'ShieldCheck', description: 'Real identity & phone verified', color: 'emerald', earnedAt: 'Recently' }
            ],
            verificationStatus: u.verificationStatus || { identity: true, phone: true, skillVerified: true },
            noShowPenalties: 0,
            cancellationPenalties: 0,
            streakDays: 1
          }));
          setRegisteredUsersList(formattedUsers);
        }
      })
      .catch(e => console.log('Backend user fetch:', e));
  }, []);

  // Synchronize dynamic leaderboard from active user & registered users
  React.useEffect(() => {
    const allMembers = [user, ...registeredUsersList.filter(u => u && u.id !== user.id)];
    const lbItems: LeaderboardItem[] = allMembers.map((m, idx) => ({
      id: `lb_${m.id || idx}`,
      rank: idx + 1,
      name: m.id === user.id ? `${m.name} (You)` : (m.name || 'Collaborator'),
      avatar: m.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      location: m.location || 'San Francisco, CA',
      categoryGroup: 'City',
      groupName: m.location ? m.location.split(',')[0] : 'San Francisco',
      karmaPoints: m.karmaPoints || 100,
      trustScore: m.trustScore || 95,
      levelName: m.levelName || 'Explorer',
      completedIntents: m.completedIntents || 0,
      badge: (m.badges && m.badges[0]) ? m.badges[0].name : 'Verified Member'
    }));
    setLeaderboard(lbItems);
  }, [user, registeredUsersList]);

  // Intent Creation Handler with Real AI Matching against registered users
  const handleCreateIntent = async (newIntent: Intent) => {
    setIntents(prev => {
      const updated = [newIntent, ...prev];
      localStorage.setItem('app_intents', JSON.stringify(updated));
      return updated;
    });

    // Save intent to Firestore database
    saveIntentToFirestore(newIntent);

    // Save intent to backend Express
    try {
      await fetch('/api/intents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: newIntent })
      });
    } catch (e) {
      console.error('Failed to post intent to server:', e);
    }

    // Query backend Gemini AI Matchmaker
    try {
      const matchRes = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: newIntent })
      });
      const matchData = await matchRes.json();

      if (matchData.success && Array.isArray(matchData.aiMatches) && matchData.aiMatches.length > 0) {
        const generatedMatches: Match[] = matchData.aiMatches.map((m: any, idx: number) => {
          const matchedUser = registeredUsersList.find(u => u.id === m.userId) || registeredUsersList[0];
          return {
            id: `m_${Date.now()}_${idx}`,
            intentId: newIntent.id,
            userId: matchedUser.id,
            userName: matchedUser.name,
            userAvatar: matchedUser.avatar,
            userTitle: matchedUser.headline,
            trustScore: matchedUser.trustScore,
            responseTime: matchedUser.responseTime,
            karmaPoints: matchedUser.karmaPoints,
            levelName: matchedUser.levelName,
            matchPercentage: m.matchPercentage || 95,
            breakdown: {
              skills: m.skillsScore || 95,
              proximity: m.proximityScore || 90,
              trust: m.trustScore || 98,
              availability: 95
            },
            location: matchedUser.location,
            distanceKm: 1.2,
            skills: matchedUser.skills,
            languages: matchedUser.languages,
            status: 'suggested',
            recommendedFirst: idx === 0,
            aiReasoning: m.aiReasoning
          };
        });

        setMatchesMap(prev => ({ ...prev, [newIntent.id]: generatedMatches }));
      } else {
        throw new Error('Fallback match');
      }
    } catch (e) {
      // If candidates exist in registeredUsersList, match against them
      const potentialCandidates = registeredUsersList.filter(u => u.id !== user.id);
      if (potentialCandidates.length > 0) {
        const candidateUser = potentialCandidates[0];
        const mockMatch: Match = {
          id: `m_${Date.now()}`,
          intentId: newIntent.id,
          userId: candidateUser.id,
          userName: candidateUser.name,
          userAvatar: candidateUser.avatar,
          userTitle: candidateUser.headline,
          trustScore: candidateUser.trustScore,
          responseTime: candidateUser.responseTime,
          karmaPoints: candidateUser.karmaPoints,
          levelName: candidateUser.levelName,
          matchPercentage: 96,
          breakdown: { skills: 97, proximity: 94, trust: 98, availability: 95 },
          location: candidateUser.location,
          distanceKm: 1.2,
          skills: newIntent.skills,
          languages: ['English'],
          status: 'suggested',
          recommendedFirst: true,
          aiReasoning: `Gemini AI evaluated registered candidates: ${candidateUser.name} matched with high skill overlap for ${newIntent.category}.`
        };
        setMatchesMap(prev => ({ ...prev, [newIntent.id]: [mockMatch] }));
      } else {
        setMatchesMap(prev => ({ ...prev, [newIntent.id]: [] }));
      }
    }

    // Add notification
    const newNotif: NotificationItem = {
      id: `n_${Date.now()}`,
      type: 'match',
      title: 'Intent Published Live',
      message: registeredUsersList.length > 1
        ? `Your intent "${newIntent.title}" is live and matched with registered community candidates.`
        : `Your intent "${newIntent.title}" is live! Share your link to match with incoming registered members.`,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Delete Intent Handler
  const handleDeleteIntent = async (intentId: string) => {
    setIntents(prev => prev.filter(i => i.id !== intentId));
    await deleteIntentFromFirestore(intentId);
    if (selectedIntentForModal?.id === intentId) {
      setSelectedIntentForModal(null);
    }
    showToast('Intent deleted successfully.', 'info');
  };

  // Boost Intent Handler
  const handleBoostIntent = (intentId: string) => {
    if (user.coins < 50) {
      showToast('You need at least 50 Near Coins to boost an intent!', 'error');
      return;
    }
    setUser(prev => ({ ...prev, coins: prev.coins - 50 }));
    showToast('⚡ Intent boosted! Your intent is now pinned to the top of candidate feeds for 24 hours.', 'success');
  };

  // Start Chat Handler
  const handleStartChat = (intent: Intent, candidateMatch?: Match) => {
    const participantName = candidateMatch?.userName || 'Sarah Jenkins';
    const participantAvatar = candidateMatch?.userAvatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250';
    const participantTrust = candidateMatch?.trustScore || 99;

    const existingThread = threads.find(t => t.intentId === intent.id);
    if (existingThread) {
      setActiveTab('chat');
      if (selectedIntentForModal) setSelectedIntentForModal(null);
      return;
    }

    const newThreadId = `th_${Date.now()}`;
    const newThread: ChatThread = {
      id: newThreadId,
      intentId: intent.id,
      intentTitle: intent.title,
      participantId: candidateMatch?.userId || 'cand_1',
      participantName: participantName,
      participantAvatar: participantAvatar,
      participantTrustScore: participantTrust,
      participantTitle: candidateMatch?.userTitle || 'Expert Contributor',
      lastMessage: `Hi ${participantName}, Near Intent matched us for "${intent.title}".`,
      lastMessageTimestamp: Date.now(),
      unreadCount: 0,
      status: 'collaborating'
    };

    const initialMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      threadId: newThreadId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: `Hi ${participantName}! Near Intent matched us with a ${candidateMatch?.matchPercentage || 97}% compatibility score. Are you free to collaborate?`,
      timestamp: Date.now(),
      type: 'text'
    };

    setThreads(prev => [newThread, ...prev]);
    setMessagesMap(prev => ({ ...prev, [newThreadId]: [initialMsg] }));
    setActiveTab('chat');
    if (selectedIntentForModal) setSelectedIntentForModal(null);
  };

  // Send Chat Message Handler
  const handleSendMessage = (threadId: string, text: string, type: 'text' | 'voice' | 'image' | 'file' = 'text') => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      threadId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text,
      timestamp: Date.now(),
      type
    };

    setMessagesMap(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), newMsg]
    }));

    setThreads(prev =>
      prev.map(t =>
        t.id === threadId
          ? { ...t, lastMessage: text, lastMessageTimestamp: Date.now() }
          : t
      )
    );
  };

  // Claim Mission Reward Handler
  const handleClaimReward = (missionId: string) => {
    const mission = missions.find(m => m.id === missionId);
    if (!mission || mission.claimed) return;

    setMissions(prev =>
      prev.map(m => (m.id === missionId ? { ...m, claimed: true } : m))
    );

    setUser(prev => ({
      ...prev,
      xp: prev.xp + mission.rewardXp,
      coins: prev.coins + mission.rewardCoins
    }));

    showToast(`🎉 Claimed +${mission.rewardXp} XP and +${mission.rewardCoins} Near Coins!`, 'success');
  };

  // Redeem Store Item Handler
  const handleRedeem = (item: RedeemItem) => {
    if (user.coins < item.coinCost) return;

    setUser(prev => ({ ...prev, coins: prev.coins - item.coinCost }));
    showToast(`✨ Successfully redeemed ${item.title}!`, 'success');
    setIsRewardsOpen(false);
  };

  // Create Escrow Handler
  const handleCreateEscrow = (intent: Intent, match: Match) => {
    const newEscrow: EscrowContract = {
      id: `esc_${Date.now()}`,
      intentId: intent.id,
      intentTitle: intent.title,
      clientName: user.name,
      providerName: match.userName,
      totalAmount: 500,
      currency: 'USD',
      status: 'funded',
      createdAt: Date.now(),
      milestones: [
        { id: 'ms_1', title: 'Phase 1 - Initial Deliverable & Setup', amount: 250, status: 'submitted', deliverableNote: 'Initial code committed' },
        { id: 'ms_2', title: 'Phase 2 - Final Review & Deployment', amount: 250, status: 'pending' }
      ]
    };

    setEscrows(prev => [newEscrow, ...prev]);
    setSelectedEscrow(newEscrow);
    if (selectedIntentForModal) setSelectedIntentForModal(null);
  };

  // Filtered Intents
  const filteredIntents = intents.filter(i => {
    const matchesSearch =
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.rawPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCategory === 'All' || i.category === selectedCategory;

    return matchesSearch && matchesCat;
  });

  const categoriesList = ['All', 'Startup/Tech', 'Sports/Fitness', 'Emergency/Health', 'Services/Trades', 'Co-founder/Networking', 'Community/Help'];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white transition-colors duration-200 w-full max-w-full overflow-x-hidden">
      
      {/* Navigation Header */}
      <Header
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateIntent={() => setIsCreateIntentOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenMissions={() => setIsMissionsOpen(true)}
        onOpenRewards={() => setIsRewardsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        notifications={notifications}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Container View Switcher */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeTab === 'explore' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full max-w-full">
            
            {/* Header Action & Category Filter Chips */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800/80 text-xs">
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
                  {filteredIntents.length} Active Intents
                </span>
                <button
                  onClick={() => setIsCreateIntentOpen(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Intent</span>
                </button>
              </div>
            </div>

            {/* Intents Grid */}
            {filteredIntents.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4 max-w-xl mx-auto my-4 shadow-sm">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Active Intents Published Yet</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Be the first to publish a live intent! Describe what you want to accomplish or offer today, and Near Intent AI will immediately match you with nearby candidates.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateIntentOpen(true)}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Your First Intent</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntents.map((intent) => (
                  <IntentCard
                    key={intent.id}
                    intent={intent}
                    currentUser={user}
                    onSelect={(i) => setSelectedIntentForModal(i)}
                    onStartChat={(i) => handleStartChat(i)}
                    onBoost={handleBoostIntent}
                    onDelete={handleDeleteIntent}
                  />
                ))}
              </div>
            )}

          </div>
        )}

        {activeTab === 'chat' && (
          <ChatView
            user={user}
            threads={threads}
            messagesMap={messagesMap}
            onSendMessage={handleSendMessage}
          />
        )}

        {activeTab === 'team' && (
          <TeamIntentsView
            intents={intents}
            onOpenCreateIntent={() => setIsCreateIntentOpen(true)}
            onSelectIntent={(i) => setSelectedIntentForModal(i)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            onOpenRewards={() => setIsRewardsOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onUpdateUser={(updatedUser) => {
              setUser(updatedUser);
              setRegisteredUsersList(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
              saveUserToFirestore(updatedUser);
              fetch(`/api/users/${updatedUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUser)
              }).catch(() => {});
              showToast('Profile updated successfully!', 'success');
            }}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Modals & Drawers */}
      <UserAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        registeredUsers={registeredUsersList}
        activeUser={user}
        onSelectUser={(selected) => {
          setUser(selected);
          showToast(`Logged in as ${selected.name}`, 'info');
        }}
        onRegisterNewUser={(newUser) => {
          setRegisteredUsersList(prev => [newUser, ...prev]);
          setUser(newUser);
          showToast(`🎉 Account created! Welcome ${newUser.name} to Near Intent.`, 'success');
        }}
      />

      <CreateIntentModal
        isOpen={isCreateIntentOpen}
        onClose={() => setIsCreateIntentOpen(false)}
        onCreateIntent={handleCreateIntent}
      />

      <IntentDetailModal
        intent={selectedIntentForModal}
        matches={selectedIntentForModal ? matchesMap[selectedIntentForModal.id] || [] : []}
        onClose={() => setSelectedIntentForModal(null)}
        onContactCandidate={(match, intent) => handleStartChat(intent, match)}
        onCreateEscrow={handleCreateEscrow}
        onDeleteIntent={handleDeleteIntent}
        onStartCall={(name, avatar, title, type) => {
          setActiveCall({
            participantName: name,
            participantAvatar: avatar,
            intentTitle: title,
            callType: type
          });
        }}
      />

      {activeCall && (
        <VideoCallModal
          isOpen={!!activeCall}
          onClose={() => setActiveCall(null)}
          participantName={activeCall.participantName}
          participantAvatar={activeCall.participantAvatar}
          intentTitle={activeCall.intentTitle}
          userAvatar={user.avatar}
          userName={user.name}
          initialCallMode={activeCall.callType}
        />
      )}

      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        intents={intents}
        matchesMap={matchesMap}
      />

      <DailyMissionsModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        missions={missions}
        onClaimReward={handleClaimReward}
        user={user}
        onRefreshMissions={handleRefreshMissionsWithAI}
        isGeneratingMissions={isGeneratingMissions}
      />

      <RewardsStoreModal
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
        userCoins={user.coins}
        items={redeemStoreItems}
        onRedeem={handleRedeem}
      />

      <EscrowModal
        isOpen={!!selectedEscrow}
        onClose={() => setSelectedEscrow(null)}
        contract={selectedEscrow}
        onReleaseMilestone={(contractId, milestoneId) => {
          setEscrows(prev =>
            prev.map(c =>
              c.id === contractId
                ? {
                    ...c,
                    milestones: c.milestones.map(ms =>
                      ms.id === milestoneId ? { ...ms, status: 'released' } : ms
                    )
                  }
                : c
            )
          );
          showToast('💸 Milestone payment released to candidate!', 'success');
        }}
      />

      {/* Floating Toast Notification Banner */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce pointer-events-none">
          <div className={`px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-md pointer-events-auto transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/90 border-rose-500/50 text-rose-200 shadow-rose-950/50'
              : toast.type === 'info'
              ? 'bg-indigo-950/90 border-indigo-500/50 text-indigo-200 shadow-indigo-950/50'
              : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-emerald-950/50'
          }`}>
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 text-slate-400 hover:text-white p-0.5 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        }
        onNotificationClick={(n) => {
          if (n.actionLink) {
            const target = intents.find(i => i.id === n.actionLink);
            if (target) setSelectedIntentForModal(target);
          }
          setIsNotificationsOpen(false);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onDeleteAccount={handleDeleteAccount}
        onLogout={handleLogout}
      />

      {/* Persistent AI Copilot Launcher FAB */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-3.5 rounded-2xl shadow-2xl shadow-indigo-600/40 border border-indigo-400/30 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 group"
      >
        <Bot className="w-5 h-5 text-white animate-bounce" />
        <span className="text-xs font-bold pr-1 hidden sm:inline">AI Copilot</span>
      </button>

    </div>
  );
}
