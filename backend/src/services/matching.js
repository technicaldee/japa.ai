import Scholarship from "../models/Scholarship.js";
import UserProfile from "../models/UserProfile.js";
import { isMongoConnected } from "../config/mongodb.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

function buildProfileContext(profile) {
  if (!profile) return "No profile data available.";
  return [
    `Nationality: ${profile.nationality || "N/A"}`,
    `Age Range: ${profile.ageRange || "N/A"}`,
    `Highest Degree: ${profile.highestDegree || "N/A"}`,
    `Field of Study: ${profile.fieldOfStudy || "N/A"}`,
    `GPA: ${profile.gpa || "N/A"}`,
    `Years of Experience: ${profile.yearsOfExperience || "N/A"}`,
    `Target Countries: ${(profile.targetCountries || []).join(", ") || "N/A"}`,
    `Budget: ${profile.budget || "N/A"}`,
    `Timeline: ${profile.timeline || "N/A"}`,
    `Language Proficiency: ${profile.languageProficiency || "N/A"}`,
  ].join("\n");
}

export async function matchScholarships(userId) {
  if (!isMongoConnected()) {
    throw new Error("MongoDB not connected");
  }

  const userProfile = await UserProfile.findOne({ userId });
  if (!userProfile) {
    throw new Error("User profile not found. Complete your profile first.");
  }

  const allScholarships = await Scholarship.find({ status: "approved" })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (allScholarships.length === 0) {
    return { matches: [], applications: [], message: "No scholarships available in the database." };
  }

  const context = buildProfileContext(userProfile);
  const scholarshipsJson = JSON.stringify(
    allScholarships.map((s) => ({
      id: s._id.toString(),
      title: s.title,
      provider: s.provider,
      funding: s.funding,
      deadline: s.deadline,
      location: s.location,
      degreeLevel: s.degreeLevel,
      eligibility: s.eligibility,
      url: s.url,
    }))
  );

  const prompt = `You are JAPA, an AI scholarship agent that matches students to scholarships.

USER PROFILE:
${context}

AVAILABLE SCHOLARSHIPS (${allScholarships.length} total):
${scholarshipsJson}

TASK:
1. Analyze the user's profile and find the best matching scholarships.
2. For each match, assign a score (0-100) based on how well it fits the user's field of study, target countries, degree level, budget, and timeline.
3. Return ONLY a valid JSON array of matches, sorted by score descending. No other text.

Format:
[
  {
    "id": "scholarship_mongodb_id",
    "score": 85,
    "reason": "Brief explanation of why this is a good match"
  }
]

Return ONLY the JSON array, nothing else.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[MATCHING] Gemini API error:", errText);
      return fallbackMatch(allScholarships, userProfile);
    }

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let matches;
    try {
      const cleaned = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      matches = JSON.parse(cleaned);
    } catch {
      console.warn("[MATCHING] Failed to parse Gemini response, using fallback");
      return fallbackMatch(allScholarships, userProfile);
    }

    if (!Array.isArray(matches) || matches.length === 0) {
      return fallbackMatch(allScholarships, userProfile);
    }

    const scholarshipMap = {};
    for (const s of allScholarships) {
      scholarshipMap[s._id.toString()] = s;
    }

    const validMatches = matches
      .filter((m) => scholarshipMap[m.id])
      .slice(0, 10)
      .map((m) => {
        const s = scholarshipMap[m.id];
        return { ...s, matchScore: m.score, matchReason: m.reason };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return { matches: validMatches, allScholarships };
  } catch (err) {
    console.error("[MATCHING] Error:", err);
    return fallbackMatch(allScholarships, userProfile);
  }
}

function fallbackMatch(allScholarships, userProfile) {
  const targetCountries = (userProfile.targetCountries || []).map((c) => c.toLowerCase());
  const fieldOfStudy = (userProfile.fieldOfStudy || "").toLowerCase();
  const degreeLevel = (userProfile.highestDegree || "").toLowerCase();

  const scored = allScholarships.map((s) => {
    let score = 50;
    const loc = (s.location || "").toLowerCase();
    const desc = (s.description || "").toLowerCase();
    const deg = (s.degreeLevel || "").toLowerCase();

    if (targetCountries.some((c) => loc.includes(c))) score += 20;
    if (fieldOfStudy && (desc.includes(fieldOfStudy) || (s.tags || []).some((t) => t.toLowerCase().includes(fieldOfStudy)))) score += 15;
    if (degreeLevel && deg.includes(degreeLevel)) score += 15;

    return { ...s, matchScore: Math.min(score, 100), matchReason: "Keyword-based match" };
  });

  scored.sort((a, b) => b.matchScore - a.matchScore);

  return {
    matches: scored.slice(0, 10),
    allScholarships,
  };
}
