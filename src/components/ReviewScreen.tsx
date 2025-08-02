import { useState, useMemo } from 'react';
import { ArrowLeft, Filter, CheckCircle, XCircle, Home } from 'lucide-react';
import { Question, QuestionResult, QuizSettings } from '../types';
import { checkAnswer } from '../utils/quiz';

interface ReviewScreenProps {
  questions: Question[];
  results: QuestionResult[];
  userAnswers: (string | null)[];
  settings: QuizSettings;
  onBack: () => void;
  onBackToUpload: () => void;
}

type FilterType = 'all' | 'correct' | 'incorrect';
type QuestionTypeFilter = 'all' | Question['type'];

export const ReviewScreen = ({ 
  questions, 
  results, 
  userAnswers, 
  settings, 
  onBack,
  onBackToUpload
}: ReviewScreenProps) => {
  const [correctnessFilter, setCorrectnessFilter] = useState<FilterType>('all');
  const [typeFilter, setTypeFilter] = useState<QuestionTypeFilter>('all');

  const filteredQuestions = useMemo(() => {
    return questions.filter((question, index) => {
      const result = results[index];
      
      // Apply correctness filter
      if (correctnessFilter === 'correct' && !result.isCorrect) return false;
      if (correctnessFilter === 'incorrect' && result.isCorrect) return false;
      
      // Apply type filter
      if (typeFilter !== 'all' && question.type !== typeFilter) return false;
      
      return true;
    });
  }, [questions, results, correctnessFilter, typeFilter]);

  const questionTypes = useMemo(() => {
    return Array.from(new Set(questions.map(q => q.type)));
  }, [questions]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          <button onClick={onBack} className="btn btn-secondary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回结果
          </button>
          <button onClick={onBackToUpload} className="btn btn-primary">
            <Home className="w-4 h-4 mr-2" />
            返回主页
          </button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          答题回顾
        </h1>
        <div className="w-20"></div> {/* Spacer for centering */}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-700 dark:text-gray-300">筛选条件</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Correctness Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              答题状态
            </label>
            <div className="flex space-x-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'correct', label: '正确' },
                { value: 'incorrect', label: '错误' }
              ].map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setCorrectnessFilter(filter.value as FilterType)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    correctnessFilter === filter.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              题目类型
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  typeFilter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                所有类型
              </button>
              {questionTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    typeFilter === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {filteredQuestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              没有符合筛选条件的题目
            </p>
          </div>
        ) : (
          filteredQuestions.map((question) => {
            const originalIndex = questions.indexOf(question);
            const result = results[originalIndex];
            const userAnswer = userAnswers[originalIndex];

            return (
              <div
                key={originalIndex}
                className={`card p-6 border-l-4 ${
                  result.isCorrect
                    ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                    : 'border-danger-500 bg-danger-50 dark:bg-danger-900/20'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {result.isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-danger-600" />
                    )}
                    <span className="font-medium text-gray-900 dark:text-white">
                      第 {originalIndex + 1} 题
                    </span>
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                      {question.type}
                    </span>
                  </div>
                </div>

                {/* Question Text */}
                <p className="text-gray-900 dark:text-white mb-4">
                  {question.text}
                </p>

                {/* Options */}
                {question.type !== '填空题' && (
                  <div className="space-y-2 mb-4">
                    {(question.type === '判断题' 
                      ? [settings.judgementTrue, settings.judgementFalse]
                      : question.options
                    ).map((option, optIndex) => {
                      const letter = String.fromCharCode(65 + optIndex);
                      const isUserSelected = userAnswer?.includes(letter);
                      
                      // 使用 checkAnswer 函数来正确处理判断题答案
                      const { correctAnswerText } = checkAnswer(question, null, settings);
                      const correctLetters = correctAnswerText.match(/^([A-Z])\./);
                      const correctLetter = correctLetters ? correctLetters[1] : '';
                      const isCorrectAnswer = correctLetter === letter;
                      
                      return (
                        <div
                          key={optIndex}
                          className={`p-3 rounded-lg border ${
                            isCorrectAnswer
                              ? 'bg-success-100 dark:bg-success-900/30 border-success-300 dark:border-success-600'
                              : isUserSelected && !isCorrectAnswer
                              ? 'bg-danger-100 dark:bg-danger-900/30 border-danger-300 dark:border-danger-600'
                              : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900 dark:text-white">
                              {letter}. {option}
                            </span>
                            {isUserSelected && (
                              <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-800 dark:text-warning-200 rounded-full text-xs font-medium">
                                您的选择
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Fill-in Answers */}
                {question.type === '填空题' && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                        您的答案:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(userAnswer || '').split('|||').map((ans, i) => (
                          <span
                            key={i}
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              ans.trim().toLowerCase() === question.answer.split('|||')[i]?.trim().toLowerCase()
                                ? 'bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-200'
                                : 'bg-danger-100 dark:bg-danger-900/30 text-danger-800 dark:text-danger-200'
                            }`}
                          >
                            {ans.trim() || '(未填写)'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">
                        正确答案:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {question.answer.split('|||').map((ans, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-lg text-sm font-medium bg-success-100 dark:bg-success-900/30 text-success-800 dark:text-success-200"
                          >
                            {ans.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                      解析:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}; 