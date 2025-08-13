import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Filter, CheckCircle, XCircle, Home, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, Search, X, Eye, EyeOff } from 'lucide-react';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showExplanations, setShowExplanations] = useState(true);


  const filteredQuestions = useMemo(() => {
    return questions.filter((question, index) => {
      const result = results[index];
      
      // Apply correctness filter
      if (correctnessFilter === 'correct' && !result.isCorrect) return false;
      if (correctnessFilter === 'incorrect' && result.isCorrect) return false;
      
      // Apply type filter
      if (typeFilter !== 'all' && question.type !== typeFilter) return false;
      
      // Apply search keyword filter
      if (searchKeyword.trim()) {
        const keyword = searchKeyword.trim().toLowerCase();
        const questionText = question.text.toLowerCase();
        const optionsText = question.options ? question.options.join(' ').toLowerCase() : '';
        const explanationText = question.explanation ? question.explanation.toLowerCase() : '';
        
        const matchesKeyword = questionText.includes(keyword) || 
                              optionsText.includes(keyword) || 
                              explanationText.includes(keyword);
        
        if (!matchesKeyword) return false;
      }
      
      return true;
    });
  }, [questions, results, correctnessFilter, typeFilter, searchKeyword]);

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  const questionTypes = useMemo(() => {
    return Array.from(new Set(questions.map(q => q.type)));
  }, [questions]);

  // 统计有解析的题目数量
  const questionsWithExplanations = useMemo(() => {
    return questions.filter(q => q.explanation && q.explanation.trim()).length;
  }, [questions]);

  // Reset to first page when filters change
  const handleFilterChange = (newCorrectnessFilter: FilterType, newTypeFilter: QuestionTypeFilter) => {
    setCorrectnessFilter(newCorrectnessFilter);
    setTypeFilter(newTypeFilter);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Reset to first page when search keyword changes
  const handleSearchChange = (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1);
  };

  // Clear search
  const clearSearch = () => {
    setSearchKeyword('');
    setCurrentPage(1);
  };

  // Highlight search keyword in text
  const highlightKeyword = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    
    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Scroll position tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      setShowScrollTop(scrollTop > 300);
      setShowScrollBottom(scrollTop + windowHeight < documentHeight - 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto min-w-[350px] relative">
      {/* Scroll buttons - floating at bottom-right corner */}
      <div className="fixed right-4 bottom-40 sm:bottom-20 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 space-y-1">
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              className="w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-all duration-200 hover:scale-105 flex items-center justify-center"
              title="回到顶部"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          )}
          {showScrollBottom && (
            <button
              onClick={scrollToBottom}
              className="w-10 h-10 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-all duration-200 hover:scale-105 flex items-center justify-center"
              title="跳转到底部"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="btn btn-secondary text-sm px-2 sm:px-3 py-2">
          <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">返回结果</span>
          <span className="sm:hidden">返回</span>
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white px-2">
          答题回顾
        </h1>
        <button onClick={onBackToUpload} className="btn btn-primary text-sm px-2 sm:px-3 py-2">
          <Home className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">返回主页</span>
          <span className="sm:hidden">主页</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6">
        <div className="flex items-center mb-4">
          <Filter className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-700 dark:text-gray-300">筛选条件</span>
        </div>

        {/* Search Box */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            关键词搜索
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索题干、选项或解析内容..."
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
            {searchKeyword && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="清除搜索"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {searchKeyword && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              找到 {filteredQuestions.length} 个匹配结果
            </div>
          )}
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
                  onClick={() => handleFilterChange(filter.value as FilterType, typeFilter)}
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
                onClick={() => handleFilterChange(correctnessFilter, 'all')}
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
                  onClick={() => handleFilterChange(correctnessFilter, type)}
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

        {/* Display Options */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              显示选项
            </label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowExplanations(!showExplanations)}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                  showExplanations
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title={showExplanations ? '隐藏解析' : '显示解析'}
              >
                {showExplanations ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
                <span>解析</span>
                {questionsWithExplanations > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-white/20 dark:bg-black/20 rounded-full text-xs">
                    {questionsWithExplanations}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Pagination Settings */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                每页显示:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 5, label: '5题' },
                  { value: 10, label: '10题' },
                  { value: 20, label: '20题' },
                  { value: 50, label: '50题' },
                  { value: 100, label: '100题' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePageSizeChange(option.value)}
                    className={`px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                      pageSize === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              共 {filteredQuestions.length} 题，第 {currentPage} / {totalPages} 页
            </div>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6 pb-12 sm:pb-24">
        {currentQuestions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              没有符合筛选条件的题目
            </p>
          </div>
        ) : (
          currentQuestions.map((question) => {
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
                  {highlightKeyword(question.text, searchKeyword)}
                </p>

                {/* Options */}
                {question.type !== '填空题' && (
                  <div className="space-y-2 mb-4">
                    {(question.type === '判断题' 
                      ? [settings.judgementTrue, settings.judgementFalse]
                      : question.options
                    ).map((option, optIndex) => {
                      const letter = String.fromCharCode(65 + optIndex);
                      
                      // 对于判断题，需要特殊处理用户选择的判断逻辑
                      let isUserSelected = false;
                      if (question.type === '判断题') {
                        // 判断题：如果用户答案是A且当前选项索引是0（对应"对"），或用户答案是B且当前选项索引是1（对应"错"）
                        isUserSelected = (userAnswer === 'A' && optIndex === 0) || (userAnswer === 'B' && optIndex === 1);
                      } else {
                        // 其他题型：使用原来的逻辑
                        isUserSelected = userAnswer?.includes(letter) || false;
                      }
                      
                      // 判断是否为正确答案
                      let isCorrectAnswer = false;
                      if (question.type === '判断题') {
                        // 判断题：使用 checkAnswer 函数来正确处理
                        const { correctAnswerText } = checkAnswer(question, null, settings);
                        const correctLetters = correctAnswerText.match(/^([A-Z])\./);
                        const correctLetter = correctLetters ? correctLetters[1] : '';
                        isCorrectAnswer = correctLetter === letter;
                      } else if (question.type === '多选题') {
                        // 多选题：直接检查答案字符串中是否包含该字母
                        const normalizedAnswer = question.answer.replace(/[,，\s]/g, '').toUpperCase();
                        isCorrectAnswer = normalizedAnswer.includes(letter);
                      } else {
                        // 单选题：直接比较答案
                        isCorrectAnswer = question.answer.toUpperCase() === letter;
                      }
                      
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
                              {letter}. {highlightKeyword(option, searchKeyword)}
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
                {question.explanation && showExplanations && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
                    <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                      解析:
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
                      {highlightKeyword(question.explanation, searchKeyword)}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls - Fixed at bottom */}
      {totalPages > 1 && (
        <div className="fixed left-1/2 transform -translate-x-1/2 z-40 bottom-24 sm:bottom-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 max-w-xs sm:max-w-none overflow-x-auto">
            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
              {/* First Page Button */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="btn btn-secondary px-2 sm:px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="第一页"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              
              {/* Previous Page Button */}
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary px-2 sm:px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Page Numbers */}
              <div className="flex space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        currentPage === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              {/* Next Page Button */}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary px-2 sm:px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* Last Page Button */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="btn btn-secondary px-2 sm:px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="最后一页"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 