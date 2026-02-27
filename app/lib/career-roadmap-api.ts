import type { CareerRoadmap } from "~/types/roadmap";

export async function requestCareerRoadmap(payload: {
  parsedResumeData: unknown;
  targetRole: string;
}): Promise<CareerRoadmap> {
  const response = await fetch("/api/career-roadmap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || "Failed to generate roadmap.");
  }

  return data;
}