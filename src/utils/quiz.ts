import { Question, QuestionResult, QuizSettings, ExamSettings } from '../types';

export const checkAnswer = (
  question: Question, 
  userAnswer: string | null, 
  settings: QuizSettings
): { isCorrect: boolean; correctAnswerText: string; userAnswerText?: string } => {
  let isCorrect = false;
  let correctAnswerText = '';
  let userAnswerText = '';

  const getOptionContent = (letter: string) => {
    const index = letter.charCodeAt(0) - 65;
    if (question.type === '判断题') {
      const customOptions = [settings.judgementTrue, settings.judgementFalse];
      return customOptions[index] || '';
    }
    return question.options[index] || '';
  };

  const normalizeChoiceAnswer = (answer: string) => {
    if (!answer) return "";
    return answer.replace(/[,，\s]/g, '').toUpperCase().split('').sort().join('');
  };

  switch (question.type) {
    case '单选题':
      isCorrect = (userAnswer === question.answer.toUpperCase());
      correctAnswerText = `${question.answer.toUpperCase()}. ${getOptionContent(question.answer.toUpperCase())}`;
      if (userAnswer) {
        userAnswerText = `${userAnswer}. ${getOptionContent(userAnswer)}`;
      }
      break;
      
    case '判断题': {
      const customOptions = [settings.judgementTrue, settings.judgementFalse];
      let correctLetter = '';
      const normalizedAnswerFromExcel = question.answer.trim().toLowerCase();
      
      // 宽容机制：支持多种正确答案格式
      const trueAnswers = [customOptions[0].toLowerCase(), 'a', '对', '正确', 'yes', 'true', '1', '√', '✓'];
      const falseAnswers = [customOptions[1].toLowerCase(), 'b', '错', '错误', 'no', 'false', '0', '×', '✗'];
      
      if (trueAnswers.includes(normalizedAnswerFromExcel)) {
        correctLetter = 'A';
        correctAnswerText = `${correctLetter}. ${customOptions[0]}`;
      } else if (falseAnswers.includes(normalizedAnswerFromExcel)) {
        correctLetter = 'B';
        correctAnswerText = `${correctLetter}. ${customOptions[1]}`;
      } else {
        // Fallback if Excel answer is not recognized
        correctAnswerText = question.answer;
      }
      isCorrect = (userAnswer === correctLetter);
      
      // 用户答案显示 - 根据Excel答案格式显示
      if (userAnswer) {
        const userLetter = userAnswer.toUpperCase();
        if (userLetter === 'A' || userLetter === 'B') {
          userAnswerText = customOptions[userLetter.charCodeAt(0) - 65];
        } else {
          // 如果用户答案不是A/B，尝试直接匹配
          const normalizedUserAnswer = userAnswer.trim().toLowerCase();
          if (trueAnswers.includes(normalizedUserAnswer)) {
            userAnswerText = customOptions[0];
          } else if (falseAnswers.includes(normalizedUserAnswer)) {
            userAnswerText = customOptions[1];
          } else {
            userAnswerText = userAnswer;
          }
        }
      }
      break;
    }
    
    case '多选题': {
      const sortedUserAnswer = normalizeChoiceAnswer(userAnswer || '');
      const sortedCorrectAnswer = normalizeChoiceAnswer(question.answer);
      isCorrect = (sortedUserAnswer === sortedCorrectAnswer);
      correctAnswerText = sortedCorrectAnswer.split('').map(letter => 
        `${letter}. ${getOptionContent(letter)}`
      ).join('<br>');
      
      // 用户答案显示
      if (userAnswer) {
        userAnswerText = userAnswer.split('').map(letter => 
          `${letter}. ${getOptionContent(letter)}`
        ).join('<br>');
      }
      break;
    }
    
    case '填空题': {
      const separator = settings.fillBlankSeparator || '|';
      const userAnswersTrimmed = (userAnswer || '').split(separator).map(a => a.trim().toLowerCase());
      const correctAnswersTrimmed = question.answer.split(separator).map(a => a.trim().toLowerCase());
      
      isCorrect = userAnswersTrimmed.length === correctAnswersTrimmed.length &&
                  userAnswersTrimmed.every((val, idx) => val === correctAnswersTrimmed[idx]);
      
      correctAnswerText = question.answer.split(separator).join(', ');
      userAnswerText = userAnswer || '';
      break;
    }
    
    default:
      isCorrect = false;
      correctAnswerText = 'N/A';
  }
  
  return { isCorrect, correctAnswerText, userAnswerText };
};

export const generateQuizData = (
  questions: Question[], 
  settings: QuizSettings,
  examSettings?: ExamSettings
): Question[] => {
  let dataPool = [...questions];
  
  // 考试模式处理
  if (settings.mode === 'exam' && examSettings) {
    const examQuestions: Question[] = [];
    
    examSettings.configs.forEach(config => {
      if (config.count > 0) {
        // 筛选该类型的题目
        const typeQuestions = questions.filter(q => q.type === config.questionType);
        
        // 处理答题范围
        let availableQuestions = typeQuestions;
        if (config.useCustomRanges && config.questionRanges.length > 0) {
          const selectedIndices = new Set<number>();
          
          // 收集所有范围内的题目索引
          config.questionRanges.forEach(range => {
            for (let i = range.start - 1; i < Math.min(range.end, typeQuestions.length); i++) {
              if (i >= 0) {
                selectedIndices.add(i);
              }
            }
          });
          
          // 根据索引筛选题目
          availableQuestions = typeQuestions.filter((_, index) => selectedIndices.has(index));
        }
        
        // 随机选择指定数量的题目
        if (availableQuestions.length > 0) {
          const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
          const selected = shuffled.slice(0, Math.min(config.count, availableQuestions.length));
          examQuestions.push(...selected);
        }
      }
    });
    
    dataPool = examQuestions;
  } else {
    // 普通模式处理答题范围
    if (settings.useCustomRanges && settings.questionRanges.length > 0) {
      const selectedIndices = new Set<number>();
      
      // 收集所有范围内的题目索引
      settings.questionRanges.forEach(range => {
        for (let i = range.start - 1; i < Math.min(range.end, questions.length); i++) {
          if (i >= 0) {
            selectedIndices.add(i);
          }
        }
      });
      
      // 根据索引筛选题目
      dataPool = questions.filter((_, index) => selectedIndices.has(index));
    }
    
    if (settings.orderMode === 'random') {
      dataPool.sort(() => Math.random() - 0.5);
    }
    
    if (settings.limit > 0 && dataPool.length > settings.limit) {
      return dataPool.slice(0, settings.limit);
    }
  }
  
  return dataPool;
};

export const calculateResults = (
  questions: Question[], 
  userAnswers: (string | null)[], 
  settings: QuizSettings
): QuestionResult[] => {
  return questions.map((question, index) => {
    const userAnswer = userAnswers[index];
    const { isCorrect } = checkAnswer(question, userAnswer, settings);
    
    return {
      questionId: question.id,
      isCorrect,
      userAnswer,
      correctAnswer: question.answer,
      questionType: question.type
    };
  });
};

export const getQuizStats = (results: QuestionResult[]) => {
  const total = results.length;
  const correct = results.filter(r => r.isCorrect).length;
  const accuracy = total > 0 ? (correct / total * 100) : 0;
  
  return {
    total,
    correct,
    incorrect: total - correct,
    accuracy: Math.round(accuracy * 10) / 10,
    totalScore: correct,
    maxScore: total
  };
};

export const getExamStats = (results: QuestionResult[], examSettings: ExamSettings) => {
  const total = results.length;
  const correct = results.filter(r => r.isCorrect).length;
  const accuracy = total > 0 ? (correct / total * 100) : 0;
  
  // Calculate total score based on correct answers
  let totalScore = 0;
  let maxScore = 0;
  
  // 计算实际出题的总分
  results.forEach((result) => {
    const questionType = result.questionType || '单选题'; // Default fallback
    const config = examSettings.configs.find((c: any) => c.questionType === questionType);
    if (config) {
      maxScore += config.score; // 每道题都计入满分
      if (result.isCorrect) {
        totalScore += config.score;
      }
    }
  });
  
  // 格式化分数，避免浮点数精度问题导致的小数过长
  const formatScore = (score: number) => {
    // 如果是整数，直接返回
    if (Number.isInteger(score)) {
      return score;
    }
    // 如果是小数，保留最多2位小数，并去除末尾的0
    return parseFloat(score.toFixed(2));
  };
  
  return {
    total,
    correct,
    incorrect: total - correct,
    accuracy: Math.round(accuracy * 10) / 10,
    totalScore: formatScore(totalScore),
    maxScore: formatScore(maxScore) // 使用实际出题的总分，而不是配置的总分
  };
};

// 将判断题的A/B字母转换为实际选项内容
export const formatJudgmentAnswer = (
  answer: string | null | undefined,
  question: Question,
  settings: QuizSettings
): string => {
  if (!answer || question.type !== '判断题') {
    return answer || '未作答';
  }

  const customOptions = [settings.judgementTrue, settings.judgementFalse];
  
  if (answer === 'A') {
    return customOptions[0];
  } else if (answer === 'B') {
    return customOptions[1];
  }
  
  // 如果不是A/B，返回原始答案
  return answer;
};

// 格式化正确答案显示
export const formatCorrectAnswer = (
  question: Question,
  settings: QuizSettings
): string => {
  if (question.type === '判断题') {
    // 判断题：返回实际选项内容（如"对"、"错"）
    const { correctAnswerText } = checkAnswer(question, null, settings);
    const match = correctAnswerText.match(/^[A-Z]\.\s*(.+)$/);
    return match ? match[1] : correctAnswerText;
  } else if (question.type === '单选题' || question.type === '多选题') {
    // 单选题和多选题：只返回字母（如"C"或"AC"）
    return question.answer.toUpperCase();
  } else {
    // 填空题等其他题型：返回原始答案
    return question.answer;
  }
}; 