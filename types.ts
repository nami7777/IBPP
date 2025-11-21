
export type PaperType = 'Paper 1' | 'Paper 2/1-b';
export type ExamMonth = 'May' | 'November' | 'Unknown';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface QuestionPart {
  id: string;
  label: string; // e.g., "a", "b", "i"
  questionImage: string | null; // Base64 string
  answerImage: string | null; // Base64 string
}

export interface Question {
  id: string;
  createdAt: number;
  // Metadata
  keywords: string[];
  topics: string[]; // Syllabus topics e.g. "D.1"
  difficulty: Difficulty;
  year: number | 'Unknown';
  month: ExamMonth;
  questionNumber: string;
  paperType: PaperType;
  
  // Paper 1 Specifics
  p1QuestionImage?: string | null;
  p1AnswerType?: 'Selection' | 'Image';
  p1AnswerSelection?: 'A' | 'B' | 'C' | 'D' | null;
  p1AnswerImage?: string | null;

  // Paper 2 Specifics
  parts?: QuestionPart[];
}

export interface FilterState {
  includedKeywords: string[];
  excludedKeywords: string[];
  includedTopics: string[];
  excludedTopics: string[];
  year: number | 'All' | 'Unknown';
  paperType: PaperType | 'All';
  difficulty: Difficulty | 'All';
  searchQuery: string;
}
