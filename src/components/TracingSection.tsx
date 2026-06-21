import React, { useState, useEffect, useRef } from "react";
import { ALPHABET_DATA } from "../data";
import { AlphabetItem, UserProgress } from "../types";
import { sfx, speak } from "../utils/audio";
import { Sparkles, Trash2, CheckCircle, Award, Star, RefreshCw } from "lucide-react";
import { motion } from "motion/react";

interface TracingSectionProps {
  progress: UserProgress;
  onLetterTraced: (letter: string, type: "uppercase" | "lowercase") => void;
  onStarsEarnt: (stars: number) => void;
}

interface Point {
  x: number;
  y: number;
}

// Simple mapped coordinates list for uppercase tracing targets (on a 200x200 canvas system)
const LETTER_WAYPOINTS_UPPER: { [key: string]: Point[] } = {
  A: [{ x: 100, y: 30 }, { x: 50, y: 160 }, { x: 150, y: 160 }, { x: 70, y: 100 }, { x: 130, y: 100 }],
  B: [{ x: 60, y: 30 }, { x: 60, y: 160 }, { x: 130, y: 65 }, { x: 60, y: 95 }, { x: 140, y: 130 }],
  C: [{ x: 140, y: 50 }, { x: 70, y: 50 }, { x: 60, y: 100 }, { x: 70, y: 150 }, { x: 140, y: 150 }],
  D: [{ x: 60, y: 30 }, { x: 60, y: 160 }, { x: 130, y: 40 }, { x: 140, y: 100 }, { x: 110, y: 160 }],
  E: [{ x: 140, y: 30 }, { x: 70, y: 30 }, { x: 70, y: 95 }, { x: 120, y: 95 }, { x: 70, y: 160 }, { x: 140, y: 160 }],
  F: [{ x: 140, y: 30 }, { x: 70, y: 30 }, { x: 70, y: 95 }, { x: 120, y: 95 }, { x: 70, y: 160 }],
  G: [{ x: 140, y: 50 }, { x: 70, y: 50 }, { x: 60, y: 100 }, { x: 140, y: 100 }, { x: 140, y: 140 }, { x: 100, y: 140 }],
  H: [{ x: 60, y: 30 }, { x: 60, y: 160 }, { x: 140, y: 30 }, { x: 140, y: 160 }, { x: 60, y: 95 }, { x: 140, y: 95 }],
  I: [{ x: 70, y: 30 }, { x: 130, y: 30 }, { x: 100, y: 30 }, { x: 100, y: 160 }, { x: 70, y: 160 }, { x: 130, y: 160 }],
  J: [{ x: 130, y: 30 }, { x: 100, y: 30 }, { x: 100, y: 140 }, { x: 70, y: 150 }, { x: 60, y: 120 }],
  K: [{ x: 70, y: 30 }, { x: 70, y: 160 }, { x: 140, y: 30 }, { x: 70, y: 100 }, { x: 140, y: 160 }],
  L: [{ x: 70, y: 30 }, { x: 70, y: 160 }, { x: 140, y: 160 }],
  M: [{ x: 50, y: 160 }, { x: 50, y: 30 }, { x: 100, y: 100 }, { x: 150, y: 30 }, { x: 150, y: 160 }],
  N: [{ x: 50, y: 160 }, { x: 50, y: 30 }, { x: 150, y: 160 }, { x: 150, y: 30 }],
  O: [{ x: 100, y: 30 }, { x: 50, y: 100 }, { x: 100, y: 170 }, { x: 150, y: 100 }],
  P: [{ x: 60, y: 160 }, { x: 60, y: 30 }, { x: 130, y: 30 }, { x: 130, y: 90 }, { x: 60, y: 90 }],
  Q: [{ x: 100, y: 30 }, { x: 50, y: 100 }, { x: 100, y: 160 }, { x: 150, y: 100 }, { x: 120, y: 120 }, { x: 150, y: 160 }],
  R: [{ x: 60, y: 160 }, { x: 60, y: 30 }, { x: 130, y: 35 }, { x: 130, y: 95 }, { x: 60, y: 95 }, { x: 140, y: 160 }],
  S: [{ x: 140, y: 50 }, { x: 80, y: 40 }, { x: 100, y: 95 }, { x: 130, y: 140 }, { x: 70, y: 150 }],
  T: [{ x: 60, y: 30 }, { x: 140, y: 30 }, { x: 100, y: 30 }, { x: 100, y: 160 }],
  U: [{ x: 60, y: 35 }, { x: 60, y: 130 }, { x: 100, y: 160 }, { x: 140, y: 130 }, { x: 140, y: 35 }],
  V: [{ x: 50, y: 30 }, { x: 100, y: 160 }, { x: 150, y: 30 }],
  W: [{ x: 40, y: 30 }, { x: 60, y: 160 }, { x: 100, y: 90 }, { x: 140, y: 160 }, { x: 160, y: 30 }],
  X: [{ x: 50, y: 30 }, { x: 150, y: 160 }, { x: 150, y: 30 }, { x: 50, y: 160 }],
  Y: [{ x: 50, y: 30 }, { x: 100, y: 100 }, { x: 150, y: 30 }, { x: 100, y: 160 }],
  Z: [{ x: 50, y: 40 }, { x: 150, y: 40 }, { x: 50, y: 160 }, { x: 150, y: 160 }]
};

export default function TracingSection({
  progress,
  onLetterTraced,
  onStarsEarnt,
}: TracingSectionProps) {
  const [activeLetter, setActiveLetter] = useState<AlphabetItem>(ALPHABET_DATA[0]);
  const [traceType, setTraceType] = useState<"uppercase" | "lowercase">("uppercase");
  const [isCompleted, setIsCompleted] = useState(false);
  const [rainbowMode, setRainbowMode] = useState(true);

  // Active check-off index mapping
  const [visitedWaypoints, setVisitedWaypoints] = useState<boolean[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);

  // Load points for the current configuration
  const currentWaypoints: Point[] = LETTER_WAYPOINTS_UPPER[activeLetter.letter] || [
    { x: 100, y: 30 },
    { x: 50, y: 100 },
    { x: 50, y: 160 },
    { x: 150, y: 160 }
  ];

  // Adjust waypoints slightly for lowercase mode if selected
  const adjustedWaypoints = currentWaypoints.map(pt => {
    if (traceType === "lowercase") {
      // Scale down and shift right/down slightly for standard lowercase shape
      return {
        x: Math.round(pt.x * 0.75 + 30),
        y: Math.round(pt.y * 0.75 + 50)
      };
    }
    return pt;
  });

  useEffect(() => {
    setVisitedWaypoints(new Array(adjustedWaypoints.length).fill(false));
    setIsCompleted(false);
    clearCanvas();
  }, [activeLetter, traceType]);

  useEffect(() => {
    speak(`Let's trace the letter ${activeLetter.letter}!`);
  }, [activeLetter]);

  // Handle canvas drawing on start
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setVisitedWaypoints(new Array(adjustedWaypoints.length).fill(false));
    setIsCompleted(false);
  };

  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    // Map precisely to internal resolution (200x200 standard internal width/height)
    return {
      x: ((clientX - rect.left) / rect.width) * canvas.width,
      y: ((clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    lastPointRef.current = pt;
    checkWaypointHit(pt);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current || isCompleted) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentPt = getCanvasCoords(e);
    const lastPt = lastPointRef.current || currentPt;

    ctx.beginPath();
    ctx.moveTo(lastPt.x, lastPt.y);
    ctx.lineTo(currentPt.x, currentPt.y);

    // Line styles for toddler
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (rainbowMode) {
      // Multi-hue stroke based on average position
      const hue = Math.round((currentPt.x + currentPt.y) % 360);
      ctx.strokeStyle = `hsl(${hue}, 95%, 60%)`;
    } else {
      ctx.strokeStyle = "#10b981"; // solid green
    }

    ctx.stroke();
    lastPointRef.current = currentPt;

    // Check hit boxes
    checkWaypointHit(currentPt);
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const checkWaypointHit = (pt: Point) => {
    if (isCompleted) return;

    const tolerance = 24; // Reach radius
    let updated = [...visitedWaypoints];
    let changed = false;

    adjustedWaypoints.forEach((wp, index) => {
      // Measure Euclidean distance
      const dist = Math.sqrt(Math.pow(pt.x - wp.x, 2) + Math.pow(pt.y - wp.y, 2));
      if (dist < tolerance && !updated[index]) {
        updated[index] = true;
        changed = true;
        sfx.playPop();
      }
    });

    if (changed) {
      setVisitedWaypoints(updated);
      // Verify if all checkpoints are satisfied
      const allDone = updated.every(x => x === true);
      if (allDone) {
        setIsCompleted(true);
        sfx.playChime();
        speak(`Awesome job! You fully traced ${activeLetter.letter}!`);
        onLetterTraced(activeLetter.letter, traceType);
        onStarsEarnt(3); // Earn 3 stars for full physical trace!
      }
    }
  };

  const handleSelectLetter = (item: AlphabetItem) => {
    sfx.playPop();
    setActiveLetter(item);
  };

  return (
    <div id="tracing-section" className="space-y-6">
      <div className="bg-emerald-100 border-2 border-emerald-300 rounded-3xl p-5 text-center shadow-sm relative overflow-hidden">
        <h2 className="text-xl md:text-3xl font-sans font-bold text-emerald-800 flex items-center justify-center gap-2">
          ✍️ Alphabet Magic Tracing!
        </h2>
        <p className="text-emerald-700 text-sm md:text-base mt-2 font-medium">
          Drape your finger or mouse over the yellow star waypoints in order to write the letter!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Side: scrollable letters */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 max-h-[440px] overflow-y-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Choose Letter:</span>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-2 gap-2">
            {ALPHABET_DATA.map((item) => {
              const uppercaseDone = progress.tracingProgress[item.letter]?.uppercase;
              const lowercaseDone = progress.tracingProgress[item.letter]?.lowercase;
              const isActive = activeLetter.letter === item.letter;
              return (
                <button
                  key={item.letter}
                  id={`trace-letter-chip-${item.letter}`}
                  onClick={() => handleSelectLetter(item)}
                  className={`py-3 px-2 rounded-2xl border-2 font-bold font-sans flex flex-col items-center justify-center transition-all cursor-pointer ${
                    isActive
                      ? `${item.color} ${item.borderColor} text-white shadow-md scale-105`
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="text-lg">{item.letter}{item.letter.toLowerCase()}</span>
                  <div className="flex gap-1 mt-1">
                    {(uppercaseDone || lowercaseDone) ? (
                      <span className="text-[9px] bg-amber-400 text-amber-950 px-1 py-0.5 rounded-sm flex items-center gap-0.5">
                        ⭐ {(uppercaseDone ? 1 : 0) + (lowercaseDone ? 1 : 0)}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center: Tracing Stage */}
        <div className="lg:col-span-2 flex flex-col items-center">
          {/* Settings / Controls */}
          <div className="flex gap-2 mb-4 w-full justify-between items-center">
            {/* Toggle Upper/Lower */}
            <div className="bg-slate-100 border border-slate-200 p-1 rounded-2xl flex">
              <button
                id="btn-trace-uppercase"
                onClick={() => {
                  sfx.playPop();
                  setTraceType("uppercase");
                }}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
                  traceType === "uppercase"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                UPPER (A)
              </button>
              <button
                id="btn-trace-lowercase"
                onClick={() => {
                  sfx.playPop();
                  setTraceType("lowercase");
                }}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition-all ${
                  traceType === "lowercase"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                lower (a)
              </button>
            </div>

            {/* Rainbow / Solid switch */}
            <button
              id="btn-trace-rainbow-mode"
              onClick={() => {
                sfx.playPop();
                setRainbowMode(!rainbowMode);
              }}
              className={`px-3 py-2 font-bold text-xs rounded-full border ${
                rainbowMode ? "bg-purple-100 border-purple-300 text-purple-700" : "bg-slate-100 text-slate-600"
              }`}
            >
              🌈 {rainbowMode ? "Rainbow Brush" : "Green Brush"}
            </button>
          </div>

          {/* Interactive Draw Frame */}
          <div 
            ref={containerRef}
            className="relative bg-amber-50 rounded-3xl border-8 border-amber-300 shadow-xl overflow-hidden aspect-square w-full max-w-[340px]"
          >
            {/* Guide letter rendered behind */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none opacity-15">
              <span className="text-[240px] font-black font-sans text-stone-800">
                {traceType === "uppercase" ? activeLetter.letter : activeLetter.letter.toLowerCase()}
              </span>
            </div>

            {/* Helper Guideline drawing trace */}
            <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
              <span className="text-[220px] font-bold font-sans text-stone-300/60 stroke-2 border-dashed border-stone-300">
                {traceType === "uppercase" ? activeLetter.letter : activeLetter.letter.toLowerCase()}
              </span>
            </div>

            {/* Core Interaction Canvas */}
            <canvas
              ref={canvasRef}
              width={200}
              height={200}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute inset-0 w-full h-full cursor-url z-10 touch-none"
            />

            {/* Stars checkpoints list rendered above canvas */}
            {adjustedWaypoints.map((pt, index) => {
              const isHit = visitedWaypoints[index];
              return (
                <div
                  key={index}
                  style={{
                    left: `${(pt.x / 200) * 100}%`,
                    top: `${(pt.y / 200) * 100}%`,
                  }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                >
                  <motion.div
                    animate={isHit ? { scale: [1, 1.4, 1], rotate: 360 } : { scale: [1, 1.1, 1] }}
                    transition={isHit ? { duration: 0.3 } : { repeat: Infinity, duration: 1.5 }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs border bg-white ${
                      isHit
                        ? "border-green-500 text-white shadow-md bg-green-500"
                        : "border-yellow-400 text-yellow-600 shadow-sm"
                    }`}
                  >
                    {isHit ? (
                      <Star className="w-4 h-4 text-white fill-white" />
                    ) : (
                      index + 1
                    )}
                  </motion.div>
                </div>
              );
            })}

            {/* Completion Golden Overlay Screen */}
            {isCompleted && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center text-white z-30 p-4 text-center select-none"
              >
                <div className="flex gap-2">
                  <Star className="w-8 h-8 text-yellow-300 fill-yellow-300 animate-bounce" />
                  <Star className="w-10 h-10 text-yellow-300 fill-yellow-300 animate-bounce delay-100" />
                  <Star className="w-8 h-8 text-yellow-300 fill-yellow-300 animate-bounce delay-200" />
                </div>
                <h3 className="text-2xl font-black mt-2">MAGICAL TRACE!</h3>
                <p className="text-sm font-semibold opacity-90 mt-1">Excellent tracing of current letter!</p>
                <div className="mt-4 flex gap-2">
                  <button
                    id="btn-trace-again"
                    onClick={clearCanvas}
                    className="px-4 py-2 bg-white text-emerald-800 hover:bg-slate-100 font-bold rounded-2xl shadow-md text-xs transition-all cursor-pointer"
                  >
                    Trace Again
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              id="btn-clear-trace"
              onClick={clearCanvas}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold border rounded-2xl text-xs cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4" /> Clear Canvas
            </button>
          </div>
        </div>

        {/* Right Side: Visual rewards panel */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 shadow-sm space-y-4 text-center">
          <div className="text-sm font-black text-slate-500 uppercase tracking-wider">Your Traced Progress</div>
          <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-200 flex flex-col items-center gap-2">
            <Award className="w-12 h-12 text-amber-500" />
            <div className="text-lg font-extrabold text-amber-900">
              {Object.keys(progress.tracingProgress).length} / 26 Traced
            </div>
            <div className="text-xs text-amber-700 font-medium font-sans">
              Earn 3 stars per completed letter tracing to unlock amazing badges!
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl relative overflow-hidden">
            <div className="text-4xl">{activeLetter.emoji}</div>
            <div className="text-left">
              <h4 className="font-extrabold text-slate-800 text-sm">Target Word</h4>
              <p className="text-xs text-slate-500 font-bold">{activeLetter.word}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
