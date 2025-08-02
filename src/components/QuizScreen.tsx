import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, Lightbulb, Grid, X } from 'lucide-react';
import { Question, QuizSettings, QuestionResult } from '../types';
import { checkAnswer } from '../utils/quiz';

interface QuizScreenProps {
  questions: Question[];
  settings: QuizSettings;
  quizState: {
    currentQuestionIndex: number;
    userAnswers: (string | null)[];
    questionResults: QuestionResult[];
    isCompleted: boolean;
  };
  onQuizStateChange: (state: any) => void;
  onComplete: () => void;
  onExit: () => void;
}

export const QuizScreen = ({ 
  questions, 
  settings, 
  quizState, 
  onQuizStateChange, 
  onComplete, 
  onExit 
}: QuizScreenProps) => {
  const [showNavPanel, setShowNavPanel] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{ isCorrect: boolean; correctAnswerText: string; userAnswerText?: string } | null>(null);

  const currentQuestion = questions[quizState.currentQuestionIndex];
  const currentAnswer = quizState.userAnswers[quizState.currentQuestionIndex];

  const handleAnswerChange = (answer: string | null) => {
    const newUserAnswers = [...quizState.userAnswers];
    newUserAnswers[quizState.currentQuestionIndex] = answer;
    onQuizStateChange({ ...quizState, userAnswers: newUserAnswers });

    // Show feedback in review mode
    if (settings.mode === 'review' && answer !== null) {
      const result = checkAnswer(currentQuestion, answer, settings);
      setFeedbackData(result);
      setShowFeedback(true);
    }
  };

  const handleNext = () => {
    if (quizState.currentQuestionIndex < questions.length - 1) {
      onQuizStateChange({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex + 1
      });
      setShowFeedback(false);
    }
  };

  const handlePrev = () => {
    if (quizState.currentQuestionIndex > 0) {
      onQuizStateChange({
        ...quizState,
        currentQuestionIndex: quizState.currentQuestionIndex - 1
      });
      setShowFeedback(false);
    }
  };

  const handleSubmit = () => {
    const unansweredCount = quizState.userAnswers.filter(a => a === null).length;
    if (unansweredCount > 0 && settings.mode === 'quiz') {
      if (!confirm(`还有 ${unansweredCount} 题未作答，确定要提交吗？`)) {
        return;
      }
    }
    onComplete();
  };

  const handleHint = () => {
    const result = checkAnswer(currentQuestion, currentAnswer, settings);
    setFeedbackData(result);
    setShowFeedback(true);
  };

  // Show immediate feedback in recite mode
  useEffect(() => {
    if (settings.mode === 'recite') {
      const result = checkAnswer(currentQuestion, null, settings);
      setFeedbackData(result);
      setShowFeedback(true);
    }
  }, [currentQuestion, settings.mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow navigation shortcuts in recite mode, but disable answer selection
      if (settings.mode === 'recite' && ['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D', 'e', 'E', 'f', 'F', '1', '2', '3', '4', '5', '6'].includes(e.key)) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (quizState.currentQuestionIndex < questions.length - 1) {
            handleNext();
          } else {
            handleSubmit();
          }
          break;
        case 'a':
        case 'A':
        case '1':
          if (currentQuestion.type !== '填空题' && 
              (currentQuestion.type === '判断题' || currentQuestion.options.length >= 1)) {
            handleAnswerChange('A');
          }
          break;
        case 'b':
        case 'B':
        case '2':
          if (currentQuestion.type !== '填空题' && 
              (currentQuestion.type === '判断题' || currentQuestion.options.length >= 2)) {
            handleAnswerChange('B');
          }
          break;
        case 'c':
        case 'C':
        case '3':
          if (currentQuestion.type !== '填空题' && currentQuestion.options.length >= 3) {
            handleAnswerChange('C');
          }
          break;
        case 'd':
        case 'D':
        case '4':
          if (currentQuestion.type !== '填空题' && currentQuestion.options.length >= 4) {
            handleAnswerChange('D');
          }
          break;
        case 'e':
        case 'E':
        case '5':
          if (currentQuestion.type !== '填空题' && currentQuestion.options.length >= 5) {
            handleAnswerChange('E');
          }
          break;
        case 'f':
        case 'F':
        case '6':
          if (currentQuestion.type !== '填空题' && currentQuestion.options.length >= 6) {
            handleAnswerChange('F');
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, quizState.currentQuestionIndex, settings.mode, handleAnswerChange, handlePrev, handleNext, handleSubmit]);

  if (!currentQuestion) return null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-4">
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
              进度: {quizState.currentQuestionIndex + 1} / {questions.length}
            </span>
            <div className="w-64 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((quizState.currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            {settings.mode !== 'recite' && (
              <button
                onClick={handleHint}
                className="btn btn-warning"
                title="提示答案"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                提示
              </button>
            )}
            <button
              onClick={() => setShowNavPanel(true)}
              className="btn btn-secondary"
              title="题号导航"
            >
              <Grid className="w-4 h-4 mr-2" />
              导航
            </button>
            <button
              onClick={onExit}
              className="btn btn-danger"
              title="返回主页"
            >
              <X className="w-4 h-4 mr-2" />
              返回主页
            </button>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="card p-6 mb-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {quizState.currentQuestionIndex + 1}. {currentQuestion.text}
            </h2>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium">
              {currentQuestion.type}
            </span>
          </div>

          {/* Options */}
          {currentQuestion.type !== '填空题' && (
            <div className="space-y-3">
              {(currentQuestion.type === '判断题' 
                ? [settings.judgementTrue, settings.judgementFalse]
                : currentQuestion.options
              ).map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = currentAnswer === letter;
                const isCorrectAnswer = currentQuestion.answer.includes(letter);
                
                return (
                  <label
                    key={index}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : isCorrectAnswer && settings.mode === 'recite'
                        ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                    } ${settings.mode === 'recite' ? 'pointer-events-none opacity-75' : ''}`}
                  >
                    <input
                      type={currentQuestion.type === '多选题' ? 'checkbox' : 'radio'}
                      name={`question-${quizState.currentQuestionIndex}`}
                      value={letter}
                      checked={isSelected}
                      onChange={(e) => {
                        if (currentQuestion.type === '多选题') {
                          const currentAnswers = currentAnswer ? currentAnswer.split('') : [];
                          if (e.target.checked) {
                            currentAnswers.push(letter);
                          } else {
                            const index = currentAnswers.indexOf(letter);
                            if (index > -1) currentAnswers.splice(index, 1);
                          }
                          handleAnswerChange(currentAnswers.sort().join(''));
                        } else {
                          handleAnswerChange(letter);
                        }
                      }}
                      className="sr-only"
                      disabled={settings.mode === 'recite'}
                    />
                    <span className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 mr-3 flex items-center justify-center">
                      {isSelected && (
                        <div className="w-3 h-3 rounded-full bg-primary-600" />
                      )}
                      {isCorrectAnswer && settings.mode === 'recite' && !isSelected && (
                        <div className="w-3 h-3 rounded-full bg-success-600" />
                      )}
                    </span>
                    <span className="text-gray-900 dark:text-white">
                      {letter}. {option}
                      {isCorrectAnswer && settings.mode === 'recite' && (
                        <span className="ml-2 text-success-600 dark:text-success-400 text-sm font-medium">
                          ✓ 正确答案
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Fill-in question */}
          {currentQuestion.type === '填空题' && (
            <div className="space-y-3">
              {currentQuestion.answer.split('|||').map((_, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`请填写第 ${index + 1} 个答案`}
                  value={currentAnswer ? currentAnswer.split('|||')[index] || '' : ''}
                  onChange={(e) => {
                    const answers = currentAnswer ? currentAnswer.split('|||') : [];
                    answers[index] = e.target.value;
                    handleAnswerChange(answers.join('|||'));
                  }}
                  className="input"
                  disabled={settings.mode === 'recite'}
                />
              ))}
            </div>
          )}
        </div>

        {/* Feedback - 背题模式下填空题仍显示答案提示 */}
        {showFeedback && feedbackData && (settings.mode !== 'recite' || currentQuestion.type === '填空题') && (
          <div className={`p-4 rounded-lg border-l-4 ${
            feedbackData.isCorrect 
              ? 'bg-success-50 dark:bg-success-900/20 border-success-500' 
              : 'bg-danger-50 dark:bg-danger-900/20 border-danger-500'
          }`}>
            <div className="flex items-center mb-2">
              {feedbackData.isCorrect ? (
                <CheckCircle className="w-5 h-5 text-success-600 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 text-danger-600 mr-2" />
              )}
              <span className="font-medium">
                {settings.mode === 'recite' ? '正确答案' : 
                 feedbackData.isCorrect ? '回答正确！' : '回答错误'}
              </span>
            </div>
            {feedbackData.userAnswerText && (
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                您的答案: <span dangerouslySetInnerHTML={{ __html: feedbackData.userAnswerText }} />
              </p>
            )}
            <p className="text-gray-700 dark:text-gray-300">
              正确答案: <span dangerouslySetInnerHTML={{ __html: feedbackData.correctAnswerText }} />
            </p>
            {currentQuestion.explanation && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                <strong>解析:</strong> {currentQuestion.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrev}
          disabled={quizState.currentQuestionIndex === 0}
          className="btn btn-secondary"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          上一题
        </button>
        
        {quizState.currentQuestionIndex < questions.length - 1 ? (
          <button onClick={handleNext} className="btn btn-primary">
            下一题
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn btn-success">
            提交试卷
          </button>
        )}
      </div>

      {/* Navigation Panel */}
      {showNavPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                题目导航
              </h3>
              <button
                onClick={() => setShowNavPanel(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-8 gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onQuizStateChange({ ...quizState, currentQuestionIndex: index });
                    setShowNavPanel(false);
                  }}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    index === quizState.currentQuestionIndex
                      ? 'bg-primary-600 text-white'
                      : quizState.userAnswers[index]
                      ? 'bg-success-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 