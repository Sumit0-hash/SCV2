interface GenerateRoadmapButtonProps {
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const GenerateRoadmapButton = ({ onClick, isLoading, disabled }: GenerateRoadmapButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || disabled}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {isLoading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
      )}
      {isLoading ? "Generating Roadmap..." : "Generate Improvement Roadmap"}
    </button>
  );
};

export default GenerateRoadmapButton;