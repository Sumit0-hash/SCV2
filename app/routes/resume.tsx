import { Link, useNavigate, useParams } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { usePuterStore } from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import GenerateRoadmapButton from "~/components/roadmap/GenerateRoadmapButton";
import ImprovementRoadmapDashboard from "~/components/roadmap/ImprovementRoadmapDashboard";
import { requestCareerRoadmap } from "~/lib/career-roadmap-api";
import type { CareerRoadmap } from "~/types/roadmap";
import { prepareResumeDataInstructions } from "../../constants";

export const meta = () => [
  { title: "Resumind | Review " },
  { name: "description", content: "Detailed overview of your resume" },
];

const Resume = () => {
    const { auth, isLoading, fs, kv, ai } = usePuterStore();
  const { id } = useParams();
  const [imageUrl, setImageUrl] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [storedParsedResumeData, setStoredParsedResumeData] = useState<any>(null);
  const [targetRole, setTargetRole] = useState("");
  const [roadmap, setRoadmap] = useState<CareerRoadmap | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapError, setRoadmapError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
  }, [isLoading, auth.isAuthenticated, navigate, id]);

  useEffect(() => {
    const loadResume = async () => {
      const resume = await kv.get(`resume:${id}`);

      if (!resume) return;

      const data = JSON.parse(resume);

      const resumeBlob = await fs.read(data.resumePath);
      if (!resumeBlob) return;

      const pdfBlob = new Blob([resumeBlob], { type: "application/pdf" });
      const nextResumeUrl = URL.createObjectURL(pdfBlob);
      setResumeUrl(nextResumeUrl);

      const imageBlob = await fs.read(data.imagePath);
      if (!imageBlob) return;
      const nextImageUrl = URL.createObjectURL(imageBlob);
      setImageUrl(nextImageUrl);

      setFeedback(data.feedback);

      let parsedData = data.parsedResumeData || null;
      if (!parsedData && data.resumePath) {
        const parsedResumeDataResponse = await ai.feedback(
          data.resumePath,
          prepareResumeDataInstructions()
        );

        if (parsedResumeDataResponse) {
          const parsedResumeDataText = typeof parsedResumeDataResponse.message.content === "string"
            ? parsedResumeDataResponse.message.content
            : parsedResumeDataResponse.message.content[0].text;

          parsedData = JSON.parse(parsedResumeDataText);
          data.parsedResumeData = parsedData;
          await kv.set(`resume:${id}`, JSON.stringify(data));
        }
      }

      setStoredParsedResumeData(parsedData);
      setTargetRole(data.jobTitle || "General Software Role");
    };

    loadResume();
  }, [id, fs, kv, ai]);

  const parsedResumeData = useMemo(() => {
    if (storedParsedResumeData) return storedParsedResumeData;
    if (!feedback) return null;

    // Backward compatibility for previously analyzed resumes that don't yet
    // have structured parsed resume data stored.
    return {
      skills: feedback.skills?.tips?.map((item) => item.tip) || [],
      experience: feedback.content?.tips?.map((item) => item.tip) || [],
      education: feedback.structure?.tips?.map((item) => item.tip) || [],
      ats_insights: {
        score: feedback.ATS?.score || 0,
        tips: feedback.ATS?.tips?.map((item) => item.tip) || [],
      },
      overallScore: feedback.overallScore,
    };
  }, [feedback, storedParsedResumeData]);

  const handleGenerateRoadmap = async () => {
    if (!parsedResumeData || !targetRole) return;

    setIsGeneratingRoadmap(true);
    setRoadmapError("");

    try {
      const generatedRoadmap = await requestCareerRoadmap({
        parsedResumeData,
        targetRole,
      });
      setRoadmap(generatedRoadmap);
    } catch (error: any) {
      setRoadmapError(error?.message || "Unable to generate roadmap right now.");
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  return (
    <main className="!pt-0">
      <nav className="resume-nav">
        <Link to="/" className="back-button">
          <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
          <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
        </Link>
      </nav>
      <div className="flex flex-row w-full max-lg:flex-col-reverse">
        <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
          {imageUrl && resumeUrl && (
            <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                <img src={imageUrl} className="w-full h-full object-contain rounded-2xl" title="resume" />
              </a>
            </div>
          )}
        </section>
        <section className="feedback-section">
          <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
          {feedback ? (
            <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
              <Summary feedback={feedback} />
              <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
              <Details feedback={feedback} />

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-6">
                <p className="text-sm text-slate-600">
                  Target Role: <span className="font-semibold text-slate-900">{targetRole}</span>
                </p>
                <div className="mt-4">
                  <GenerateRoadmapButton
                    onClick={handleGenerateRoadmap}
                    isLoading={isGeneratingRoadmap}
                    disabled={!parsedResumeData}
                  />
                </div>
                {roadmapError && <p className="mt-3 text-sm text-red-600">{roadmapError}</p>}
                {roadmap && <ImprovementRoadmapDashboard roadmap={roadmap} />}
              </div>
            </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}
                </section>
            </div>
        </main>
    );
};
export default Resume