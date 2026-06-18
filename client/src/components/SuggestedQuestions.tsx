interface SuggestedQuestionsProps {
  currentQuestion: string;
  onSelectQuestion: (question: string) => void;
}

const SUGGESTED_QUESTIONS = [
  "What is your return policy?",
  "Do you offer free shipping?",
  "How can I track my order?",
  "Can I cancel my order?",
];

export default function SuggestedQuestions({
  currentQuestion,
  onSelectQuestion,
}: Readonly<SuggestedQuestionsProps>) {
  return (
    <div className="mt-4 flex flex-col sm:flex-row flex-wrap justify-center gap-3 max-w-2xl px-4">
      {SUGGESTED_QUESTIONS.map((q) => {
        const isSelected = currentQuestion === q;
        return (
          <button
            key={q}
            onClick={() => onSelectQuestion(q)}
            className={`px-4 py-2.5 rounded-full text-xs font-body tracking-wide font-light
              border transition-all duration-300 cursor-pointer text-center
              ${
                isSelected
                  ? "bg-forest border-forest text-white dark:bg-cream dark:border-cream dark:text-black shadow-md"
                  : "border-black/8 dark:border-white/8 bg-cream-light/30 dark:bg-white/5 text-black/70 dark:text-cream/80 hover:bg-cream-light/60 dark:hover:bg-white/10 hover:border-gold/30 dark:hover:border-gold-light/30"
              }
            `}
          >
            {q}
          </button>
        );
      })}
    </div>
  );
}
