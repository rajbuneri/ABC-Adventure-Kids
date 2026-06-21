import React, { useState, useEffect } from "react";
import { ALPHABET_DATA } from "../data";
import { AlphabetItem, UserProgress } from "../types";
import { sfx, speak } from "../utils/audio";
import { Sparkles, Check, X, Award, RotateCcw, ThumbsUp, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface QuizSectionProps {
  progress: UserProgress;
  onQuizSubmitted: (score: number, total: number) => void;
  onStarsEarnt: (stars: number) => void;
}

interface Question {
  id: number;
  type: "letter_id" | "pic_id" | "match_letter";
  prompt: string;
  correctAnswer: string;
  options: { label: string; value: string; emoji?: string }[];
  targetItem: AlphabetItem;
}

export default function QuizSection({
  progress,
  onQuizSubmitted,
  onStarsEarnt,
}: QuizSectionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [starsWonInSession, setStarsWonInSession] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    generateNewQuiz();
  }, []);

  const generateNewQuiz = () => {
    const generated: Question[] = [];
    const availableLetters = [...ALPHABET_DATA];

    for (let i = 0; i < 5; i++) {
      // Pick a random primary target
      const idx = Math.floor(Math.random() * availableLetters.length);
      const target = availableLetters[idx];
      
      // Select 2 other random options for distractors
      const distractors = ALPHABET_DATA.filter((x) => x.letter !== target.letter)
        .sort(() => 0.5 - Math.random())
        .slice(0, 2);

      const qType = ["letter_id", "pic_id", "match_letter"][Math.floor(Math.random() * 3)] as Question["type"];

      let prompt = "";
      let correctAnswer = "";
      let options: { label: string; value: string; emoji?: string }[] = [];

      if (qType === "letter_id") {
        prompt = `Which letter is "${target.letter}"?`;
        correctAnswer = target.letter;
        options = [
          { label: target.letter, value: target.letter },
          { label: distractors[0].letter, value: distractors[0].letter },
          { label: distractors[1].letter, value: distractors[1].letter },
        ];
      } else if (qType === "pic_id") {
        prompt = `Which picture starts with "${target.letter}"?`;
        correctAnswer = target.word;
        options = [
          { label: `${target.emoji} ${target.word}`, value: target.word },
          { label: `${distractors[0].emoji} ${distractors[0].word}`, value: distractors[0].word },
          { label: `${distractors[1].emoji} ${distractors[1].word}`, value: distractors[1].word },
        ];
      } else {
        prompt = `What letter starts the word for ${target.emoji}?`;
        correctAnswer = target.letter;
        options = [
          { label: target.letter, value: target.letter },
          { label: distractors[0].letter, value: distractors[0].letter },
          { label: distractors[1].letter, value: distractors[1].letter },
        ];
      }

      // Shuffle options lists
      options.sort(() => 0.5 - Math.random());

      generated.push({
        id: i + 1,
        type: qType,
        prompt,
        correctAnswer,
        options,
        targetItem: target,
      });
    }

    setQuestions(generated);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStarsWonInSession(0);
    setQuizCompleted(false);

    // Speak initial questions
    setTimeout(() => {
      speak(generated[0].prompt);
    }, 200);
  };

  const handleSelectOption = (value: string) => {
    if (isAnswered) return;
    sfx.playPop();
    setSelectedOption(value);
  };

  const checkAnswer = () => {
    if (!selectedOption || isAnswered) return;
    
    setIsAnswered(true);
    const step = questions[currentQuestionIndex];
    if (selectedOption === step.correctAnswer) {
      sfx.playChime();
      setScore((s) => s + 1);
      setStarsWonInSession((st) => st + 2);
      onStarsEarnt(2); // Award 2 stars for correct answers!
      speak("Excellent choice! You are correct!");
    } else {
      sfx.playError();
      speak(`Whoops! The correct answer is... ${step.correctAnswer}!`);
    }
  };

  const handleNext = () => {
    sfx.playPop();
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedOption(null);
      setIsAnswered(false);
      
      // Auto-say next question
      setTimeout(() => {
        speak(questions[nextIndex].prompt);
      }, 50);
    } else {
      setQuizCompleted(true);
      sfx.playTada();
      onQuizSubmitted(score, questions.length);
      speak(`Congratulations! You completed the quiz with ${score} correct answers out of ${questions.length}!`);
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div id="quiz-section" className="space-y-6">
      <div className="bg-amber-100 border-2 border-amber-300 rounded-3xl p-5 text-center shadow-sm relative overflow-hidden">
        <h2 className="text-xl md:text-3xl font-sans font-bold text-amber-800 flex items-center justify-center gap-2">
          🏆 Fun Alphabet Quiz Challenge!
        </h2>
        <p className="text-amber-700 text-sm md:text-base mt-2 font-medium">
          Answer questions to prove your knowledge or win awesome star rewards!
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!quizCompleted && currentQuestion ? (
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border-4 border-amber-400 rounded-3xl p-6 md:p-8 max-w-xl mx-auto shadow-xl space-y-6"
          >
            {/* Header progress info */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <span className="bg-slate-100 px-3 py-1.5 rounded-full">
                Question {currentQuestionIndex + 1} of 5
              </span>
              <span className="text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 flex items-center gap-1">
                ⭐ Score: {score}
              </span>
            </div>

            {/* Prompt */}
            <div className="text-center py-4 space-y-3">
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 leading-snug">
                {currentQuestion.prompt}
              </h3>
              <div className="flex justify-center">
                <button
                  id="quiz-repeat-audio-btn"
                  onClick={() => speak(currentQuestion.prompt)}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer"
                >
                  🔊 Repeat Question
                </button>
              </div>
            </div>

            {/* Options selection stack */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === option.value;
                const isCorrect = option.value === currentQuestion.correctAnswer;
                
                // Styling colors based on feedback state
                let optionStyle = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700";
                if (isSelected) {
                  optionStyle = "bg-amber-100 border-amber-400 text-amber-800 scale-[1.02]";
                }
                if (isAnswered) {
                  if (isSelected) {
                    optionStyle = isCorrect
                      ? "bg-green-100 border-green-500 text-green-800"
                      : "bg-rose-100 border-rose-500 text-rose-800";
                  } else if (isCorrect) {
                    optionStyle = "bg-green-100 border-green-500 text-green-800";
                  } else {
                    optionStyle = "bg-slate-50 border-slate-200 text-slate-400 opacity-50";
                  }
                }

                // Give options distinct playful background frames
                const optionColors = [
                  "border-l-rose-500 border-l-8",
                  "border-l-sky-500 border-l-8",
                  "border-l-emerald-500 border-l-8"
                ];

                return (
                  <button
                    key={index}
                    id={`quiz-option-${index}`}
                    disabled={isAnswered}
                    onClick={() => handleSelectOption(option.value)}
                    className={`w-full text-left p-5 rounded-2xl border-2 font-extrabold text-lg md:text-xl flex items-center justify-between transition-all select-none ${optionStyle} ${
                      !isAnswered ? "cursor-pointer active:scale-98" : ""
                    } ${optionColors[index % 3]}`}
                  >
                    <span>{option.label}</span>
                    <div className="flex items-center gap-2">
                      {isAnswered && isCorrect && (
                        <Check className="w-6 h-6 text-green-600" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <X className="w-6 h-6 text-rose-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confirmation actions */}
            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              {!isAnswered ? (
                <button
                  id="btn-quiz-submit"
                  disabled={!selectedOption}
                  onClick={checkAnswer}
                  className={`px-6 py-3 font-bold rounded-2xl text-sm transition-all focus:ring shadow-md ${
                    selectedOption
                      ? "bg-amber-500 hover:bg-amber-600 text-white cursor-pointer hover:scale-102"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  Check Reward! ✓
                </button>
              ) : (
                <button
                  id="btn-quiz-next"
                  onClick={handleNext}
                  className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl text-sm transition-all cursor-pointer flex items-center gap-1 hover:scale-102 shadow-md"
                >
                  {currentQuestionIndex === questions.length - 1 ? "Get Results 📊" : "Next Question →"}
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          /* Finished State card */
          <motion.div
            key="finished"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-4 border-green-400 rounded-3xl p-8 max-w-md mx-auto shadow-2xl text-center space-y-6"
          >
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center animate-bounce">
                <Award className="w-12 h-12 text-amber-500" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800">QUIZ SUCCESS!</h3>
              <p className="text-sm font-semibold text-slate-500">
                Outstanding accomplishment, champion!
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-3xl font-black text-slate-800">{score} / 5</div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Correct Answers</div>
              </div>
              <div className="text-center border-l border-slate-200">
                <div className="text-3xl font-black text-amber-500 flex items-center justify-center gap-0.5">
                  ⭐ +{starsWonInSession}
                </div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Stars Won</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                id="btn-quiz-restart"
                onClick={generateNewQuiz}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <RotateCcw className="w-4 h-4" /> Restart New Quiz
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
