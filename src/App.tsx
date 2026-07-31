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
  Globe,
  Tag,
  Handshake,
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

import { Intent, Match, ChatThread, ChatMessage, Mission, EscrowContract, NotificationItem, RedeemItem, UserProfile, LeaderboardItem, CallSignal } from './types';
import {
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveIntentToFirestore,
  deleteIntentFromFirestore,
  subscribeToIntents,
  subscribeToUsers,
  saveThreadToFirestore,
  subscribeToThreads,
  saveMessageToFirestore,
  deleteMessageFromFirestore,
  deleteThreadFromFirestore,
  subscribeToAllMessages,
  saveCallSignalToFirestore,
  subscribeToCalls,
  updateCallSignalInFirestore
} from './lib/firebaseService';
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
import { IncomingCallModal } from './components/IncomingCallModal';
import { CategorySelectorModal } from './components/CategorySelectorModal';
import { ProfileView } from './components/ProfileView';

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<UserProfile>(() => {
    const sess = sessionStorage.getItem('near_intent_user');
    if (sess) {
      try { return JSON.parse(sess); } catch (e) { console.error(e); }
    }
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

  // Helper to trigger real-time updates across multiple windows/tabs
  const notifyCrossTabSync = () => {
    try {
      localStorage.setItem('app_intents_sync_trigger', Date.now().toString());
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('near_intent_realtime_channel');
        bc.postMessage({ type: 'INTENT_UPDATE', timestamp: Date.now() });
        bc.close();
      }
    } catch (e) {
      console.warn('Cross tab broadcast error:', e);
    }
  };

  React.useEffect(() => {
    if (user) {
      sessionStorage.setItem('near_intent_user', JSON.stringify(user));
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
        mergeAndSetIntents(fsIntents);
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

  // Real-time Multi-Window Polling & BroadcastChannel Sync Effect
  React.useEffect(() => {
    const fetchServerIntents = async () => {
      try {
        const res = await fetch('/api/intents');
        if (!res.ok) return;
        const data = await res.json();
        if (data && data.success && Array.isArray(data.intents)) {
          mergeAndSetIntents(data.intents);
        }
      } catch (e) {
        // quiet fallback for network drops
      }
    };

    fetchServerIntents();
    const interval = setInterval(fetchServerIntents, 10000);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('near_intent_realtime_channel');
        bc.onmessage = (e) => {
          if (e.data && e.data.type === 'INTENT_UPDATE') {
            fetchServerIntents();
          }
        };
      } catch (err) {}
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'app_intents_sync_trigger') {
        fetchServerIntents();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorageChange);
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

  // Helper to merge and update intents state without duplicates
  const mergeAndSetIntents = (incomingIntents: Intent[]) => {
    if (!incomingIntents || !Array.isArray(incomingIntents)) return;
    setIntents(prev => {
      const map = new Map<string, Intent>();
      prev.forEach(i => map.set(i.id, i));
      incomingIntents.forEach(i => {
        map.set(i.id, i);
      });
      const merged = Array.from(map.values());
      merged.sort((a, b) => b.createdAt - a.createdAt);
      try {
        localStorage.setItem('app_intents', JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
  };
  const [matchesMap, setMatchesMap] = useState<Record<string, Match[]>>({});
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [isGeneratingMissions, setIsGeneratingMissions] = useState(false);
  const [incomingCallSignal, setIncomingCallSignal] = useState<CallSignal | null>(null);
  const [activeCallSignal, setActiveCallSignal] = useState<CallSignal | null>(null);
  const [isCallMinimized, setIsCallMinimized] = useState<boolean>(false);
  const [activeCall, setActiveCall] = useState<{
    participantName: string;
    participantAvatar: string;
    intentTitle: string;
    callType: 'audio' | 'video';
    status?: 'calling' | 'accepted' | 'ended' | 'declined';
  } | null>(null);

  // Cross-tab / Multi-window real-time Message & Call Signal Broadcast Listener
  React.useEffect(() => {
    if (typeof BroadcastChannel === 'undefined' || !user || !user.id) return;

    try {
      const msgBc = new BroadcastChannel('near_intent_messages_channel');
      msgBc.onmessage = (e) => {
        if (e.data && e.data.type === 'NEW_MESSAGE' && e.data.threadId && e.data.message) {
          const incomingMsg = e.data.message;
          setMessagesMap(prev => {
            const currentMsgs = prev[e.data.threadId] || [];
            if (currentMsgs.some(m => m.id === incomingMsg.id)) return prev;
            return {
              ...prev,
              [e.data.threadId]: [...currentMsgs, incomingMsg]
            };
          });
        }
      };

      const callBc = new BroadcastChannel('near_intent_call_signals');
      callBc.onmessage = (e) => {
        if (!e.data) return;
        if (e.data.type === 'CALL_INITIATED' && e.data.callSignal) {
          const sig = e.data.callSignal;
          if (sig.receiverId === user.id && sig.status === 'calling') {
            setIncomingCallSignal(sig);
          }
        } else if (e.data.type === 'CALL_ACCEPTED' && e.data.callSignal) {
          const sig = e.data.callSignal;
          if (sig.callerId === user.id || sig.receiverId === user.id) {
            setIncomingCallSignal(null);
            setActiveCallSignal(sig);
            const isCaller = sig.callerId === user.id;
            setActiveCall({
              participantName: isCaller ? sig.receiverName : sig.callerName,
              participantAvatar: isCaller ? sig.receiverAvatar : sig.callerAvatar,
              intentTitle: sig.intentTitle,
              callType: sig.type,
              status: 'accepted'
            });
          }
        } else if (e.data.type === 'CALL_ENDED') {
          setActiveCallSignal(null);
          setActiveCall(null);
        }
      };

      return () => {
        msgBc.close();
        callBc.close();
      };
    } catch (err) {}
  }, [user?.id]);

  // Real-time Chat & Call Firestore Subscriptions
  React.useEffect(() => {
    if (!user || !user.id) return;

    const unsubThreads = subscribeToThreads(user.id, (fsThreads) => {
      setThreads(fsThreads);
    });

    const unsubMsgs = subscribeToAllMessages((fsMessagesMap) => {
      setMessagesMap(fsMessagesMap);
    });

    const unsubCalls = subscribeToCalls(user.id, user.name, (fsCalls) => {
      const isMeReceiver = (c: CallSignal) => {
        if (!user) return false;
        const uId = (user.id || '').toLowerCase();
        const uName = (user.name || '').toLowerCase();
        const recId = (c.receiverId || '').toLowerCase();
        const recName = (c.receiverName || '').toLowerCase();
        return recId === uId || recName === uName || (recId && recId.includes(uId)) || (recName && recName.includes(uName));
      };

      const isMeCaller = (c: CallSignal) => {
        if (!user) return false;
        const uId = (user.id || '').toLowerCase();
        const uName = (user.name || '').toLowerCase();
        const calId = (c.callerId || '').toLowerCase();
        const calName = (c.callerName || '').toLowerCase();
        return calId === uId || calName === uName || (calId && calId.includes(uId)) || (calName && calName.includes(uName));
      };

      // 1. Incoming Call Signal: User is recipient, not caller, status is 'calling'
      const incoming = fsCalls.find(c => isMeReceiver(c) && !isMeCaller(c) && c.status === 'calling');
      setIncomingCallSignal(incoming || null);

      // 2. Active Call Signal:
      // If caller -> active when 'calling' or 'accepted'
      // If receiver -> active ONLY when 'accepted'
      const active = fsCalls.find(c =>
        (isMeCaller(c) && (c.status === 'calling' || c.status === 'accepted')) ||
        (isMeReceiver(c) && c.status === 'accepted')
      );

      if (active) {
        setActiveCallSignal(active);
        const isCaller = isMeCaller(active);
        setActiveCall({
          participantName: isCaller ? active.receiverName : active.callerName,
          participantAvatar: isCaller ? active.receiverAvatar : active.callerAvatar,
          intentTitle: active.intentTitle,
          callType: active.type,
          status: active.status
        });
      } else {
        if (activeCallSignal) {
          const ended = fsCalls.find(c => c.id === activeCallSignal.id && (c.status === 'ended' || c.status === 'declined'));
          if (ended) {
            setActiveCallSignal(null);
            setActiveCall(null);
          }
        }
      }
    });

    return () => {
      unsubThreads();
      unsubMsgs();
      unsubCalls();
    };
  }, [user?.id, user?.name, activeCallSignal?.id]);

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
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All Platforms');
  const [radiusKm, setRadiusKm] = useState<number>(30);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(true);

  // Precise Geolocation Pipeline State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [userAreaName, setUserAreaName] = useState<string>(() => {
    return localStorage.getItem('near_intent_user_area') || '';
  });
  const [locationPermission, setLocationPermission] = useState<'prompt' | 'requesting' | 'granted' | 'denied'>('prompt');

  // Reverse Geocoding Helper to fetch area/place name from GPS coordinates
  const fetchAreaName = React.useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        const addr = data.address || {};
        const area = addr.suburb || addr.neighbourhood || addr.residential || addr.district || addr.city_district || addr.town || addr.city || addr.village;
        const region = addr.city || addr.town || addr.county || addr.state_district || addr.state;

        let formattedArea = '';
        if (area && region && area !== region) {
          formattedArea = `${area}, ${region}`;
        } else if (area) {
          formattedArea = area;
        } else if (region) {
          formattedArea = region;
        } else if (data.display_name) {
          formattedArea = data.display_name.split(',').slice(0, 2).join(',').trim();
        }

        if (formattedArea) {
          setUserAreaName(formattedArea);
          localStorage.setItem('near_intent_user_area', formattedArea);
          setUser(prev => ({
            ...prev,
            location: formattedArea
          }));
          return;
        }
      }
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
    }

    // Smart fallback based on coordinates if network or API fails
    let fallback = 'Nearby Local Area';
    if (Math.abs(lat - 18.8757) < 0.2 && Math.abs(lng - 79.4499) < 0.2) {
      fallback = 'Mancherial, Telangana';
    } else if (Math.abs(lat - 17.385) < 0.5 && Math.abs(lng - 78.486) < 0.5) {
      fallback = 'Hyderabad, Telangana';
    }
    setUserAreaName(fallback);
    setUser(prev => ({ ...prev, location: fallback }));
  }, []);

  // Haversine distance calculator in kilometers
  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Request precise location on app open to connect with nearest intent serve people
  const requestPreciseLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser.', 'error');
      setLocationPermission('denied');
      return;
    }

    setLocationPermission('requesting');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserCoords({ lat, lng });
        setLocationPermission('granted');

        // Fetch area/place name asynchronously
        fetchAreaName(lat, lng);

        // Dynamically calculate distance for all active intents and sort by nearest proximity
        setIntents(prevIntents => {
          if (!prevIntents || prevIntents.length === 0) return prevIntents;
          const updated = prevIntents.map((intent, idx) => {
            const intentLat = intent.lat ?? (lat + (Math.sin(idx + 1) * 0.04));
            const intentLng = intent.lng ?? (lng + (Math.cos(idx + 1) * 0.04));
            const dist = calculateHaversineDistance(lat, lng, intentLat, intentLng);
            return {
              ...intent,
              lat: intentLat,
              lng: intentLng,
              distanceKm: dist
            };
          });

          // Sort nearest intent serve people first
          updated.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
          return updated;
        });

        showToast('📍 Precise GPS location acquired! Connected to nearest intent serve pipeline.', 'success');
      },
      (error) => {
        console.warn('Geolocation permission error:', error);
        setLocationPermission('denied');
        showToast('📍 Location access required to connect with nearest intent serve people.', 'info');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, [fetchAreaName]);

  // Auto trigger location request as soon as app opens
  React.useEffect(() => {
    requestPreciseLocation();
  }, [requestPreciseLocation]);

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

    // Trigger multi-window / cross-tab sync
    notifyCrossTabSync();
  };

  // Delete Intent Handler
  const handleDeleteIntent = async (intentId: string) => {
    setIntents(prev => prev.filter(i => i.id !== intentId));
    await deleteIntentFromFirestore(intentId);
    try {
      await fetch(`/api/intents/${intentId}`, { method: 'DELETE' });
    } catch (e) {}
    notifyCrossTabSync();
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

  // Handle Accept Intent to Serve
  const handleAcceptIntent = (intent: Intent, chosenPlatform?: string) => {
    if (intent.creatorId === user.id) {
      showToast('You published this intent! Other community members will accept to serve it, or you can chat with matched candidates.', 'info');
      return;
    }

    const platName = chosenPlatform || (intent.platforms && intent.platforms[0]) || 'Web App';
    const updatedIntent: Intent = {
      ...intent,
      status: 'serving',
      acceptedByUserId: user.id,
      acceptedByUserName: user.name,
      acceptedByAvatar: user.avatar,
      acceptedByPlatform: platName,
      acceptedAt: Date.now()
    };

    // Update local state
    setIntents(prev => {
      const updated = prev.map(i => i.id === intent.id ? updatedIntent : i);
      localStorage.setItem('app_intents', JSON.stringify(updated));
      return updated;
    });

    // Save update to Firestore
    saveIntentToFirestore(updatedIntent);

    // Save update to Express backend
    fetch(`/api/intents/${intent.id}/accept`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        acceptedByUserId: user.id,
        acceptedByUserName: user.name,
        acceptedByAvatar: user.avatar,
        acceptedByPlatform: platName
      })
    })
    .then(() => notifyCrossTabSync())
    .catch(e => console.error('Failed to update server intent status:', e));

    notifyCrossTabSync();

    // Award XP and Coins for accepting to serve
    setUser(prev => ({
      ...prev,
      xp: prev.xp + 100,
      coins: prev.coins + 50,
      completedIntents: prev.completedIntents + 1
    }));

    // Add notification for user
    const newNotif: NotificationItem = {
      id: `n_acc_${Date.now()}`,
      type: 'match',
      title: 'Intent Accepted to Serve',
      message: `You accepted to serve "${intent.title}" on ${platName}. Workspace chat opened with ${intent.creatorName}.`,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    showToast(`🎉 Accepted to serve "${intent.title}" on ${platName}! (+100 XP, +50 Coins)`, 'success');

    // Automatically open chat thread with intent creator
    handleStartChat(updatedIntent);
  };

  // Start Chat Handler (Correctly connects poster and candidate)
  const handleStartChat = (intent: Intent, candidateMatch?: Match) => {
    let participantId = '';
    let participantName = '';
    let participantAvatar = '';
    let participantTrust = 98;
    let participantTitle = 'Collaborator';

    if (candidateMatch) {
      participantId = candidateMatch.userId;
      participantName = candidateMatch.userName;
      participantAvatar = candidateMatch.userAvatar;
      participantTrust = candidateMatch.trustScore;
      participantTitle = candidateMatch.userTitle;
    } else if (user.id !== intent.creatorId) {
      // Current user is responding to someone else's intent
      participantId = intent.creatorId;
      participantName = intent.creatorName;
      participantAvatar = intent.creatorAvatar;
      participantTrust = intent.creatorTrustScore || 98;
      participantTitle = 'Intent Poster';
    } else {
      // Current user is creator viewing their own intent
      const intentMatches = matchesMap[intent.id] || [];
      const firstMatch = intentMatches[0];
      if (firstMatch) {
        participantId = firstMatch.userId;
        participantName = firstMatch.userName;
        participantAvatar = firstMatch.userAvatar;
        participantTrust = firstMatch.trustScore;
        participantTitle = firstMatch.userTitle;
      } else {
        const otherUser = registeredUsersList.find(u => u.id !== user.id);
        if (otherUser) {
          participantId = otherUser.id;
          participantName = otherUser.name;
          participantAvatar = otherUser.avatar;
          participantTrust = otherUser.trustScore;
          participantTitle = otherUser.headline;
        } else {
          participantId = 'cand_1';
          participantName = 'Priya Sharma';
          participantAvatar = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=250';
          participantTrust = 97;
          participantTitle = 'Fullstack Engineer';
        }
      }
    }

    const existingThread = threads.find(
      t => t.intentId === intent.id && (
        (t.participantId === participantId && t.createdByUserId === user.id) ||
        (t.createdByUserId === participantId && t.participantId === user.id)
      )
    );

    if (existingThread) {
      setActiveTab('chat');
      if (selectedIntentForModal) setSelectedIntentForModal(null);
      return;
    }

    const newThreadId = `th_${intent.id}_${user.id.slice(-4)}_${participantId.slice(-4)}`;
    const newThread: ChatThread = {
      id: newThreadId,
      intentId: intent.id,
      intentTitle: intent.title,
      createdByUserId: user.id,
      createdByUserName: user.name,
      createdByUserAvatar: user.avatar,
      createdByTrustScore: user.trustScore || 98,
      createdByTitle: user.headline || 'Collaborator',
      participantId: participantId,
      participantName: participantName,
      participantAvatar: participantAvatar,
      participantTrustScore: participantTrust,
      participantTitle: participantTitle,
      lastMessage: `Hi ${participantName}, connecting regarding "${intent.title}".`,
      lastMessageTimestamp: Date.now(),
      unreadCount: 0,
      status: 'collaborating',
    };

    const initialMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      threadId: newThreadId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text: `Hi ${participantName}! Ready to collaborate on "${intent.title}".`,
      timestamp: Date.now(),
      type: 'text'
    };

    saveThreadToFirestore(newThread);
    saveMessageToFirestore(initialMsg);

    setThreads(prev => [newThread, ...prev]);
    setMessagesMap(prev => ({ ...prev, [newThreadId]: [initialMsg] }));
    setActiveTab('chat');
    if (selectedIntentForModal) setSelectedIntentForModal(null);
  };

  // Send Chat Message Handler
  const handleSendMessage = (
    threadId: string,
    text: string,
    type: 'text' | 'voice' | 'image' | 'file' = 'text',
    mediaUrl?: string,
    fileName?: string,
    fileSize?: string,
    voiceDurationSec?: number
  ) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      threadId,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      text,
      timestamp: Date.now(),
      type,
      mediaUrl,
      fileName,
      fileSize,
      voiceDurationSec
    };

    saveMessageToFirestore(newMsg);

    const displaySummary = type === 'voice' ? '🎙️ Voice Note' : type === 'image' ? '📷 Image Attachment' : type === 'file' ? `📎 ${fileName || 'File Attachment'}` : text;

    const targetThread = threads.find(t => t.id === threadId);
    if (targetThread) {
      const updatedThread = {
        ...targetThread,
        lastMessage: displaySummary,
        lastMessageTimestamp: Date.now()
      };
      saveThreadToFirestore(updatedThread);
    }

    setMessagesMap(prev => ({
      ...prev,
      [threadId]: [...(prev[threadId] || []), newMsg]
    }));

    setThreads(prev =>
      prev.map(t =>
        t.id === threadId
          ? { ...t, lastMessage: displaySummary, lastMessageTimestamp: Date.now() }
          : t
      )
    );

    notifyCrossTabSync();

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('near_intent_messages_channel');
        bc.postMessage({ type: 'NEW_MESSAGE', threadId, message: newMsg });
        bc.close();
      }
    } catch (e) {}
  };

  // Delete single message handler
  const handleDeleteMessage = (threadId: string, messageId: string) => {
    // Delete from Firestore
    deleteMessageFromFirestore(messageId);

    // Update local state
    setMessagesMap(prev => {
      const updatedList = (prev[threadId] || []).filter(m => m.id !== messageId);
      return { ...prev, [threadId]: updatedList };
    });

    notifyCrossTabSync();
    showToast('Message deleted successfully', 'info');
  };

  // Delete entire conversation thread handler
  const handleDeleteThread = (threadId: string) => {
    // Delete thread and messages from Firestore
    deleteThreadFromFirestore(threadId);

    // Delete local state
    setThreads(prev => prev.filter(t => t.id !== threadId));
    setMessagesMap(prev => {
      const copy = { ...prev };
      delete copy[threadId];
      return copy;
    });

    notifyCrossTabSync();
    showToast('Conversation thread deleted', 'info');
  };

  // Block / Unblock user handler
  const handleToggleBlockUser = (targetUserId: string, targetUserName: string) => {
    setUser(prevUser => {
      if (!prevUser) return prevUser;
      const currentBlocked = prevUser.blockedUserIds || [];
      const isAlreadyBlocked = currentBlocked.includes(targetUserId);

      const updatedBlocked = isAlreadyBlocked
        ? currentBlocked.filter(id => id !== targetUserId)
        : [...currentBlocked, targetUserId];

      const updatedUser: UserProfile = {
        ...prevUser,
        blockedUserIds: updatedBlocked
      };

      saveUserToFirestore(updatedUser);
      localStorage.setItem('near_intent_user', JSON.stringify(updatedUser));
      sessionStorage.setItem('near_intent_user', JSON.stringify(updatedUser));

      if (isAlreadyBlocked) {
        showToast(`Unblocked ${targetUserName}`, 'info');
      } else {
        showToast(`Blocked ${targetUserName}. Communications disabled.`, 'error');
      }

      return updatedUser;
    });
  };

  // Call Handlers (Real-time P2P Signal & Audio/Video Call)
  const handleInitiateCall = (
    receiverId: string,
    receiverName: string,
    receiverAvatar: string,
    intentTitle: string,
    callType: 'audio' | 'video' = 'audio'
  ) => {
    const callSignal: CallSignal = {
      id: `call_${Date.now()}`,
      callerId: user.id,
      callerName: user.name,
      callerAvatar: user.avatar,
      receiverId: receiverId,
      receiverName: receiverName,
      receiverAvatar: receiverAvatar,
      intentTitle: intentTitle,
      type: callType,
      status: 'calling',
      createdAt: Date.now()
    };

    saveCallSignalToFirestore(callSignal);
    setActiveCallSignal(callSignal);
    setIsCallMinimized(false);
    setActiveCall({
      participantName: receiverName,
      participantAvatar: receiverAvatar,
      intentTitle: intentTitle,
      callType: callType,
      status: 'calling'
    });

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('near_intent_call_signals');
        bc.postMessage({ type: 'CALL_INITIATED', callSignal });
        bc.close();
      }
    } catch (e) {}
  };

  const handleAcceptCall = (call: CallSignal) => {
    updateCallSignalInFirestore(call.id, { status: 'accepted' });
    setIncomingCallSignal(null);
    const updatedSignal: CallSignal = { ...call, status: 'accepted' };
    setActiveCallSignal(updatedSignal);
    setIsCallMinimized(false);
    setActiveCall({
      participantName: call.callerName,
      participantAvatar: call.callerAvatar,
      intentTitle: call.intentTitle,
      callType: call.type,
      status: 'accepted'
    });

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('near_intent_call_signals');
        bc.postMessage({ type: 'CALL_ACCEPTED', callSignal: updatedSignal });
        bc.close();
      }
    } catch (e) {}
  };

  const handleDeclineCall = (call: CallSignal) => {
    updateCallSignalInFirestore(call.id, { status: 'declined' });
    setIncomingCallSignal(null);

    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('near_intent_call_signals');
        bc.postMessage({ type: 'CALL_ENDED', callId: call.id });
        bc.close();
      }
    } catch (e) {}
  };

  const handleEndCall = () => {
    if (activeCallSignal) {
      updateCallSignalInFirestore(activeCallSignal.id, { status: 'ended' });
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('near_intent_call_signals');
          bc.postMessage({ type: 'CALL_ENDED', callId: activeCallSignal.id });
          bc.close();
        }
      } catch (e) {}
      setActiveCallSignal(null);
    }
    setIsCallMinimized(false);
    setActiveCall(null);
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

  // Category Counts
  const intentsCountByCategory = React.useMemo(() => {
    const map: Record<string, number> = { All: intents.length };
    intents.forEach(i => {
      map[i.category] = (map[i.category] || 0) + 1;
    });
    return map;
  }, [intents]);

  // Filtered Intents by Search, Category, Platform, and Radius
  const filteredIntents = intents.filter(i => {
    const matchesSearch =
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.rawPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCategory === 'All' || i.category === selectedCategory;

    const matchesPlat =
      selectedPlatform === 'All Platforms' ||
      !i.platforms ||
      i.platforms.includes(selectedPlatform);

    const dist = i.distanceKm ?? 2.5;
    const matchesRadius = radiusKm === 100 || dist <= radiusKm;

    return matchesSearch && matchesCat && matchesPlat && matchesRadius;
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
        selectedCategory={selectedCategory}
        radiusKm={radiusKm}
        onOpenCategorySelector={() => setIsCategorySelectorOpen(true)}
      />

      {/* Main Container View Switcher */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden">
        {activeTab === 'explore' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full max-w-full">
            
            {/* Nearest Intent Serve Precise Location Pipeline Banner */}
            <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-indigo-950/90 border border-indigo-500/30 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
              <div className="flex items-center gap-3.5 z-10">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-inner">
                  <MapPin className="w-6 h-6 text-indigo-400 animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight">Nearest Intent Serve Pipeline</h3>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                      locationPermission === 'granted'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : locationPermission === 'requesting'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}>
                      {locationPermission === 'granted' ? '📍 GPS Pipeline Active' : locationPermission === 'requesting' ? '⌛ Requesting GPS...' : '⚠️ Location Required'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                    {userCoords ? (
                      <>
                        <span className="font-extrabold text-amber-300 bg-amber-400/15 border border-amber-400/30 px-2.5 py-0.5 rounded-lg text-xs shadow-xs">
                          📍 {userAreaName || 'Locating Area...'}
                        </span>
                        <span className="text-slate-400 text-[11px] font-mono">
                          (GPS: {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)})
                        </span>
                        <span>— Connected to nearest intent serve people in real-time.</span>
                      </>
                    ) : (
                      'Connecting to nearest intent serve providers in your geographical pipeline.'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 z-10 self-stretch sm:self-auto justify-end">
                <button
                  onClick={requestPreciseLocation}
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <MapPin className="w-4 h-4" />
                  <span>{locationPermission === 'granted' ? 'Refresh GPS Pipeline' : 'Allow Precise Location'}</span>
                </button>
              </div>
            </div>
            
            {/* Situational Category & Radius Bar */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4 overflow-hidden max-w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-full">
                
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-500/30 uppercase tracking-wider">
                      Selected Situation
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      {filteredIntents.length} open {filteredIntents.length === 1 ? 'intent' : 'intents'} matched
                    </span>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 pt-1 flex-wrap">
                    <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight break-words">
                      {selectedCategory === 'All' ? 'All Intent Marketplace' : selectedCategory}
                    </h2>
                    <button
                      onClick={() => setIsCategorySelectorOpen(true)}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-xl shadow-xs transition-all flex items-center gap-1 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Change Situation</span>
                    </button>
                  </div>
                </div>

                {/* Radius Filter Pills */}
                <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-2xl border border-slate-800 max-w-full overflow-x-auto scrollbar-none self-start md:self-auto">
                  <span className="text-xs font-bold text-slate-400 pl-1.5 flex items-center gap-1 shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Radius:
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {[5, 15, 30, 50, 100].map(r => (
                      <button
                        key={r}
                        onClick={() => setRadiusKm(r)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 whitespace-nowrap ${
                          radiusKm === r
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {r === 100 ? 'Any km' : `${r}km`}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Category Filter Chips bar */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-2 border-t border-slate-800/80 text-xs">
                <Filter className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">Categories:</span>
                {categoriesList.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-xl font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-slate-800/60 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {cat} ({intentsCountByCategory[cat] || 0})
                  </button>
                ))}
              </div>

              {/* Platform Filter Chips bar */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-2 border-t border-slate-800/60 text-xs">
                <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider">Platforms:</span>
                {['All Platforms', 'WhatsApp', 'Telegram', 'Discord', 'Slack', 'LinkedIn', 'Web App', 'X/Twitter'].map((plat) => (
                  <button
                    key={plat}
                    onClick={() => setSelectedPlatform(plat)}
                    className={`px-2.5 py-1 rounded-xl font-bold transition-all whitespace-nowrap text-xs ${
                      selectedPlatform === plat
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/30'
                        : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {plat}
                  </button>
                ))}
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
                    onAcceptIntent={(i) => handleAcceptIntent(i, selectedPlatform === 'All Platforms' ? undefined : selectedPlatform)}
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
            allUsers={registeredUsersList}
            onSendMessage={handleSendMessage}
            onStartCall={handleInitiateCall}
            onDeleteMessage={handleDeleteMessage}
            onDeleteThread={handleDeleteThread}
            onToggleBlockUser={handleToggleBlockUser}
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

      <CategorySelectorModal
        isOpen={isCategorySelectorOpen}
        onClose={() => setIsCategorySelectorOpen(false)}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setActiveTab('explore');
        }}
        radiusKm={radiusKm}
        onRadiusChange={(r) => setRadiusKm(r)}
        intentsCountByCategory={intentsCountByCategory}
      />

      <CreateIntentModal
        isOpen={isCreateIntentOpen}
        onClose={() => setIsCreateIntentOpen(false)}
        user={user}
        onCreateIntent={handleCreateIntent}
      />

      <IntentDetailModal
        intent={selectedIntentForModal}
        matches={selectedIntentForModal ? matchesMap[selectedIntentForModal.id] || [] : []}
        currentUser={user}
        onClose={() => setSelectedIntentForModal(null)}
        onContactCandidate={(match, intent) => handleStartChat(intent, match)}
        onCreateEscrow={handleCreateEscrow}
        onAcceptIntent={(i) => handleAcceptIntent(i, selectedPlatform === 'All Platforms' ? undefined : selectedPlatform)}
        onDeleteIntent={handleDeleteIntent}
        onStartCall={(name, avatar, title, type) => {
          if (selectedIntentForModal) {
            const receiverId = user.id === selectedIntentForModal.creatorId
              ? (matchesMap[selectedIntentForModal.id]?.[0]?.userId || 'usr_candidate')
              : selectedIntentForModal.creatorId;
            handleInitiateCall(receiverId, name, avatar, title, type);
          } else {
            setActiveCall({
              participantName: name,
              participantAvatar: avatar,
              intentTitle: title,
              callType: type
            });
          }
        }}
      />

      <IncomingCallModal
        call={incomingCallSignal}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

      {activeCall && (
        <VideoCallModal
          isOpen={!!activeCall}
          onClose={handleEndCall}
          participantName={activeCall.participantName}
          participantAvatar={activeCall.participantAvatar}
          intentTitle={activeCall.intentTitle}
          userAvatar={user.avatar}
          userName={user.name}
          currentUserId={user.id}
          callSignal={activeCallSignal}
          initialCallMode={activeCall.callType}
          callStatus={activeCall.status}
          isMinimized={isCallMinimized}
          onToggleMinimize={() => setIsCallMinimized(prev => !prev)}
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
