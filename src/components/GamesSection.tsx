import React, { useState, useEffect } from "react";
import { ALPHABET_DATA } from "../data";
import { AlphabetItem, UserProgress } from "../types";
import { sfx, speak } from "../utils/audio";
import { Sparkles, Trophy, RotateCcw, Award, CheckCircle2, Star, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface GamesSectionProps {
  progress: UserProgress;
  onGameCompleted: () => void;
  onStarsEarnt: (stars: number) => void;
}

export default function GamesSection({
  progress,
  onGameCompleted,
  onStarsEarnt,
}: GamesSectionProps) {
  const [activeGame, setActiveGame] = useState<"match" | "pockets" | "memory">("match");

  return (
    <div id="games-section" className="space-y-6">
      {/* Selector tab bars */}
      <div className="flex bg-slate-100 p-1 rounded-3xl border border-slate-200 justify-around max-w-xl mx-auto gap-2">
        <button
          id="btn-game-match-tab"
          onClick={() => {
            sfx.playPop();
            setActiveGame("match");
          }}
          className={`px-3 md:px-5 py-3 rounded-2xl text-xs md:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer flex-1 justify-center ${
            activeGame === "match"
              ? "bg-indigo-500 text-white shadow-md scale-102"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🧩 Letter Links
        </button>

        <button
          id="btn-game-pockets-tab"
          onClick={() => {
            sfx.playPop();
            setActiveGame("pockets");
          }}
          className={`px-3 md:px-5 py-3 rounded-2xl text-xs md:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer flex-1 justify-center ${
            activeGame === "pockets"
              ? "bg-emerald-500 text-white shadow-md scale-102"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🧺 Match-to-Pocket
        </button>

        <button
          id="btn-game-memory-tab"
          onClick={() => {
            sfx.playPop();
            setActiveGame("memory");
          }}
          className={`px-3 md:px-5 py-3 rounded-2xl text-xs md:text-sm font-black transition-all flex items-center gap-1.5 cursor-pointer flex-1 justify-center ${
            activeGame === "memory"
              ? "bg-rose-500 text-white shadow-md scale-102"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          🎴 Memory Fun
        </button>
      </div>

      {/* Render selected children game */}
      <div className="transition-all duration-300">
        {activeGame === "match" && (
          <LetterLinksSubGame onGameCompleted={onGameCompleted} onStarsEarnt={onStarsEarnt} />
        )}
        {activeGame === "pockets" && (
          <MatchToPocketSubGame onGameCompleted={onGameCompleted} onStarsEarnt={onStarsEarnt} />
        )}
        {activeGame === "memory" && (
          <MemorySubGame onGameCompleted={onGameCompleted} onStarsEarnt={onStarsEarnt} />
        )}
      </div>
    </div>
  );
}

/* SUB GAME 1: LETTER LINKS PAIR MATCHING */
interface PairItem {
  id: string;
  letter: string;
  word: string;
  emoji: string;
  matched: boolean;
}

function LetterLinksSubGame({
  onGameCompleted,
  onStarsEarnt,
}: {
  onGameCompleted: () => void;
  onStarsEarnt: (stars: number) => void;
}) {
  const [items, setItems] = useState<PairItem[]>([]);
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null);
  const [selectedEmojiId, setSelectedEmojiId] = useState<string | null>(null);
  const [leftCol, setLeftCol] = useState<PairItem[]>([]);
  const [rightCol, setRightCol] = useState<PairItem[]>([]);
  const [score, setScore] = useState(0);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Generate 4 distinct random letters and sort them alphabetically in order from A to Z
    const alphabetSlice = [...ALPHABET_DATA]
      .sort(() => 0.5 - Math.random())
      .slice(0, 4)
      .sort((a, b) => a.letter.localeCompare(b.letter));

    const gameItems: PairItem[] = alphabetSlice.map((item) => ({
      id: item.letter,
      letter: item.letter,
      word: item.word,
      emoji: item.emoji,
      matched: false,
    }));

    setItems(gameItems);
    // Left column (letters) must be sorted alphabetically from A to Z to optimize linear visual learning sequence
    setLeftCol([...gameItems].sort((a, b) => a.letter.localeCompare(b.letter)));
    // Right column remains randomized for the interactive connection challenge
    setRightCol([...gameItems].sort(() => 0.5 - Math.random()));
    setSelectedLetterId(null);
    setSelectedEmojiId(null);
    setScore(0);
    setHasWon(false);

    speak("Let's connect each letter to the right picture! Click a letter first, then find its matching picture!");
  };

  const handleLeftSelect = (id: string) => {
    if (hasWon) return;
    sfx.playPop();
    setSelectedLetterId(id);

    // If we already have selected emoji, try matching
    if (selectedEmojiId) {
      evaluatePair(id, selectedEmojiId);
    }
  };

  const handleRightSelect = (id: string) => {
    if (hasWon) return;
    sfx.playPop();
    setSelectedEmojiId(id);

    // If we already have selected letter, try matching
    if (selectedLetterId) {
      evaluatePair(selectedLetterId, id);
    }
  };

  const evaluatePair = (letterId: string, emojiId: string) => {
    if (letterId === emojiId) {
      // Correct Match!
      sfx.playChime();
      
      const updatedLeft = leftCol.map((x) => (x.id === letterId ? { ...x, matched: true } : x));
      const updatedRight = rightCol.map((x) => (x.id === emojiId ? { ...x, matched: true } : x));
      
      setLeftCol(updatedLeft);
      setRightCol(updatedRight);
      setSelectedLetterId(null);
      setSelectedEmojiId(null);

      const nextScore = score + 1;
      setScore(nextScore);
      onStarsEarnt(2); // 2 stars per correct link

      const correctWord = ALPHABET_DATA.find((x) => x.letter === letterId)?.word || "";
      speak(`Excellent match! ${letterId} is for ${correctWord}!`);

      if (nextScore === 4) {
        setHasWon(true);
        sfx.playTada();
        onGameCompleted();
        onStarsEarnt(3); // extra bonus stars
      }
    } else {
      // Mismatch
      sfx.playError();
      setSelectedLetterId(null);
      setSelectedEmojiId(null);
      speak("Whoops, let's try a different pair!");
    }
  };

  return (
    <div id="game-letter-links" className="bg-white border-4 border-indigo-400 rounded-3xl p-6 max-w-lg mx-auto shadow-lg space-y-6">
      <div className="text-center">
        <span className="text-xs font-black uppercase tracking-widest text-indigo-500">Puzzle Game 1</span>
        <h3 className="text-2xl font-black text-slate-800">🧩 Letter Links!</h3>
        <p className="text-xs text-slate-400 font-bold mt-1">Tap the Letter, then tap its partner!</p>
      </div>

      {hasWon ? (
        <div className="text-center py-6 space-y-4">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
          <h4 className="text-2xl font-black text-indigo-600">PUZZLE COMPLETED!</h4>
          <p className="text-xs text-slate-500 font-bold">You earned +11 total stars!</p>
          <button
            id="btn-links-replay"
            onClick={initializeGame}
            className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Play Another Scramble!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-8 relative py-4">
          {/* Left Column: Letters */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase text-center">Letters</div>
            {leftCol.map((item) => (
              <button
                key={`left-${item.id}`}
                id={`links-left-${item.id}`}
                disabled={item.matched}
                onClick={() => handleLeftSelect(item.id)}
                className={`w-full p-4 rounded-2xl border-2 font-black font-sans text-2xl text-center flex items-center justify-center transition-all ${
                  item.matched
                    ? "bg-green-100 border-green-500 text-green-700 opacity-60"
                    : selectedLetterId === item.id
                    ? "bg-indigo-150 border-indigo-500 text-indigo-800 scale-102 shadow-md"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                }`}
              >
                {item.letter}
              </button>
            ))}
          </div>

          {/* Right Column: Scrambled Emojis */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-400 uppercase text-center">Pictures</div>
            {rightCol.map((item) => (
              <button
                key={`right-${item.id}`}
                id={`links-right-${item.id}`}
                disabled={item.matched}
                onClick={() => handleRightSelect(item.id)}
                className={`w-full p-4 rounded-2xl border-2 font-sans text-4xl text-center flex items-center justify-center transition-all ${
                  item.matched
                    ? "bg-green-100 border-green-500 text-green-700 opacity-60"
                    : selectedEmojiId === item.id
                    ? "bg-indigo-150 border-indigo-500 text-indigo-850 scale-102 shadow-md"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
                }`}
              >
                <span>{item.emoji}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* SUB GAME 2: POCKET MATCHING/DRAG-DROP SIMULATION */
function MatchToPocketSubGame({
  onGameCompleted,
  onStarsEarnt,
}: {
  onGameCompleted: () => void;
  onStarsEarnt: (stars: number) => void;
}) {
  const [targetLetter, setTargetLetter] = useState<AlphabetItem | null>(null);
  const [options, setOptions] = useState<AlphabetItem[]>([]);
  const [score, setScore] = useState(0);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Pick a target letter
    const target = ALPHABET_DATA[Math.floor(Math.random() * ALPHABET_DATA.length)];
    
    // Pick 3 refractors that don't match target
    const distractors = ALPHABET_DATA.filter((x) => x.letter !== target.letter)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const pool = [target, ...distractors].sort(() => 0.5 - Math.random());

    setTargetLetter(target);
    setOptions(pool);
    setScore(0);
    setHasWon(false);

    speak(`Help the cute pocket catch items! Tap which one starts with the letter... ${target.letter}!`);
  };

  const handlePickOption = (item: AlphabetItem) => {
    if (hasWon || !targetLetter) return;

    if (item.letter === targetLetter.letter) {
      // Win checkpoint
      sfx.playChime();
      setHasWon(true);
      onStarsEarnt(4); // Earn 4 stars on matching
      onGameCompleted();
      speak(`Correct! ${item.emoji} ${item.word} starts with ${targetLetter.letter}! You guided it safely into the pocket!`);
    } else {
      sfx.playError();
      speak(`Almost! That is the ${item.word}, which starts with ${item.letter}. Find the target starting with ${targetLetter.letter}!`);
    }
  };

  return (
    <div id="game-pockets" className="bg-white border-4 border-emerald-400 rounded-3xl p-6 max-w-lg mx-auto shadow-lg space-y-6">
      <div className="text-center">
        <span className="text-xs font-black uppercase tracking-widest text-emerald-500">Puzzle Game 2</span>
        <h3 className="text-2xl font-black text-slate-800">🧺 Match to Pocket</h3>
        <p className="text-xs text-slate-400 font-bold mt-1">Tap the item that belongs in the letter pocket!</p>
      </div>

      {hasWon && targetLetter ? (
        <div className="text-center py-6 space-y-4">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
          <h4 className="text-2xl font-black text-emerald-600">INTO THE POCKET!</h4>
          <p className="text-xs text-slate-500 font-bold">You earned +4 stars!</p>
          <button
            id="btn-pocket-replay"
            onClick={initializeGame}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Play Next Letter!
          </button>
        </div>
      ) : (
        targetLetter && (
          <div className="space-y-6 text-center">
            {/* The Big Letter Pocket */}
            <div className="flex justify-center flex-col items-center">
              <div className="w-28 h-28 rounded-full border-4 border-dashed border-emerald-400 flex items-center justify-center bg-emerald-50 relative">
                <span className="text-6xl font-black text-emerald-700 animate-pulse font-sans">
                  {targetLetter.letter}
                </span>
                <span className="absolute bottom-[-10px] bg-emerald-500 text-white font-black text-[10px] uppercase px-3 py-1 rounded-full border border-white">
                  Pocket
                </span>
              </div>
              <div className="text-sm font-bold text-slate-500 mt-4 leading-normal">
                Which object belongs in the <span className="text-emerald-600 font-black">"{targetLetter.letter}"</span> pocket?
              </div>
            </div>

            {/* Float items */}
            <div className="grid grid-cols-2 gap-4">
              {options.map((item, index) => (
                <button
                  key={index}
                  id={`pocket-option-${item.letter}`}
                  onClick={() => handlePickOption(item)}
                  className="p-5 bg-slate-50 border-2 border-slate-200 hover:border-emerald-300 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 transition-all cursor-pointer shadow-xs active:scale-95 group"
                >
                  <span className="text-5xl group-hover:scale-115 transition-transform duration-200">
                    {item.emoji}
                  </span>
                  <span className="font-bold text-slate-700 uppercase leading-none truncate w-full text-center text-xs">
                    {item.word}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}

/* SUB GAME 3: MEMORY MATCH CARD CARDS */
interface MemoryCard {
  uid: number;
  letter: string;
  emoji: string;
  isWord: boolean;
  value: string; // the common letter
  isFlipped: boolean;
  isMatched: boolean;
}

function MemorySubGame({
  onGameCompleted,
  onStarsEarnt,
}: {
  onGameCompleted: () => void;
  onStarsEarnt: (stars: number) => void;
}) {
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    // Pick 3 random letters for a 6-card grid
    const slice = [...ALPHABET_DATA]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);

    const generated: MemoryCard[] = [];
    slice.forEach((item, index) => {
      // Card 1: The letter
      generated.push({
        uid: index * 2,
        letter: item.letter,
        emoji: "",
        isWord: false,
        value: item.letter,
        isFlipped: false,
        isMatched: false,
      });
      // Card 2: The corresponding emoji
      generated.push({
        uid: index * 2 + 1,
        letter: item.letter,
        emoji: item.emoji,
        isWord: true,
        value: item.letter,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle
    generated.sort(() => 0.5 - Math.random());

    setCards(generated);
    setFlippedIndexes([]);
    setIsEvaluating(false);
    setIsDone(false);
    setTries(0);

    speak("Let's play Memory Game! Match the letter card with its picture partner!");
  };

  const handleFlip = (index: number) => {
    if (isEvaluating || isDone) return;
    const card = cards[index];
    if (card.isFlipped || card.isMatched) return;

    sfx.playPop();
    const updated = [...cards];
    updated[index].isFlipped = true;
    setCards(updated);

    const nextFlipped = [...flippedIndexes, index];
    setFlippedIndexes(nextFlipped);

    if (nextFlipped.length === 2) {
      setIsEvaluating(true);
      setTries((t) => t + 1);
      
      const first = cards[nextFlipped[0]];
      const second = cards[nextFlipped[1]];

      if (first.value === second.value) {
        // CorrectMatch
        setTimeout(() => {
          sfx.playChime();
          const matchedState = updated.map((c, i) => {
            if (i === nextFlipped[0] || i === nextFlipped[1]) {
              return { ...c, isMatched: true };
            }
            return c;
          });
          setCards(matchedState);
          setFlippedIndexes([]);
          setIsEvaluating(false);
          onStarsEarnt(2); // 2 stars

          const targetWord = ALPHABET_DATA.find((x) => x.letter === first.value)?.word || "";
          speak(`You found ${first.value} for ${targetWord}!`);

          // Check Win
          const allMatched = matchedState.every((c) => c.isMatched);
          if (allMatched) {
            setTimeout(() => {
              setIsDone(true);
              sfx.playTada();
              onGameCompleted();
              onStarsEarnt(4); // Extra stars
            }, 500);
          }
        }, 600);
      } else {
        // Misflip
        setTimeout(() => {
          sfx.playError();
          const resetState = updated.map((c, i) => {
            if (i === nextFlipped[0] || i === nextFlipped[1]) {
              return { ...c, isFlipped: false };
            }
            return c;
          });
          setCards(resetState);
          setFlippedIndexes([]);
          setIsEvaluating(false);
        }, 1200);
      }
    }
  };

  return (
    <div id="game-memory" className="bg-white border-4 border-rose-400 rounded-3xl p-6 max-w-lg mx-auto shadow-lg space-y-6">
      <div className="text-center">
        <span className="text-xs font-black uppercase tracking-widest text-rose-500">Puzzle Game 3</span>
        <h3 className="text-2xl font-black text-slate-800">🎴 Memory Card Match</h3>
        <p className="text-xs text-slate-400 font-bold mt-1">Flip cards to pair uppercase letters with pictures!</p>
      </div>

      {isDone ? (
        <div className="text-center py-6 space-y-4">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
          <h4 className="text-2xl font-black text-rose-600">PEERLESS MEMORY!</h4>
          <p className="text-xs text-slate-500 font-bold">You completed the map in {tries} tries & won +10 stars!</p>
          <button
            id="btn-memory-replay"
            onClick={initializeGame}
            className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Play Memory Again!
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 py-4">
          {cards.map((card, index) => {
            const isRevealed = card.isFlipped || card.isMatched;
            return (
              <button
                key={card.uid}
                id={`memory-card-${index}`}
                onClick={() => handleFlip(index)}
                className={`aspect-[3/4] rounded-2xl border-4 text-center flex items-center justify-center transition-all duration-300 relative overflow-hidden select-none outline-hidden ${
                  isRevealed
                    ? "bg-slate-50 border-rose-300 rotate-0 scale-100"
                    : "bg-rose-400 border-rose-600 cursor-pointer hover:bg-rose-500 hover:scale-102 rotate-2"
                }`}
              >
                {isRevealed ? (
                  card.isWord ? (
                    <span className="text-4xl">{card.emoji}</span>
                  ) : (
                    <span className="text-4xl font-extrabold font-sans text-rose-700">{card.letter}</span>
                  )
                ) : (
                  <div className="flex flex-col items-center">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                    <span className="text-[10px] font-black text-white/80 uppercase tracking-widest mt-1">ABC</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
