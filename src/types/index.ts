export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  answer: string;
  options: string[];
  explanation?: string;
}

export type QuestionType = '单选题' | '多选题' | '判断题' | '填空题';

export interface QuestionRange {
  start: number;
  end: number;
}

export interface QuizSettings {
  mode: 'quiz' | 'review' | 'recite' | 'exam';
  orderMode: 'sequential' | 'random';
  limit: number;
  judgementTrue: string;
  judgementFalse: string;
  questionRanges: QuestionRange[];
  useCustomRanges: boolean;
}

export interface ExamConfig {
  questionType: string;
  count: number;
  score: number;
  questionRanges: QuestionRange[];
  useCustomRanges: boolean;
}

export interface ExamSettings {
  configs: ExamConfig[];
  totalScore: number;
  totalQuestions: number;
}

export interface HeaderMapping {
  question: string;
  type: string;
  answer: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  optionE?: string;
  optionF?: string;
  explanation?: string;
}

// 新增：工作表配置接口
export interface SheetConfig {
  sheetName: string;
  isSelected: boolean;
  mapping: Partial<HeaderMapping>;
  useGlobalMapping: boolean;
  questionCount: number;
}

// 新增：多工作表配置接口
export interface MultiSheetConfig {
  sheets: SheetConfig[];
  globalMapping: Partial<HeaderMapping>;
  useGlobalMapping: boolean;
}

export interface QuestionResult {
  questionId: number;
  isCorrect: boolean;
  userAnswer: string | null;
  correctAnswer: string;
  questionType?: string;
}

export interface QuizState {
  currentQuestionIndex: number;
  userAnswers: (string | null)[];
  questionResults: QuestionResult[];
  isCompleted: boolean;
}

export interface ExcelData {
  workbook: any;
  sheetNames: string[];
  headers: string[];
  data: any[];
} 