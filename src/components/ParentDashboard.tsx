import React from "react";
import { ALPHABET_DATA } from "../data";
import { UserProgress } from "../types";
import { sfx } from "../utils/audio";
import { BookOpen, Sparkles, Star, Award, CircleCheck, BarChart2, Eye, ShieldCheck, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface ParentDashboardProps {
  progress: UserProgress;
  onResetProgress: () => void;
}

export default function ParentDashboard({
  progress,
  onResetProgress,
}: ParentDashboardProps) {
  // Compute metrics
  const totalLettersLearned = progress.learnedLetters.length;
  const lettersLearnedPct = Math.round((totalLettersLearned / 26) * 100);

  const tracedLetters = Object.keys(progress.tracingProgress);
  const totalTracesCompleted = tracedLetters.reduce((acc, current) => {
    const trace = progress.tracingProgress[current];
    return acc + (trace.uppercase ? 1 : 0) + (trace.lowercase ? 1 : 0);
  }, 0);

  // Compute average quiz score
  const quizScoresList = progress.quizScores;
  const averageQuizPct = quizScoresList.length
    ? Math.round(
        (quizScoresList.reduce((acc, q) => acc + q.score, 0) /
          quizScoresList.reduce((acc, q) => acc + q.total, 0)) *
          100
      )
    : 0;

  // Format daily sessions learning time to readable minutes/seconds
  const totalMinutes = Math.floor(progress.dailyTimeMs / 60000);
  const totalSeconds = Math.floor((progress.dailyTimeMs % 60000) / 1000);

  const handleReset = () => {
    if (confirm("Are you sure you want to clear all learning stats? This will reset stars, badges, and tracing records for your child!")) {
      sfx.playPop();
      onResetProgress();
    }
  };

  return (
    <div id="parent-dashboard" className="space-y-8">
      {/* Upper overview stats grid */}
      <div className="bg-slate-800 border-4 border-slate-700 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <h2 className="text-xl md:text-3xl font-sans font-bold flex items-center gap-2">
          👨‍👩‍👧 Parents' Learning Dashboard
        </h2>
        <p className="text-slate-300 text-xs md:text-sm mt-1.5 font-medium">
          Understand your child's alphabet journey, review academic quiz attempts, and customize learning goals.
        </p>
      </div>

      {/* Metrics Row summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Letters Learned */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
          <BookOpen className="w-8 h-8 text-blue-500 mx-auto" />
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-800">{totalLettersLearned} / 26</div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Letters Explored</div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
            <div className="bg-blue-500 h-full" style={{ width: `${lettersLearnedPct}%` }}></div>
          </div>
        </div>

        {/* Tracing Progress */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
          <Award className="w-8 h-8 text-emerald-500 mx-auto" />
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-800">{totalTracesCompleted} Traces</div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Completed Writing</div>
          </div>
          <div className="text-xs font-bold text-slate-500 mt-2">
            {tracedLetters.length} Letters Tried
          </div>
        </div>

        {/* Quiz Scores */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
          <BarChart2 className="w-8 h-8 text-amber-500 mx-auto" />
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-800">
              {quizScoresList.length ? `${averageQuizPct}%` : "No Attempt"}
            </div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Avg. Quiz Accuracy</div>
          </div>
          <div className="text-xs font-bold text-slate-500 mt-2">
            {quizScoresList.length} Quizzes Tried
          </div>
        </div>

        {/* Daily Learning Time */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 shadow-sm text-center flex flex-col justify-between">
          <Star className="w-8 h-8 text-indigo-500 mx-auto" />
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-800">
              {totalMinutes}m {totalSeconds}s
            </div>
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Daily Session Time</div>
          </div>
          <div className="text-xs font-bold text-slate-500 mt-2">
            ⭐ {progress.stars} Total Stars
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alphabet checklist status grid matrix */}
        <div className="lg:col-span-2 bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-black text-slate-700">✍️ Complete Alphabet Progress Wall</h3>
          <p className="text-xs text-slate-400 font-bold leading-normal">
            Track which letters your child has explored, traced (uppercase/lowercase) or earned stars for:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {ALPHABET_DATA.map((item) => {
              const isLearned = progress.learnedLetters.includes(item.letter);
              const traceStats = progress.tracingProgress[item.letter];
              const isTracedUpper = traceStats?.uppercase;
              const isTracedLower = traceStats?.lowercase;

              return (
                <div
                  key={item.letter}
                  id={`parent-checklist-${item.letter}`}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1.5">
                    <span className="font-extrabold text-slate-800 text-lg">{item.letter}</span>
                    <span className="text-xs" title={item.word}>{item.emoji}</span>
                  </div>

                  <div className="space-y-1 text-[11px] font-bold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">🗣️ Heard:</span>
                      <span className={isLearned ? "text-green-500" : "text-slate-350"}>
                        {isLearned ? "Yes ✓" : "No"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">✍️ Upper (A):</span>
                      <span className={isTracedUpper ? "text-emerald-500" : "text-slate-350"}>
                        {isTracedUpper ? "Done ✓" : "No"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">✍️ Lower (a):</span>
                      <span className={isTracedLower ? "text-emerald-500" : "text-slate-350"}>
                        {isTracedLower ? "Done ✓" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Secondary right checks */}
        <div className="space-y-6">
          {/* Offline support notice indicator */}
          <div className="bg-teal-50 border-2 border-teal-200 rounded-3xl p-5 text-teal-900 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-teal-600 animate-pulse" />
              <h4 className="font-extrabold text-sm uppercase tracking-tight">Kid-Safe & Offline Support</h4>
            </div>
            <p className="text-[11px] font-bold text-teal-700 leading-relaxed">
              ABC Adventure Kids operates fully client-side. There are absolute zero external scripts, advertising trackers, or telemetry checks. All speech synthesis synthesis operates natively in browser, ensuring full safety and offline support for your toddlers!
            </p>
          </div>

          {/* Quick Config Actions */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
            <h4 className="font-extrabold text-slate-700 text-xs uppercase tracking-widest">Administrative Settings</h4>
            <div className="space-y-2">
              <button
                id="btn-parent-reset"
                onClick={handleReset}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset All Learning Progress
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
