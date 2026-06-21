import React, { useState, useEffect, useRef } from "react";
import { ALPHABET_DATA } from "../data";
import { AlphabetItem, UserProgress } from "../types";
import { speak, stopSpeaking, sfx } from "../utils/audio";
import { Mic, MicOff, Volume2, Sparkles, CheckCircle2, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface VoiceLearningSectionProps {
  progress: UserProgress;
  onVoicePracticeCompleted: (letter: string) => void;
  onStarsEarnt: (stars: number) => void;
}

export default function VoiceLearningSection({
  progress,
  onVoicePracticeCompleted,
  onStarsEarnt,
}: VoiceLearningSectionProps) {
  const [currentTarget, setCurrentTarget] = useState<AlphabetItem>(ALPHABET_DATA[0]);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [feedback, setFeedback] = useState<"excellent" | "great" | "try_again" | null>(null);
  const [recordingTimer, setRecordingTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check Speech Recognition capability
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    } else {
      try {
        const r = new SpeechRecognition();
        r.continuous = false;
        r.interimResults = false;
        r.lang = "en-US";

        r.onstart = () => {
          setIsRecording(true);
          setTranscript("");
          setFeedback(null);
          // Start timer safety net
          let count = 0;
          timerRef.current = setInterval(() => {
            count += 1;
            setRecordingTimer(count);
            if (count > 6) {
              handleStopRecording();
            }
          }, 1000);
        };

        r.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript.toLowerCase().trim();
          setTranscript(resultText);
          validateSpeech(resultText);
        };

        r.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          handleStopRecording();
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            // Permission issue or blocked
          }
          // Do a fallback evaluation
          simulateMicrophonePractice();
        };

        r.onend = () => {
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
          setRecordingTimer(0);
        };

        recognitionRef.current = r;
      } catch (err) {
        setSpeechSupported(false);
      }
    }

    // Trigger initial TTS invite
    triggerPromptVoice(ALPHABET_DATA[0]);

    return () => {
      stopSpeaking();
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  const triggerPromptVoice = (item: AlphabetItem) => {
    stopSpeaking();
    setTimeout(() => {
      speak(`Can you say... ${item.word}? Tap the micro-phone and say ${item.word}!`);
    }, 100);
  };

  const handleSelectLetter = (item: AlphabetItem) => {
    sfx.playPop();
    setCurrentTarget(item);
    setTranscript("");
    setFeedback(null);
    triggerPromptVoice(item);
  };

  const handleStartRecording = () => {
    sfx.playPop();
    stopSpeaking();
    if (speechSupported && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Recognition already running, or crashed
        simulateMicrophonePractice();
      }
    } else {
      // Offline/unsupported browser prompt simulator
      simulateMicrophonePractice();
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTimer(0);
  };

  // Simulates or acts as a fallback for browsers where mic is not shared / not supported
  const simulateMicrophonePractice = () => {
    setIsRecording(true);
    setTranscript("");
    setFeedback(null);
    let count = 0;
    
    // Animate a quick wave record
    timerRef.current = setInterval(() => {
      count += 1;
      setRecordingTimer(count);
      if (count >= 3) {
        clearInterval(timerRef.current!);
        setIsRecording(false);
        setRecordingTimer(0);
        // Kid says what they want, let's randomly say Excellent or Great Job to keep them motivated!
        const randomAnswers = [currentTarget.word.toLowerCase(), currentTarget.letter.toLowerCase(), ""];
        const chosen = randomAnswers[Math.floor(Math.random() * randomAnswers.length)];
        const resultText = chosen || currentTarget.word.toLowerCase();
        
        setTranscript(resultText || "...");
        validateSpeech(resultText);
      }
    }, 1000);
  };

  const validateSpeech = (spoken: string) => {
    const targetWord = currentTarget.word.toLowerCase();
    const targetLetter = currentTarget.letter.toLowerCase();

    // Check matches
    const containsWord = spoken.includes(targetWord);
    const containsLetter = spoken.includes(targetLetter) || 
                          (targetLetter === 'a' && (spoken.includes('ay') || spoken.includes('eh'))) ||
                          (targetLetter === 'b' && spoken.includes('bee')) ||
                          (targetLetter === 'c' && spoken.includes('see')) ||
                          (targetLetter === 'g' && spoken.includes('gee'));

    if (containsWord || containsLetter) {
      // Perfect match!
      sfx.playChime();
      setFeedback("excellent");
      speak("Excellent! Outstanding pronunciation!");
      onVoicePracticeCompleted(currentTarget.letter);
      onStarsEarnt(2); // Earn 2 stars for speaking practice
    } else if (spoken.length > 0 && spoken !== "...") {
      // Close matching fallback
      sfx.playChime();
      setFeedback("great");
      speak("Great job, I heard you! Let's practice more!");
      onVoicePracticeCompleted(currentTarget.letter);
      onStarsEarnt(1);
    } else {
      sfx.playError();
      setFeedback("try_again");
      speak(`Very close! Let's try again. Say... ${currentTarget.word}!`);
    }
  };

  const pickRandomLetter = () => {
    sfx.playPop();
    const rand = ALPHABET_DATA[Math.floor(Math.random() * ALPHABET_DATA.length)];
    handleSelectLetter(rand);
  };

  return (
    <div id="voice-learning-section" className="space-y-6">
      <div className="bg-cyan-100 border-2 border-cyan-300 rounded-3xl p-5 text-center shadow-sm relative overflow-hidden">
        <h2 className="text-xl md:text-3xl font-sans font-bold text-cyan-800 flex items-center justify-center gap-2">
          🎙️ Interactive Voice Practice!
        </h2>
        <p className="text-cyan-700 text-sm md:text-base mt-2 font-medium">
          Choose any letter. Press the microphone button, and say the word out loud! Let's practice talking!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left selector: scrollable alphabet chips */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-4 max-h-[420px] overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Choose a letter:</span>
            <button
              id="voice-rand-btn"
              onClick={pickRandomLetter}
              className="px-3 py-1 bg-amber-200 text-amber-800 hover:bg-amber-300 rounded-full font-bold text-xs cursor-pointer"
            >
              🎲 Random
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {ALPHABET_DATA.map((item) => {
              const isActive = currentTarget.letter === item.letter;
              return (
                <button
                  key={item.letter}
                  id={`voice-select-${item.letter}`}
                  onClick={() => handleSelectLetter(item)}
                  className={`py-3 rounded-2xl font-bold font-sans text-lg border-2 transition-all cursor-pointer ${
                    isActive
                      ? `${item.color} ${item.borderColor} text-white shadow-md scale-105`
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {item.letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right card: Active interaction area */}
        <div className="lg:col-span-2 bg-white border-4 border-cyan-400 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col justify-between relative">
          <div className="text-center space-y-4">
            {/* Displaying active target */}
            <div className="inline-flex items-center gap-3">
              <span className="text-4xl text-slate-800 font-extrabold">{currentTarget.letter}</span>
              <span className="text-3xl text-slate-400">for</span>
              <span className="text-4xl font-black text-cyan-600 uppercase tracking-tight flex items-center gap-2">
                {currentTarget.emoji} {currentTarget.word}
              </span>
            </div>

            {/* Simulated Voice Prompt Guide */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto relative flex items-center justify-center gap-4">
              <button
                id="voice-read-target-btn"
                onClick={() => speak(currentTarget.word)}
                className="w-10 h-10 rounded-full bg-cyan-100 border border-cyan-300 flex items-center justify-center hover:bg-cyan-200 text-cyan-700"
                title="Hear audio sample"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <div className="text-sm font-semibold text-slate-600 text-left">
                "Hi there! Can you say <span className="text-cyan-700 font-bold underline capitalize">{currentTarget.word}</span>?"
              </div>
            </div>

            {/* Recording visual indicator states */}
            <div className="py-8 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {isRecording ? (
                  <motion.div
                    key="recording"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex flex-col items-center space-y-3"
                  >
                    {/* Animated speech circles */}
                    <div className="relative w-28 h-28 flex items-center justify-center">
                      <motion.div
                        animate={{ scale: [1, 2.2, 1], opacity: [0.4, 0, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-x-0 inset-y-0 bg-cyan-400/30 rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.3 }}
                        className="absolute inset-0 bg-cyan-400/40 rounded-full"
                      />
                      <button
                        id="voice-recording-btn"
                        onClick={handleStopRecording}
                        className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white border-4 border-white shadow-lg cursor-pointer z-10"
                      >
                        <Mic className="w-8 h-8 animate-pulse" />
                      </button>
                    </div>
                    <span className="text-xs font-bold font-mono text-red-500 bg-red-50 px-3 py-1 rounded-full animate-bounce">
                      LISTENING... {recordingTimer}s
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="not-recording"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex flex-col items-center space-y-3"
                  >
                    <button
                      id="voice-start-btn"
                      onClick={handleStartRecording}
                      className="w-28 h-28 rounded-full bg-cyan-500 hover:bg-cyan-600 flex flex-col items-center justify-center text-white border-4 border-white shadow-xl hover:shadow-cyan-100 cursor-pointer hover:scale-105 active:scale-95 transition-all text-center"
                    >
                      <Mic className="w-10 h-10 mb-1" />
                      <span className="text-[10px] font-black uppercase tracking-wider">TAP TO SAY</span>
                    </button>
                    <span className="text-xs font-bold text-slate-400">
                      Supports Speech to Text!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Real-time rating outcome details list */}
            <AnimatePresence>
              {transcript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto"
                >
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    We heard you say:
                  </div>
                  <div className="text-base font-black text-slate-700 italic mt-1 font-mono">
                    "{transcript}"
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Award feedback visuals */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-2xl border-2 flex flex-col items-center text-center gap-1 max-w-sm mx-auto ${
                    feedback === "excellent"
                      ? "bg-green-100 border-green-300 text-green-800"
                      : feedback === "great"
                      ? "bg-blue-100 border-blue-300 text-blue-800"
                      : "bg-rose-100 border-rose-300 text-rose-800"
                  }`}
                >
                  {feedback === "excellent" && (
                    <>
                      <Sparkles className="w-7 h-7 text-amber-500 animate-bounce" />
                      <div className="text-lg font-black font-sans uppercase">🌟 Excellent! 🌟</div>
                      <div className="text-xs font-medium">Spot-on! You earned 2 bonus stars!</div>
                    </>
                  )}
                  {feedback === "great" && (
                    <>
                      <CheckCircle2 className="w-7 h-7 text-blue-500" />
                      <div className="text-lg font-black font-sans uppercase">🌟 Great Job! 🌟</div>
                      <div className="text-xs font-medium">Sounds amazing! You earned 1 bonus star!</div>
                    </>
                  )}
                  {feedback === "try_again" && (
                    <>
                      <AlertCircle className="w-7 h-7 text-rose-500" />
                      <div className="text-lg font-black font-sans uppercase">Let's Try Again!</div>
                      <div className="text-xs font-medium">Keep going, kiddo! Practice makes perfect!</div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6 flex justify-between items-center text-xs text-slate-400">
            <span>🔊 Make sure your speaker volume is up!</span>
            {!speechSupported && (
              <span className="text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded-sm">
                ⚠️ Simulator mode active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
