import UserProfile from "../models/UserProfile.js";

const AGENT_URL = process.env.AGENT_URL;

async function callAgent(path, payload) {
  if (!AGENT_URL) {
    return { error: "AGENT_URL not configured" };
  }

  const res = await fetch(`${AGENT_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) {
    const text = await res.text();
    return { error: `Agent error (${res.status}): ${text.slice(0, 200)}` };
  }

  return res.json();
}

export async function attemptAutomatedApplication(url, userId) {
  console.log(`[BROWSER → Agent] Full application attempt: ${url}`);

  if (!url) return { success: false, error: "No URL provided", missingDocs: [] };

  const userProfile = userId
    ? await UserProfile.findOne({ userId }).lean()
    : null;

  const result = await callAgent("/apply", {
    url,
    userProfile: JSON.stringify(
      userProfile
        ? {
            fullName: userProfile.fullName || "",
            nationality: userProfile.nationality || "",
            email: userProfile.email || "",
            highestDegree: userProfile.highestDegree || "",
            fieldOfStudy: userProfile.fieldOfStudy || "",
            gpa: userProfile.gpa || "",
            targetCountries: userProfile.targetCountries || [],
            languageProficiency: userProfile.languageProficiency || "",
          }
        : {}
    ),
  });

  if (result.error) {
    return { success: false, error: result.error, missingDocs: [] };
  }

  return {
    success: result.canApply === true,
    url,
    pageTitle: result.pageTitle || "",
    missingDocs: result.missingDocs || [],
    instructions: result.instructions || "",
    prefilledData: result.prefilledData || {},
    applicationFields: result.applicationFields || [],
    scholarshipName: result.scholarshipName || "",
    provider: result.provider || "",
  };
}
