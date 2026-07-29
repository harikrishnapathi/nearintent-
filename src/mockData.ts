import { UserProfile, Intent, Match, ChatThread, ChatMessage, Mission, LeaderboardItem, EscrowContract, NotificationItem, RedeemItem } from './types';

export const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" rx="40" fill="%23EEF2FF"/><path d="M100 100C119.33 100 135 84.33 135 65C135 45.67 119.33 30 100 30C80.67 30 65 45.67 65 65C65 84.33 80.67 100 100 100ZM100 115C76.67 115 30 126.67 30 150V165H170V150C170 126.67 123.33 115 100 115Z" fill="%236366F1"/><circle cx="145" cy="145" r="22" fill="%234F46E5"/><path d="M140 145H150M145 140V150" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`;

export const currentUser: UserProfile = {
  id: 'usr_me',
  name: 'Account Holder',
  avatar: DEFAULT_AVATAR,
  headline: 'Community Member',
  bio: 'Welcome to Near Intent! Upload your profile photo and describe your skills to start collaborating.',
  trustScore: 0,
  karmaPoints: 0,
  coins: 0,
  xp: 0,
  levelName: 'New Member',
  levelNumber: 1,
  responseTime: 'N/A',
  completedIntents: 0,
  successRate: 100,
  location: 'San Francisco, CA',
  languages: ['English'],
  skills: ['Community', 'Collaboration'],
  experience: [],
  portfolio: [],
  badges: [],
  verificationStatus: {
    identity: false,
    phone: false,
    skillVerified: false
  },
  noShowPenalties: 0,
  cancellationPenalties: 0,
  streakDays: 0
};

export const initialIntents: Intent[] = [];

export const sampleMatches: Record<string, Match[]> = {};

export const initialChatThreads: ChatThread[] = [];

export const initialMessages: Record<string, ChatMessage[]> = {};

export const initialMissions: Mission[] = [
  {
    id: 'mis_1',
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
    id: 'mis_2',
    title: 'Complete Profile Verification',
    description: 'Verify phone SMS or identity check to achieve a 98% trust rating.',
    category: 'Trust & Safety',
    targetCount: 1,
    currentProgress: 0,
    rewardXp: 100,
    rewardCoins: 50,
    completed: false,
    claimed: false
  },
  {
    id: 'mis_3',
    title: 'Discover AI Candidates',
    description: 'Run the Gemini AI matchmaker on your published intent.',
    category: 'AI Matching',
    targetCount: 1,
    currentProgress: 0,
    rewardXp: 80,
    rewardCoins: 40,
    completed: false,
    claimed: false
  }
];

export const sampleLeaderboard: LeaderboardItem[] = [];

export const initialEscrows: EscrowContract[] = [];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_welcome',
    type: 'recommendation',
    title: '🚀 Near Intent Platform is Live!',
    message: 'Welcome! Create your verified account, publish your real intents, or invite real community members to match.',
    timestamp: Date.now(),
    read: false
  }
];

export const redeemStoreItems: RedeemItem[] = [
  {
    id: 'r_1',
    title: '1,000 AI Agent Credits',
    description: 'Power deep matching, automated intent refinement, and instant candidate outreach.',
    coinCost: 200,
    category: 'AI Credits',
    icon: 'Cpu',
    badgeTag: 'Popular'
  },
  {
    id: 'r_2',
    title: 'Instant Intent Boost (24 Hours)',
    description: 'Pin your active intent to top candidate feeds with 5x higher AI match visibility.',
    coinCost: 150,
    category: 'Boost',
    icon: 'Zap',
    badgeTag: '5x Reach'
  },
  {
    id: 'r_3',
    title: 'Near Intent Pro Membership (1 Month)',
    description: 'Unlock unlimited video calls, automated scheduling, and priority escrow protection.',
    coinCost: 500,
    category: 'Membership',
    icon: 'Crown',
    badgeTag: 'Pro'
  },
  {
    id: 'r_4',
    title: 'Verified Skill Endorsement Badge',
    description: 'Get AI-verified proof of expertise displayed permanently on your trust profile.',
    coinCost: 350,
    category: 'Promotion',
    icon: 'ShieldCheck',
    badgeTag: 'Trust'
  }
];
