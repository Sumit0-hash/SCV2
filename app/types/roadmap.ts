export interface CareerRoadmap {
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