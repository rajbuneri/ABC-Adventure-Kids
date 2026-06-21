import React, { useState, useEffect, useRef } from "react";
import { UserProgress } from "./types";
import { ALPHABET_DATA, BADGES, getEligibleBadges } from "./data";
import { speak, sfx, stopSpeaking } from "./utils/audio";
import LearnCardSection from "./components/LearnCardSection";
import VoiceLearningSection from "./components/VoiceLearningSection";
import TracingSection from "./components/TracingSection";
import QuizSection from "./components/QuizSection";
import GamesSection from "./components/GamesSection";
import RewardsSection from "./components/RewardsSection";
import ParentDashboard from "./components/ParentDashboard";
import { BookOpen, Mic, PenTool, Sparkles, Award, Star, Settings, CheckCircle2 } from "lucide-react";

const LOCAL_STORAGE_KEY = "abc_adventure_kids_progress";

const DEFAULTS_PROGRESS: UserProgress = {
  learnedLetters: [],
  quizScores: [],
  tracingProgress: {},
  unlockedBadges: [],
  stars: 0,
  dailyTimeMs: 0,
  lastActiveDate: new Date().toISOString().slice(0, 10),
};

export default function App() {
  const [progress, setProgress] = useState<UserProgress>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migrating structure safely
        return {
          ...DEFAULTS_PROGRESS,
          ...parsed,
          tracingProgress: parsed.tracingProgress || {},
          quizScores: parsed.quizScores || [],
          learnedLetters: parsed.learnedLetters || [],
          unlockedBadges: parsed.unlockedBadges || []
        };
      }
    } catch (e) {
      console.error("Local storage progress retrieval issue:", e);
    }
    return DEFAULTS_PROGRESS;
  });

  // Navigation tab menu
  const [activeTab, setActiveTab] = useState<"learn" | "voice" | "trace" | "quiz" | "games" | "rewards" | "parents">("learn");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotification, setShowNotification] = useState<string | null>(null);

  // Interval timer for daily training session progression
  useEffect(() => {
    // Say welcome chime on mount
    setTimeout(() => {
      sfx.playChime();
      speak("Welcome to ABC Adventure Kids! Let's explore some alphabets!");
    }, 1000);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const updated = {
          ...prev,
          dailyTimeMs: prev.dailyTimeMs + 5000,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }, 5000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Helper helper to update state & persist
  const updateProgress = (updater: (prev: UserProgress) => UserProgress) => {
    const updated = updater(progress);
    
    // Automatically evaluate new badges
    const eligibleBadges = getEligibleBadges(updated);
    if (eligibleBadges.length > updated.unlockedBadges.length) {
      // Find what badge was just unlocked and display sound
      const freshlyUnlocked = eligibleBadges.find((b) => !updated.unlockedBadges.includes(b));
      if (freshlyUnlocked) {
        const badgeDetails = BADGES.find((b) => b.id === freshlyUnlocked);
        if (badgeDetails) {
          setTimeout(() => {
            sfx.playTada();
            speak(`Congratulations! You unlocked the badge: ${badgeDetails.title}!`);
            setShowNotification(`🏆 Badged Unlocked: ${badgeDetails.title}! ${badgeDetails.emoji}`);
            setTimeout(() => {
              setShowNotification(null);
            }, 6000);
          }, 800);
        }
      }
      updated.unlockedBadges = eligibleBadges;
    }

    setProgress(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  // 1. Learn Alphabet Card completor
  const handleLetterLearned = (letter: string) => {
    if (!progress.learnedLetters.includes(letter)) {
      updateProgress((prev) => ({
        ...prev,
        learnedLetters: [...prev.learnedLetters, letter],
        stars: prev.stars + 1, // 1 star per first exploration
      }));
    }
  };

  // 2. Voice Learning Completetion
  const handleVoicePracticeCompleted = (letter: string) => {
    // Check-off speech flags, or track voice practice stats if needed
  };

  // 3. Alphabet Tracing completed handler
  const handleLetterTraced = (letter: string, type: "uppercase" | "lowercase") => {
    updateProgress((prev) => {
      const records = prev.tracingProgress[letter] || { uppercase: false, lowercase: false, stars: 0 };
      const alreadyDone = records[type];
      
      const newRecords = {
        ...records,
        [type]: true,
        stars: records.stars + (alreadyDone ? 0 : 3), // 3 stars on success
      };

      return {
        ...prev,
        tracingProgress: {
          ...prev.tracingProgress,
          [letter]: newRecords,
        },
      };
    });
  };

  // 4. Alphabet Quiz completion
  const handleQuizSubmitted = (score: number, total: number) => {
    updateProgress((prev) => ({
      ...prev,
      quizScores: [...prev.quizScores, { score, total, date: new Date().toLocaleDateString() }],
    }));
  };

  // 5. Educational Games completed
  const handleGameCompleted = () => {
    // Complete game
  };

  // Star earning helper widget
  const handleStarsEarnt = (amount: number) => {
    updateProgress((prev) => ({
      ...prev,
      stars: prev.stars + amount,
    }));
  };

  const handleResetProgress = () => {
    setProgress(DEFAULTS_PROGRESS);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULTS_PROGRESS));
    speak("Your alphabet journey has been reset safely! Let's start from A again!");
  };

  const totalWaypointsLearnedPct = Math.min(100, Math.round((progress.learnedLetters.length / 26) * 100));

  return (
    <div className="min-h-screen bg-[#FFF9E6] flex flex-col font-sans select-none text-[#4A4A4A]">
      {/* Top sticky banner header with cartoon metrics in gold background */}
      <header className="h-20 bg-[#FFD700] flex items-center justify-between px-4 md:px-8 border-b-4 border-orange-400 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          
          {/* Brand Icon and Name */}
          <div 
            id="brand-header-link"
            onClick={() => {
              sfx.playPop();
              setActiveTab("learn");
            }}
            className="flex items-center gap-3 md:gap-4 cursor-pointer group"
          >
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-3xl font-black text-orange-500 shadow-inner group-hover:scale-115 group-hover:rotate-6 transition-all duration-200">
              A
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#FF6B6B] tracking-tight drop-shadow-[0_2px_0_rgba(255,255,255,0.8)]">
                ABC Adventure Kids
              </h1>
              <p className="hidden md:block text-[10px] text-orange-700 font-extrabold uppercase tracking-widest mt-0.5">
                Play & Learn Alphabets!
              </p>
            </div>
          </div>

          {/* Quick Stats bubble tracker and volume controls */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Stars Count bubble block */}
            <div 
              id="top-stars-display"
              className="bg-white px-4 py-1.5 md:py-2 rounded-full border-2 border-orange-200 flex items-center gap-2 shadow-sm"
            >
              <span className="text-xl md:text-2xl animate-pulse">⭐</span>
              <span className="font-bold text-base md:text-xl text-orange-600">{progress.stars}</span>
            </div>

            {/* Micro Audio Toggles styled for Vibrant Palette */}
            <button
              id="audio-speaker-toggle-btn"
              onClick={() => {
                sfx.playPop();
                if (soundEnabled) {
                  stopSpeaking();
                  setSoundEnabled(false);
                } else {
                  setSoundEnabled(true);
                  speak("Hello! Audios are now enabled!");
                }
              }}
              className={`p-2 rounded-xl border-b-4 font-bold text-xs cursor-pointer active:translate-y-0.5 transition-all ${
                soundEnabled 
                  ? "bg-[#4ECDC4] border-[#3BA8A0] text-white" 
                  : "bg-white border-slate-200 text-slate-400"
              }`}
              title={soundEnabled ? "Mute Pronunciation Voice" : "Enable Pronunciation Voice"}
            >
              {soundEnabled ? "🔊 Vocal" : "🔇 Mute"}
            </button>
          </div>
        </div>
      </header>

      {/* Universal mobile navigation toolbar */}
      <div className="md:hidden bg-[#FF8C42] border-b-2 border-orange-500 py-2 sticky top-20 z-40">
        <div className="px-4 flex gap-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => { sfx.playPop(); setActiveTab("learn"); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 whitespace-nowrap transition-all ${
              activeTab === "learn" ? "bg-white text-orange-600 shadow-md" : "bg-orange-600 text-white"
            }`}
          >
            📖 Learn
          </button>
          <button
            onClick={() => { sfx.playPop(); setActiveTab("trace"); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 whitespace-nowrap transition-all ${
              activeTab === "trace" ? "bg-white text-emerald-600 shadow-md" : "bg-orange-600 text-white"
            }`}
          >
            ✍️ Trace
          </button>
          <button
            onClick={() => { sfx.playPop(); setActiveTab("voice"); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 whitespace-nowrap transition-all ${
              activeTab === "voice" ? "bg-white text-cyan-600 shadow-md" : "bg-orange-600 text-white"
            }`}
          >
            🎙️ Speak
          </button>
          <button
            onClick={() => { sfx.playPop(); setActiveTab("games"); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 whitespace-nowrap transition-all ${
              activeTab === "games" ? "bg-white text-indigo-600 shadow-md" : "bg-orange-600 text-white"
            }`}
          >
            🧩 Games
          </button>
          <button
            onClick={() => { sfx.playPop(); setActiveTab("quiz"); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 whitespace-nowrap transition-all ${
              activeTab === "quiz" ? "bg-white text-purple-600 shadow-md" : "bg-orange-600 text-white"
            }`}
          >
            🏆 Quiz
          </button>
          <button
            onClick={() => { sfx.playPop(); setActiveTab("rewards"); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 whitespace-nowrap transition-all ${
              activeTab === "rewards" ? "bg-white text-rose-600 shadow-md" : "bg-orange-600 text-white"
            }`}
          >
            🎨 Stickers
          </button>
          <button
            onClick={() => { sfx.playPop(); setActiveTab("parents"); }}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 whitespace-nowrap transition-all ${
              activeTab === "parents" ? "bg-white text-slate-800 shadow-md" : "bg-orange-600 text-white"
            }`}
          >
            👨‍👩‍👧 Parents
          </button>
        </div>
      </div>

      {/* Main Console Layout grid */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Left Aside Navigation bar on desktop */}
        <aside className="hidden md:flex w-24 bg-[#FF8C42] flex-col items-center py-8 gap-8 shadow-[inset_-4px_0_0_rgba(0,0,0,0.05)] border-r-2 border-orange-500">
          
          {/* Learn ABC tab */}
          <button 
            onClick={() => { sfx.playPop(); setActiveTab("learn"); }}
            title="Learn ABC"
            className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
              activeTab === "learn"
                ? "bg-white border-b-4 border-gray-250 scale-105"
                : "bg-[#FFD700] hover:bg-[#FFE033] border-b-4 border-[#C7A800] hover:scale-105"
            }`}
          >
            <span className="text-3xl text-white">📖</span>
          </button>

          {/* Magic Tracing tab */}
          <button 
            onClick={() => { sfx.playPop(); setActiveTab("trace"); }}
            title="Magic Tracing"
            className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
              activeTab === "trace"
                ? "bg-white border-b-4 border-gray-250 scale-105"
                : "bg-[#4ECDC4] hover:bg-[#5FE9E0] border-b-4 border-[#3BA8A0] hover:scale-105"
            }`}
          >
            <span className="text-3xl text-white">✍️</span>
          </button>

          {/* Speak Practice Tab */}
          <button 
            onClick={() => { sfx.playPop(); setActiveTab("voice"); }}
            title="Speak Practice"
            className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
              activeTab === "voice"
                ? "bg-white border-b-4 border-gray-250 scale-105"
                : "bg-[#87CEEB] hover:bg-[#9EDEFF] border-b-4 border-[#6CAAC4] hover:scale-105"
            }`}
          >
            <span className="text-3xl text-white">🎙️</span>
          </button>

          {/* Fun Games tab */}
          <button 
            onClick={() => { sfx.playPop(); setActiveTab("games"); }}
            title="Fun Games"
            className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
              activeTab === "games"
                ? "bg-white border-b-4 border-gray-250 scale-105"
                : "bg-[#9370DB] hover:bg-[#9F83E3] border-b-4 border-[#7B5EC0] hover:scale-105"
            }`}
          >
            <span className="text-3xl text-white">🧩</span>
          </button>

          {/* Play Quiz tab */}
          <button 
            onClick={() => { sfx.playPop(); setActiveTab("quiz"); }}
            title="Play Quiz"
            className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
              activeTab === "quiz"
                ? "bg-white border-b-4 border-gray-250 scale-105"
                : "bg-[#FF6B6B] hover:bg-[#FF8585] border-b-4 border-[#D64545] hover:scale-105"
            }`}
          >
            <span className="text-3xl text-white">🏆</span>
          </button>

          {/* Sticker book tab */}
          <button 
            onClick={() => { sfx.playPop(); setActiveTab("rewards"); }}
            title="Sticker Book"
            className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all ${
              activeTab === "rewards"
                ? "bg-white border-b-4 border-gray-250 scale-105"
                : "bg-[#FF8C42] hover:bg-[#FFA366] border-b-4 border-[#D16B20] hover:scale-105"
            }`}
          >
            <span className="text-3xl text-white">🎨</span>
          </button>

          {/* Parents Dashboard Tab */}
          <button 
            onClick={() => { sfx.playPop(); setActiveTab("parents"); }}
            title="Parents Space"
            className={`w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center transition-all mt-auto ${
              activeTab === "parents"
                ? "bg-white border-b-4 border-gray-150 scale-105"
                : "bg-slate-700 hover:bg-slate-800 border-b-4 border-slate-900 hover:scale-105"
            }`}
          >
            <span className="text-3xl text-white">👪</span>
          </button>
        </aside>

        {/* Central interactive viewport with sky-blue playroom stage */}
        <section className="flex-1 p-4 md:p-8 flex flex-col relative w-full overflow-hidden">
          
          {/* Animated floating global rewards banner */}
          {showNotification && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-[#FFD700] text-[#4A4A4A] border-4 border-[#FF8C42] px-6 py-3 rounded-full shadow-2xl z-50 animate-bounce flex items-center gap-2 font-black text-sm">
              <span>🎉</span>
              <span>{showNotification}</span>
            </div>
          )}

          {/* Core child-friendly viewport stage frame */}
          <div className="flex-1 bg-white vibrant-stage p-6 md:p-10 relative overflow-y-auto">
            {activeTab === "learn" && (
              <LearnCardSection
                progress={progress}
                onLetterLearned={handleLetterLearned}
                accentColor="bg-amber-400"
              />
            )}

            {activeTab === "voice" && (
              <VoiceLearningSection
                progress={progress}
                onVoicePracticeCompleted={handleVoicePracticeCompleted}
                onStarsEarnt={handleStarsEarnt}
              />
            )}

            {activeTab === "trace" && (
              <TracingSection
                progress={progress}
                onLetterTraced={handleLetterTraced}
                onStarsEarnt={handleStarsEarnt}
              />
            )}

            {activeTab === "quiz" && (
              <QuizSection
                progress={progress}
                onQuizSubmitted={handleQuizSubmitted}
                onStarsEarnt={handleStarsEarnt}
              />
            )}

            {activeTab === "games" && (
              <GamesSection
                progress={progress}
                onGameCompleted={handleGameCompleted}
                onStarsEarnt={handleStarsEarnt}
              />
            )}

            {activeTab === "rewards" && (
              <RewardsSection progress={progress} />
            )}

            {activeTab === "parents" && (
              <ParentDashboard
                progress={progress}
                onResetProgress={handleResetProgress}
              />
            )}
          </div>
        </section>

        {/* Right aside metrics tracking & live badge shelf */}
        <aside className="hidden xl:flex w-24 bg-[#FFF9E6] border-l-4 border-orange-100 flex-col items-center py-8 gap-6 justify-between">
          
          <div className="flex flex-col items-center gap-6 w-full">
            {/* Beginner progress badge */}
            <div className="flex flex-col items-center text-center">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow transition-all duration-300 ${
                  progress.learnedLetters.length >= 1
                    ? "bg-white border-2 border-orange-305 scale-110"
                    : "bg-gray-100 border-2 border-gray-200 grayscale opacity-40"
                }`}
                title="Beginner Explorer badge"
              >
                🏅
              </div>
              <div className="text-[10px] font-black text-orange-400 mt-1 uppercase tracking-wider">Beginner</div>
            </div>

            {/* King status badge */}
            <div className="flex flex-col items-center text-center">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow transition-all duration-300 ${
                  progress.learnedLetters.length === 26
                    ? "bg-white border-2 border-orange-305 scale-110"
                    : "bg-gray-100 border-2 border-gray-200 grayscale opacity-40"
                }`}
                title="Alphabet King badge"
              >
                🦁
              </div>
              <div className="text-[10px] font-black text-orange-400 mt-1 uppercase tracking-wider">Lion King</div>
            </div>

            {/* Artist visual unlocked badge */}
            <div className="flex flex-col items-center text-center">
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow transition-all duration-300 ${
                  progress.unlockedBadges.includes("trace_pro") || progress.unlockedBadges.includes("game_champ")
                    ? "bg-white border-2 border-orange-305 scale-110"
                    : "bg-gray-100 border-2 border-gray-200 grayscale opacity-40"
                }`}
                title="Creative Artist badge"
              >
                🎨
              </div>
              <div className="text-[10px] font-black text-orange-400 mt-1 uppercase tracking-wider">Artist</div>
            </div>
          </div>

          {/* Dynamic dynamic slider track metric representation */}
          <div className="flex flex-col items-center w-full flex-1 justify-end">
            <div className="w-1.5 flex-1 bg-orange-100/70 rounded-full relative overflow-hidden my-4">
              <div 
                className="absolute bottom-0 left-0 w-full bg-orange-400 rounded-full transition-all duration-500"
                style={{ height: `${totalWaypointsLearnedPct}%` }}
              />
            </div>
            <div className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Done</div>
            <div className="text-sm font-black text-orange-400">{totalWaypointsLearnedPct}%</div>
          </div>

        </aside>

      </div>
    </div>
  );
}
