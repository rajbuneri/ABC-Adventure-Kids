import React, { useState, useEffect } from "react";
import { ALPHABET_DATA } from "../data";
import { AlphabetItem, UserProgress } from "../types";
import { speak, stopSpeaking, sfx } from "../utils/audio";
import { Volume2, Sparkles, BookOpen, AlertCircle, ArrowLeft, ArrowRight, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LearnCardSectionProps {
  progress: UserProgress;
  onLetterLearned: (letter: string) => void;
  accentColor: string;
}

export default function LearnCardSection({
  progress,
  onLetterLearned,
  accentColor,
}: LearnCardSectionProps) {
  const [selectedLetter, setSelectedLetter] = useState<AlphabetItem | null>(null);
  const [hoveredLetter, setHoveredLetter] = useState<string | null>(null);
  const [favoriteLetters, setFavoriteLetters] = useState<string[]>(() => {
    const saved = localStorage.getItem("abc_kids_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  // Keep a record of autoplaying to avoid voice collisions
  useEffect(() => {
    // When selected letter changes, automatically say "A for Apple"
    if (selectedLetter) {
      triggerPronunciation(selectedLetter);
    }
    return () => {
      stopSpeaking();
    };
  }, [selectedLetter]);

  const toggleFavorite = (letter: string, e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playPop();
    const updated = favoriteLetters.includes(letter)
      ? favoriteLetters.filter((l) => l !== letter)
      : [...favoriteLetters, letter];
    setFavoriteLetters(updated);
    localStorage.setItem("abc_kids_favorites", JSON.stringify(updated));
  };

  const triggerPronunciation = (item: AlphabetItem) => {
    sfx.playPop();
    // Spell individual letter, then say full child-friendly statement
    const textToSpeak = `${item.letter}... is for... ${item.word}! ${item.letter} for ${item.word}!`;
    speak(textToSpeak, () => {
      onLetterLearned(item.letter);
    });
  };

  const playFact = (item: AlphabetItem, e: React.MouseEvent) => {
    e.stopPropagation();
    sfx.playPop();
    speak(item.fact);
  };

  const handleNext = () => {
    if (!selectedLetter) return;
    const currentIndex = ALPHABET_DATA.findIndex((x) => x.letter === selectedLetter.letter);
    const nextIndex = (currentIndex + 1) % ALPHABET_DATA.length;
    setSelectedLetter(ALPHABET_DATA[nextIndex]);
  };

  const handlePrev = () => {
    if (!selectedLetter) return;
    const currentIndex = ALPHABET_DATA.findIndex((x) => x.letter === selectedLetter.letter);
    const prevIndex = (currentIndex - 1 + ALPHABET_DATA.length) % ALPHABET_DATA.length;
    setSelectedLetter(ALPHABET_DATA[prevIndex]);
  };

  return (
    <div id="learn-card-section" className="space-y-6">
      {/* Upper info card */}
      <div className="bg-yellow-100 border-2 border-yellow-300 rounded-3xl p-4 md:p-6 text-center shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -left-10 w-24 h-24 bg-yellow-200 rounded-full opacity-50 blur-lg"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-yellow-200 rounded-full opacity-50 blur-lg"></div>
        <h2 className="text-xl md:text-3xl font-sans font-bold text-amber-800 flex items-center justify-center gap-2">
          🗣️ Let's Learn Alphabets!
        </h2>
        <p className="text-amber-700 text-sm md:text-base mt-2 font-medium">
          Tap a letter to learn its name, hear its beautiful word, and discover fun animal/object facts!
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!selectedLetter ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {ALPHABET_DATA.map((item, index) => {
              const isLearned = progress.learnedLetters.includes(item.letter);
              const isFav = favoriteLetters.includes(item.letter);
              return (
                <motion.button
                  key={item.letter}
                  id={`alphabet-btn-${item.letter}`}
                  whileHover={{ scale: 1.06, rotate: (index % 2 === 0 ? 2 : -2) }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedLetter(item)}
                  onMouseEnter={() => setHoveredLetter(item.letter)}
                  onMouseLeave={() => setHoveredLetter(null)}
                  className={`relative p-5 rounded-3xl border-4 ${item.borderColor} ${item.color} shadow-lg text-center cursor-pointer flex flex-col items-center justify-between aspect-square transition-all duration-200 min-h-[140px] hover:shadow-xl`}
                >
                  {/* Badge showing learned status */}
                  {isLearned && (
                    <span 
                      id={`alpha-learned-badge-${item.letter}`}
                      className="absolute top-2 left-2 bg-green-500 border border-white text-white rounded-full p-1 text-[10px] uppercase font-bold tracking-wider leading-none"
                      title="Learned!"
                    >
                      ✓
                    </span>
                  )}

                  {/* Favorite button */}
                  <span
                    id={`alpha-fav-btn-${item.letter}`}
                    onClick={(e) => toggleFavorite(item.letter, e)}
                    className="absolute top-2 right-2 text-rose-100 hover:text-rose-600 transition-colors p-1"
                  >
                    <Heart className={`w-5 h-5 ${isFav ? "fill-rose-600 text-rose-600" : ""}`} />
                  </span>

                  {/* Massive high-contrast letter style */}
                  <div className="text-6xl font-bold font-sans text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] flex-1 flex items-center justify-center">
                    {item.letter}
                  </div>

                  {/* Label containing example and emoji */}
                  <div className="bg-white/90 rounded-2xl py-1 px-3 mt-2 w-full text-center flex items-center justify-center gap-1 border border-black/5 shadow-xs">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide truncate">
                      {item.word}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          /* Interactive Detail Slider Mode */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-3xl border-4 ${selectedLetter.borderColor} bg-white max-w-2xl mx-auto shadow-2xl overflow-hidden p-6 md:p-8 relative`}
          >
            {/* Top actions */}
            <div className="flex justify-between items-center mb-6">
              <button
                id="btn-back-to-grid"
                onClick={() => {
                  sfx.playPop();
                  setSelectedLetter(null);
                }}
                className="px-4 py-2 bg-slate-100 border-2 border-slate-300 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-colors cursor-pointer text-sm"
              >
                ← Back to Grid
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono bg-slate-100 font-bold text-slate-500 px-3 py-1 rounded-full border border-slate-200">
                  Letter {ALPHABET_DATA.findIndex((x) => x.letter === selectedLetter.letter) + 1} of 26
                </span>
                <button
                  id="detail-fav-btn"
                  onClick={(e) => toggleFavorite(selectedLetter.letter, e)}
                  className="p-2 bg-slate-100 rounded-2xl border-2 border-slate-200 hover:bg-rose-50 transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      favoriteLetters.includes(selectedLetter.letter)
                        ? "fill-rose-500 text-rose-500 animate-bounce"
                        : "text-slate-500"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Giant display section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-4">
              {/* Left Column: Big letters with cute background bubble */}
              <div className="flex flex-col items-center justify-center text-center">
                <div
                  className={`w-44 h-44 rounded-full ${selectedLetter.color} flex items-center justify-center text-white text-9xl font-extrabold shadow-inner relative select-none`}
                >
                  <motion.span
                    key={selectedLetter.letter}
                    animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    onClick={() => triggerPronunciation(selectedLetter)}
                    className="cursor-pointer font-sans drop-shadow-lg"
                  >
                    {selectedLetter.letter}
                  </motion.span>
                  <span className="absolute bottom-2 right-2 text-3xl font-bold bg-white/40 backdrop-blur-xs text-slate-800 w-10 h-10 rounded-full flex items-center justify-center">
                    {selectedLetter.letter.toLowerCase()}
                  </span>
                </div>

                <div className="text-sm font-bold text-slate-400 mt-4 uppercase tracking-widest">
                  Uppercase & Lowercase
                </div>
              </div>

              {/* Right Column: Interaction, Illustration Word, Fact */}
              <div className="space-y-4 text-center md:text-left">
                <div>
                  <div className="text-4xl md:text-5xl font-extrabold text-slate-800 uppercase tracking-tight flex items-center justify-center md:justify-start gap-3">
                    <span className="text-5xl">{selectedLetter.emoji}</span>
                    <span className={selectedLetter.textColor}>{selectedLetter.word}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wide">
                    Example Word
                  </div>
                </div>

                {/* Direct audio activator */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <button
                    id="btn-play-pronounce"
                    onClick={() => triggerPronunciation(selectedLetter)}
                    className={`flex items-center gap-2 px-5 py-3 ${selectedLetter.color} ${selectedLetter.textColor} font-bold rounded-2xl border-2 ${selectedLetter.borderColor} cursor-pointer shadow-md hover:brightness-110 active:scale-95 transition-all text-sm`}
                  >
                    <Volume2 className="w-5 h-5 animate-pulse" />
                    Say Word Phrase
                  </button>

                  <button
                    id="btn-play-fact"
                    onClick={(e) => playFact(selectedLetter, e)}
                    className="flex items-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-2xl border-2 border-slate-300 hover:bg-slate-200 transition-colors cursor-pointer text-sm"
                  >
                    <BookOpen className="w-5 h-5" />
                    Hear Fun Fact
                  </button>
                </div>

                {/* Substantive children fact helper box */}
                <div className={`p-4 rounded-2xl border-2 ${selectedLetter.borderColor} ${selectedLetter.bgLight}`}>
                  <h4 className="text-xs uppercase font-extrabold text-slate-500 tracking-wider flex items-center gap-1 justify-center md:justify-start">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                    Awesome Kid Fact!
                  </h4>
                  <p className="text-slate-700 text-sm mt-1 font-medium italic transition-all duration-300">
                    "{selectedLetter.fact}"
                  </p>
                </div>
              </div>
            </div>

            {/* Slider navigation bars */}
            <div className="flex justify-between items-center border-t border-slate-200 pt-6 mt-6">
              <button
                id="btn-prev-letter"
                onClick={handlePrev}
                className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all border border-slate-300 cursor-pointer text-sm"
              >
                <ArrowLeft className="w-5 h-5" /> Prev
              </button>

              {/* Beautiful, responsive bottom letter links in order from A to Z */}
              <div className="flex-1 overflow-x-auto scrollbar-none px-2 py-1 mx-2">
                <div className="flex gap-2 justify-start items-center min-w-max">
                  {ALPHABET_DATA.map((x) => {
                    const isCurrent = x.letter === selectedLetter.letter;
                    const isLearned = progress.learnedLetters.includes(x.letter);
                    return (
                      <button
                        key={x.letter}
                        id={`letter-nav-${x.letter}`}
                        onClick={() => {
                          sfx.playPop();
                          setSelectedLetter(x);
                        }}
                        className={`w-11 h-12 rounded-2xl text-lg font-black flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                          isCurrent
                            ? `${x.color} text-white ring-4 ${x.borderColor} scale-110 shadow-lg`
                            : "bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                        }`}
                      >
                        <span className="font-sans leading-none">{x.letter}</span>
                        {isLearned && (
                          <span 
                            className="absolute -top-1 -right-1 w-3 h-3 bg-semibold bg-emerald-500 rounded-full border border-white flex items-center justify-center shadow-xs" 
                            title="Learned!"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                id="btn-next-letter"
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all border border-slate-300 cursor-pointer text-sm"
              >
                Next <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
