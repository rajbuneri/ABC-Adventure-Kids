export interface AlphabetItem {
  letter: string;
  word: string;
  emoji: string;
  color: string; // Tailwind background color for themes
  borderColor: string;
  textColor: string;
  bgLight: string;
  fact: string;
}

export interface QuizScore {
  score: number;
  total: number;
  date: string;
}

export interface UserProgress {
  learnedLetters: string[]; // List of letters tapped/audio played
  quizScores: QuizScore[];
  tracingProgress: {
    [letter: string]: {
      uppercase: boolean;
      lowercase: boolean;
      stars: number;
    };
  };
  unlockedBadges: string[];
  stars: number;
  dailyTimeMs: number;
  lastActiveDate: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  emoji: string;
  requirement: string;
}
