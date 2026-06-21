import React, { useState } from "react";
import { BADGES } from "../data";
import { UserProgress } from "../types";
import { sfx, speak } from "../utils/audio";
import { Star, Award, Sparkles, Check, Lock, AlertCircle, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RewardsSectionProps {
  progress: UserProgress;
}

interface PlacedSticker {
  id: number;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

export default function RewardsSection({ progress }: RewardsSectionProps) {
  const [stickersList, setStickersList] = useState<string[]>(["🍎", "⚽", "🐱", "🐶", "🐘", "🐠", "🍇", "🦁", "🐵", "👑", "⭐", "🦄", "🧸"]);
  const [selectedSticker, setSelectedSticker] = useState<string | null>(null);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);

  const handlePlaceSticker = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedSticker) return;

    sfx.playPop();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newSticker: PlacedSticker = {
      id: Date.now(),
      emoji: selectedSticker,
      x,
      y,
      size: Math.floor(Math.random() * 20) + 40, // random kids sticker style
    };

    setPlacedStickers((prev) => [...prev, newSticker]);
  };

  const clearStickers = () => {
    sfx.playPop();
    setPlacedStickers([]);
  };

  const handleBadgeClick = (badge: any, isUnlocked: boolean) => {
    sfx.playPop();
    if (isUnlocked) {
      speak(`Awesome! You unlocked the ${badge.title} badge! ${badge.description}`);
    } else {
      speak(`This is the ${badge.title} badge! You can unlock it by: ${badge.requirement}.`);
    }
  };

  return (
    <div id="rewards-section" className="space-y-8">
      {/* Stars Header indicator */}
      <div className="bg-gradient-to-r from-amber-400 to-yellow-300 border-4 border-yellow-400 rounded-3xl p-6 text-center text-slate-800 shadow-lg relative overflow-hidden">
        <div className="absolute top-2 left-4 text-slate-950 font-sans font-black flex items-center gap-1.5 bg-white/40 backdrop-blur-xs px-4 py-1.5 rounded-full border">
          <Star className="w-5 h-5 fill-amber-500 text-amber-500 animate-spin" />
          <span>{progress.stars} Total Stars</span>
        </div>

        <div className="py-4 space-y-1">
          <div className="text-4xl">👑</div>
          <h2 className="text-2xl md:text-4xl font-sans font-black tracking-tight text-amber-950 uppercase">
            Sticker Book & Badges!
          </h2>
          <p className="text-amber-900 font-bold text-sm md:text-base">
            Earn stars through tracing, quizzes, and games to unlock stickers and build your magical playground board!
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left column: Unlocked Badges list */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-6 space-y-4">
          <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
            🏆 Badge Cabinet ({progress.unlockedBadges.length} / {BADGES.length})
          </h3>
          <p className="text-xs text-slate-500 font-bold">Tap on any badge to hear how to claim it!</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BADGES.map((badge) => {
              const isUnlocked = progress.unlockedBadges.includes(badge.id);
              return (
                <button
                  key={badge.id}
                  id={`badge-card-${badge.id}`}
                  onClick={() => handleBadgeClick(badge, isUnlocked)}
                  className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left relative overflow-hidden cursor-pointer ${
                    isUnlocked
                      ? "bg-white border-yellow-300 hover:border-yellow-400 shadow-sm"
                      : "bg-slate-100 border-slate-200 opacity-60"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-3xl shadow-inner ${isUnlocked ? 'bg-amber-100' : 'bg-slate-200'}`}>
                    {badge.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-sm text-slate-800 truncate uppercase tracking-tight">{badge.title}</h4>
                    <p className="text-[10px] text-slate-500 font-bold leading-normal">{badge.description}</p>
                  </div>
                  
                  {isUnlocked ? (
                    <span 
                      id={`badge-unlocked-tick-${badge.id}`}
                      className="absolute top-2 right-2 bg-green-500 rounded-full p-0.5"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </span>
                  ) : (
                    <span 
                      id={`badge-locked-padlock-${badge.id}`}
                      className="absolute top-2 right-2 p-0.5 text-slate-400"
                    >
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right column: Interactive Sticker book Board */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
              🎨 Interactive Sticker Board!
            </h3>
            <p className="text-xs text-slate-400 font-bold leading-normal">
              Select a sticker below, then tape anywhere inside the board to stick its design!
            </p>
          </div>

          {/* Sticker Palette select list */}
          <div className="flex flex-wrap gap-2 py-2 border-b border-dashed border-slate-200">
            {stickersList.map((stk) => {
              const isActive = selectedSticker === stk;
              return (
                <button
                  key={stk}
                  id={`sticker-pallet-item-${stk}`}
                  onClick={() => {
                    sfx.playPop();
                    setSelectedSticker(stk);
                  }}
                  className={`w-10 h-10 rounded-full text-2xl flex items-center justify-center hover:scale-115 transition-all scroll-smooth cursor-pointer border ${
                    isActive ? "bg-amber-100 border-amber-400 scale-110 shadow-md" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  {stk}
                </button>
              );
            })}
          </div>

          {/* Placement Board Canvas */}
          <div
            onClick={handlePlaceSticker}
            className={`h-64 rounded-2xl border-2 border-dashed border-slate-300 relative overflow-hidden ${
              selectedSticker ? "bg-amber-50/50 cursor-crosshair hover:bg-amber-50" : "bg-slate-100/50"
            }`}
          >
            {placedStickers.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center select-none pointer-events-none">
                <Sparkles className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Your Sticker Board is Empty!
                </span>
                <p className="text-[10px] text-slate-400 font-bold mt-1">
                  Choose a sticker from the list above and stick it here!
                </p>
              </div>
            ) : (
              placedStickers.map((stk) => (
                <div
                  key={stk.id}
                  style={{
                    left: `${stk.x}px`,
                    top: `${stk.y}px`,
                    fontSize: `${stk.size}px`,
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-scaleUp cursor-default select-none transition-transform hover:scale-110"
                >
                  {stk.emoji}
                </div>
              ))
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] font-black italic text-slate-400">
              * Stickers are kept locally for this learning sandbox!
            </span>
            <button
              id="btn-sticker-clear"
              onClick={clearStickers}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border rounded-xl font-bold text-slate-600 text-[11px] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Stickers
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
