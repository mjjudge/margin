export type PracticeMode =
  | 'focus'
  | 'open'
  | 'somatic'
  | 'relational'
  | 'perception';

export interface Practice {
  id: string;
  title: string;
  instruction: string;
  mode: PracticeMode;
  difficulty: number; // 1..5
  duration_seconds?: number;
  contra_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PracticeSession {
  id: string;
  practice_id: string;
  started_at: string;
  completed_at?: string;
  status: 'started' | 'completed' | 'abandoned';
  user_rating?: 'easy' | 'neutral' | 'hard';
  notes?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type MeaningCategory =
  | 'meaningful'
  | 'joyful'
  | 'painful_significant'
  | 'empty_numb';

export interface MeaningEntry {
  id: string;
  category: MeaningCategory;
  text?: string;
  tags: string[];
  time_of_day?: 'morning' | 'afternoon' | 'evening' | 'night';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}
