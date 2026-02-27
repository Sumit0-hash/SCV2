import { GoogleGenerativeAI } from "@google/generative-ai";

export interface CareerRoadmapResponse {
  skill_gap_analysis: {
    matched_skills: string[];
    missing_skills: string[];
  };
  learning_roadmap: Array<{
    skill: string;
    why_needed: string;
    resources: string[];
    practice_projects: string[];
  }>;
  recommended_projects: string[];
  certifications: string[];
  timeline_plan: {
    "1_3_months": string[];
    "3_6_months": string[];
    "6_plus_months": string[];
  };
  overall_readiness_score: string;
}

const modelOutputSchema = `{
  "skill_gap_analysis": {
    "matched_skills": [""],
    "missing_skills": [""]
  },
  "learning_roadmap": [
    {
      "skill": "",
      "why_needed": "",
      "resources": [""],
      "practice_projects": [""]
    }
  ],
  "recommended_projects": [""],
  "certifications": [""],
  "timeline_plan": {
    "1_3_months": [""],
    "3_6_months": [""],
    "6_plus_months": [""]
  },
  "overall_readiness_score": ""
}`;

const toStringList = (input: unknown): string[] =>
  Array.isArray(input) ? input.map((item) => String(item).trim()).filter(Boolean) : [];

const normalizeRoadmapResponse = (data: any): CareerRoadmapResponse => ({
  skill_gap_analysis: {
    matched_skills: toStringList(data?.skill_gap_analysis?.matched_skills),
    missing_skills: toStringList(data?.skill_gap_analysis?.missing_skills),
  },
  learning_roadmap: Array.isArray(data?.learning_roadmap)
    ? data.learning_roadmap.map((item: any) => ({
        skill: String(item?.skill ?? "").trim(),
        why_needed: String(item?.why_needed ?? "").trim(),
        resources: toStringList(item?.resources),
        practice_projects: toStringList(item?.practice_projects),
      }))
    : [],
  recommended_projects: toStringList(data?.recommended_projects),
  certifications: toStringList(data?.certifications),
  timeline_plan: {
    "1_3_months": toStringList(data?.timeline_plan?.["1_3_months"]),
    "3_6_months": toStringList(data?.timeline_plan?.["3_6_months"]),
    "6_plus_months": toStringList(data?.timeline_plan?.["6_plus_months"]),
  },
  overall_readiness_score: String(data?.overall_readiness_score ?? "0").trim(),
});

const safeJsonParse = (rawText: string) => {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
};

export async function generateCareerRoadmap(parsedResumeData: unknown, targetRole: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const prompt = `You are an expert AI career mentor.
Generate a personalized career improvement roadmap for this target role: "${targetRole}".

Resume analysis data (already parsed):
${JSON.stringify(parsedResumeData, null, 2)}

Return STRICT valid JSON matching exactly this schema:
${modelOutputSchema}

Rules:
- Return only JSON, with no markdown.
- Keep output concise and practical.
- Readiness score should be a percentage string like "78%".
- Ensure timeline keys are exactly 1_3_months, 3_6_months, and 6_plus_months.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();

  const parsed = safeJsonParse(text);
  if (!parsed) {
    throw new Error("Gemini returned non-JSON content.");
  }

  return normalizeRoadmapResponse(parsed);
}