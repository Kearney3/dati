import { ExamSettings } from '../types';

const EXAM_CONFIG_KEY = 'examConfig';

// 保存考试配置到本地存储
export const saveExamConfig = (config: ExamSettings): void => {
  try {
    localStorage.setItem(EXAM_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save exam config:', error);
  }
};

// 从本地存储加载考试配置
export const loadExamConfig = (): ExamSettings | null => {
  try {
    const saved = localStorage.getItem(EXAM_CONFIG_KEY);
    if (saved) {
      return JSON.parse(saved) as ExamSettings;
    }
  } catch (error) {
    console.error('Failed to load exam config:', error);
  }
  return null;
};

// 清除考试配置
export const clearExamConfig = (): void => {
  try {
    localStorage.removeItem(EXAM_CONFIG_KEY);
  } catch (error) {
    console.error('Failed to clear exam config:', error);
  }
};

// 检查是否有保存的考试配置
export const hasExamConfig = (): boolean => {
  try {
    return localStorage.getItem(EXAM_CONFIG_KEY) !== null;
  } catch (error) {
    console.error('Failed to check exam config:', error);
    return false;
  }
}; 