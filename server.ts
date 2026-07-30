import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// In-memory data store for persistent real users & intents across sessions
let registeredUsers: any[] = [];
let registeredIntents: any[] = [];

// API Route: Get all active intents
app.get("/api/intents", (_req, res) => {
  res.json({ success: true, intents: registeredIntents });
});

// API Route: Publish new intent
app.post("/api/intents", (req, res) => {
  try {
    const { intent } = req.body;
    if (!intent || !intent.title) {
      return res.status(400).json({ error: "Invalid intent data" });
    }
    registeredIntents.unshift(intent);
    res.json({ success: true, intent });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save intent" });
  }
});

// API Route: Accept intent to serve
app.put("/api/intents/:id/accept", (req, res) => {
  try {
    const { id } = req.params;
    const { acceptedByUserId, acceptedByUserName, acceptedByAvatar, acceptedByPlatform } = req.body;
    const index = registeredIntents.findIndex(i => i.id === id);
    if (index !== -1) {
      registeredIntents[index] = {
        ...registeredIntents[index],
        status: 'serving',
        acceptedByUserId,
        acceptedByUserName,
        acceptedByAvatar,
        acceptedByPlatform,
        acceptedAt: Date.now()
      };
      return res.json({ success: true, intent: registeredIntents[index] });
    }
    return res.status(404).json({ error: "Intent not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to accept intent" });
  }
});

// API Route: Delete intent
app.delete("/api/intents/:id", (req, res) => {
  try {
    const { id } = req.params;
    registeredIntents = registeredIntents.filter(i => i.id !== id);
    res.json({ success: true, message: "Intent deleted" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete intent" });
  }
});

// API Route: Get all registered users
app.get("/api/users", (_req, res) => {
  res.json({ success: true, users: registeredUsers });
});

// API Route: Update user profile
app.put("/api/users/:id", (req, res) => {
  try {
    const { id } = req.params;
    const index = registeredUsers.findIndex(u => u.id === id);
    if (index !== -1) {
      registeredUsers[index] = { ...registeredUsers[index], ...req.body };
      return res.json({ success: true, user: registeredUsers[index] });
    }
    return res.status(404).json({ error: "User not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to update user" });
  }
});

// API Route: Delete user account
app.delete("/api/users/:id", (req, res) => {
  try {
    const { id } = req.params;
    const initialLen = registeredUsers.length;
    registeredUsers = registeredUsers.filter(u => u.id !== id);
    if (registeredUsers.length < initialLen) {
      return res.json({ success: true, message: `User ${id} permanently deleted` });
    }
    return res.status(404).json({ error: "User not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to delete user" });
  }
});

// API Route: Register new user account with verified status
app.post("/api/users/register", (req, res) => {
  try {
    const { name, headline, bio, location, skills, avatar, phoneNumber, governmentId, phoneVerified, identityVerified, skillVerified } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Missing required user name" });
    }

    // Check for duplicate phone number
    if (phoneNumber && phoneNumber.trim()) {
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      if (cleanPhone.length >= 5) {
        const existingPhoneUser = registeredUsers.find(u => u.phoneNumber && u.phoneNumber.replace(/\D/g, "") === cleanPhone);
        if (existingPhoneUser) {
          return res.status(400).json({ error: `An account already exists with phone number ${phoneNumber}. One person cannot create multiple accounts with the same phone number.` });
        }
      }
    }

    // Check for duplicate government ID
    if (governmentId && governmentId.trim()) {
      const cleanGovId = governmentId.trim().toUpperCase();
      const existingGovUser = registeredUsers.find(u => u.governmentId && u.governmentId.trim().toUpperCase() === cleanGovId);
      if (existingGovUser) {
        return res.status(400).json({ error: `An account already exists with Government ID ${governmentId}. One person cannot create multiple accounts with the same Government ID.` });
      }
    }

    const newUser = {
      id: `u_${Date.now()}`,
      name,
      avatar: avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=250',
      headline: headline || 'Community Contributor',
      bio: bio || 'Ready to collaborate on Near Intent.',
      phoneNumber: phoneNumber || undefined,
      governmentId: governmentId || undefined,
      trustScore: (identityVerified || phoneVerified) ? 98 : 85,
      karmaPoints: 100,
      coins: 100,
      xp: 500,
      levelName: 'Explorer',
      levelNumber: 1,
      responseTime: '< 15 mins',
      completedIntents: 0,
      successRate: 100,
      location: location || 'San Francisco, CA',
      languages: ['English'],
      skills: Array.isArray(skills) && skills.length > 0 ? skills : ['General'],
      experience: [],
      portfolio: [],
      badges: [
        { id: `b_${Date.now()}`, name: 'Verified Member', iconName: 'ShieldCheck', description: 'Passed real identity & phone checks', color: 'emerald', earnedAt: 'Just Now' }
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

    registeredUsers.push(newUser);
    res.json({ success: true, user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to register user" });
  }
});

// API Route: Real AI Matching Engine for Registered Users
app.post("/api/ai/match", async (req, res) => {
  try {
    const { intent } = req.body;
    if (!intent) {
      return res.status(400).json({ error: "Missing intent data" });
    }

    if (registeredUsers.length === 0) {
      return res.json({
        success: true,
        aiMatches: [],
        message: "No registered candidates on the platform yet. Invite users to register!"
      });
    }

    const candidatesForPrompt = registeredUsers.map(u => ({
      id: u.id,
      name: u.name,
      headline: u.headline,
      skills: u.skills,
      location: u.location,
      trustScore: u.trustScore,
      verificationStatus: u.verificationStatus
    }));

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are Near Intent AI Matchmaker.
Match this intent against registered platform users.

Intent:
Title: "${intent.title}"
Category: "${intent.category}"
Skills Needed: ${JSON.stringify(intent.skills)}
Location: "${intent.location}"

Registered Users Pool:
${JSON.stringify(candidatesForPrompt)}

Evaluate each user for compatibility (0-100%). Return JSON array of matches.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              userId: { type: Type.STRING },
              matchPercentage: { type: Type.NUMBER },
              skillsScore: { type: Type.NUMBER },
              proximityScore: { type: Type.NUMBER },
              trustScore: { type: Type.NUMBER },
              aiReasoning: { type: Type.STRING }
            },
            required: ["userId", "matchPercentage", "skillsScore", "proximityScore", "trustScore", "aiReasoning"]
          }
        }
      }
    });

    const aiMatches = JSON.parse(response.text || "[]");
    res.json({ success: true, aiMatches });
  } catch (error: any) {
    console.error("Error in /api/ai/match:", error);
    res.status(500).json({ error: error.message || "Matchmaker failed" });
  }
});

// API Route: Healthcheck
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Near Intent AI Engine" });
});

let storedIntents: any[] = [];

app.get("/api/intents", (_req, res) => {
  res.json({ success: true, intents: storedIntents });
});

app.post("/api/intents", (req, res) => {
  const { intent } = req.body;
  if (intent) {
    storedIntents = [intent, ...storedIntents.filter(i => i.id !== intent.id)];
  }
  res.json({ success: true, intents: storedIntents });
});

app.delete("/api/intents/:id", (req, res) => {
  const { id } = req.params;
  storedIntents = storedIntents.filter(i => i.id !== id);
  res.json({ success: true });
});

// API Route 1: AI Natural Language Intent Extraction
app.post("/api/ai/parse-intent", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing or invalid prompt string" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `You are the AI Intent Operating System parser for Near Intent.
Given a natural language statement describing what a person wants to accomplish, extract structured information.

Input Prompt: "${prompt}"

Rules:
- Extract a concise, compelling Title.
- Categorize into one of: 'Startup/Tech', 'Sports/Fitness', 'Emergency/Health', 'Services/Trades', 'Co-founder/Networking', 'Creative/Freelance', 'Community/Help'.
- Extract required skills/attributes array.
- Extract location or proximity preference (e.g., 'San Francisco, CA', 'Downtown', 'Remote', 'Near me').
- Extract availability (e.g. 'Tonight', 'This Weekend', 'Immediate', '30 hrs/week').
- Budget or compensation if mentioned (or null).
- Urgency: 'Immediate' (blood donor/emergency), 'Urgent' (today/tonight), 'High' (this weekend), or 'Normal'.
- DurationHours: number of hours before intent expires (e.g., Immediate blood = 4, Sports tonight = 12, Weekend startup = 48, Co-founder = 168).
- AI Suggested Keywords for quick searching.
`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            location: { type: Type.STRING },
            availability: { type: Type.STRING },
            budget: { type: Type.STRING },
            urgency: { type: Type.STRING },
            durationHours: { type: Type.NUMBER },
            aiSuggestedKeywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "category", "skills", "location", "availability", "urgency", "durationHours"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Error in /api/ai/parse-intent:", error);
    res.status(500).json({ error: error.message || "Failed to parse intent with AI" });
  }
});

// API Route 2: AI Intent Copilot & Assistant Answers
app.post("/api/ai/copilot", async (req, res) => {
  try {
    const { action, userPrompt, intentContext, candidateContext } = req.body;

    let systemInstruction = "You are Near Intent Copilot, an AI assistant powering human collaboration.";
    let contents = userPrompt || "";

    if (action === "refine_wording") {
      contents = `Improve this intent description to make it highly clear, attractive to top matches, and specific:
Current Title: "${intentContext?.title}"
Original Prompt: "${intentContext?.rawPrompt}"
Provide a suggested improved title, refined description, and 3 key matching tips.`;
    } else if (action === "generate_outreach") {
      contents = `Generate a personalized, warm, professional first outreach message from user Alex Rivera to candidate ${candidateContext?.userName} regarding intent "${intentContext?.title}". Candidate skills: ${candidateContext?.skills?.join(", ")}, trust score: ${candidateContext?.trustScore}%.`;
    } else if (action === "rank_candidates") {
      contents = `Rank these candidates for intent "${intentContext?.title}" and explain who to contact first: ${JSON.stringify(candidateContext)}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction
      }
    });

    res.json({ success: true, reply: response.text });
  } catch (error: any) {
    console.error("Error in /api/ai/copilot:", error);
    res.status(500).json({ error: error.message || "Copilot generation failed" });
  }
});

// API Route 3: Dynamic AI Daily Missions
app.post("/api/ai/generate-missions", async (req, res) => {
  try {
    const { userSkills, userLocation } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: `Generate 3 personalized daily missions for user located in ${userLocation || 'San Francisco'} with skills ${userSkills?.join(', ') || 'Tech, AI, Sports'}.
Rules:
- Make missions engaging, helpful to the community, and achievable within 24 hours.
- Return JSON array of objects.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              category: { type: Type.STRING },
              targetCount: { type: Type.NUMBER },
              rewardXp: { type: Type.NUMBER },
              rewardCoins: { type: Type.NUMBER }
            },
            required: ["id", "title", "description", "category", "targetCount", "rewardXp", "rewardCoins"]
          }
        }
      }
    });

    const missions = JSON.parse(response.text || "[]");
    res.json({ success: true, missions });
  } catch (error: any) {
    console.error("Error in /api/ai/generate-missions:", error);
    res.status(500).json({ error: error.message || "Mission generation failed" });
  }
});

// Start Server with Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Near Intent AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
