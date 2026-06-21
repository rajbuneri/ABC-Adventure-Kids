/**
 * abc-adventure-kids sound synthesizer & TTS utils
 * Synthesizes retro tones and chimes using vanilla Web Audio API. Pure client-side, zero assets, offline-ready!
 */

// Simple synthesizer engine
class SoundEffects {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  playPop() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.error(e);
    }
  }

  playChime() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      
      notes.forEach((freq, index) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.0, now + index * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, now + index * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.25);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.3);
      });
    } catch (e) {
      console.error(e);
    }
  }

  playError() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);
    } catch (e) {
      console.error(e);
    }
  }

  playTada() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      // Arpeggio leading to a rich chord
      const steps = [349.23, 440.00, 523.25, 659.25, 880.00]; // F, A, C, E, A
      steps.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);

        gain.gain.setValueAtTime(0, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.06 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.06 + 0.65);

        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.7);
      });
    } catch (e) {
      console.error(e);
    }
  }
}

export const sfx = new SoundEffects();

// Browser TTS helper
let currentUtterance: SpeechSynthesisUtterance | null = null;
let lastSpokenText: string = "";

export function speak(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) {
    console.warn("Speech Synthesis is not supported in this browser.");
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel(); // Stop talking immediately if we tapped something else

  // Re-enable TTS after a tiny buffer
  setTimeout(() => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      
      // Auto-detect a bright and friendly girl's English voice
      const voices = window.speechSynthesis.getVoices();
      
      // List of indicator substrings in lower case for female/girl voice names
      const femaleIndicators = [
        "female", "girl", "woman", "samantha", "zira", "victoria", "hazel", 
        "siri", "susan", "karen", "moira", "fiona", "tessa", "veena", "kathy",
        "google us english", "google uk english female", "microsoft zira"
      ];

      // Score each English voice for how well it fits a cheerful, high-quality girl voice
      const englishVoices = voices.filter(v => v.lang.toLowerCase().startsWith("en"));
      
      let bestVoice = englishVoices[0] || null;
      let topScore = -1;

      for (const voice of englishVoices) {
        let score = 0;
        const nameLower = voice.name.toLowerCase();
        
        // Boost if explicitly female sound name
        for (const indicator of femaleIndicators) {
          if (nameLower.includes(indicator)) {
            score += 50;
            break;
          }
        }

        // Boost Google and Natural voices as they sound much more human and clear
        if (nameLower.includes("google") || nameLower.includes("natural")) {
          score += 20;
        }

        // Prefer US, UK, and Australian accents for clear standard pronunciations
        if (voice.lang.toLowerCase().startsWith("en-us") || voice.lang.toLowerCase().startsWith("en-gb") || voice.lang.toLowerCase().startsWith("en-au")) {
          score += 10;
        }

        if (score > topScore) {
          topScore = score;
          bestVoice = voice;
        }
      }
      
      if (bestVoice) {
        u.voice = bestVoice;
      }
      
      u.rate = 0.85; // Natural speed, highly understandable for children
      u.pitch = 1.45; // Enhanced pitch representing a bright, cheerful, child-friendly girl voice

      u.onend = () => {
        if (onEnd) onEnd();
      };
      
      u.onerror = (e) => {
        console.error("Speech Synthesis Error:", e);
        if (onEnd) onEnd();
      };

      currentUtterance = u;
      lastSpokenText = text;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error("Speech Synthesis initiation crashed:", e);
      if (onEnd) onEnd();
    }
  }, 30);
}

// Stop any speaking audio
export function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
