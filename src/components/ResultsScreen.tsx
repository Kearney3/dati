import { useState } from 'react';
import { Trophy, RefreshCw, ArrowLeft, Eye, CheckCircle, XCircle, Download, Home, EyeOff } from 'lucide-react';
import { Question, QuestionResult, QuizSettings } from '../types';
import { getQuizStats, getExamStats, formatJudgmentAnswer, formatCorrectAnswer } from '../utils/quiz';
import { exportToExcel, exportToHTML } from '../utils/export';
import { useTranslation } from 'react-i18next';

interface ResultsScreenProps {
  questions: Question[];
  results: QuestionResult[];
  settings: QuizSettings;
  examSettings?: any;
  onRetry: () => void;
  onRetryWrongQuestions: () => void;
  onReview: () => void;
  onBackToUpload: () => void;
  onBackToQuiz: () => void;
}

export const ResultsScreen = ({ 
  questions, 
  results, 
  settings,
  examSettings,
  onRetry, 
  onRetryWrongQuestions,
  onReview, 
  onBackToUpload,
  onBackToQuiz
}: ResultsScreenProps) => {
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [showExplanation, setShowExplanation] = useState(false);
  const stats = settings.mode === 'exam' && examSettings 
    ? getExamStats(results, examSettings)
    : getQuizStats(results);
  const { t } = useTranslation();
  
  // 计算错题数量
  const wrongQuestionsCount = results.filter(result => !result.isCorrect).length;
  const handleExportExcel = () => {
    exportToExcel({ questions, results, settings, examSettings, stats }, exportFormat);
    setShowExportDialog(false);
  };

  return (
    <div className="max-w-4xl mx-auto min-w-[350px]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex flex-col items-center mb-4">
          <div className="p-4 rounded-full bg-primary-100 dark:bg-primary-900/30 mb-4">
            <Trophy className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('results.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {t('results.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="card p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {stats.correct}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('results.correct_count')}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-danger-600 dark:text-danger-400 mb-2">
              {wrongQuestionsCount}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('results.wrong_count')}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.total}
            </div>
            <div className="text-gray-600 dark:text-gray-400">{t('results.total_count')}</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-success-600 dark:text-success-400 mb-2">
              {settings.mode === 'exam' ? `${Number(stats.totalScore).toFixed(1)}/${Number(stats.maxScore).toFixed(1)}` : `${stats.accuracy}%`}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {settings.mode === 'exam' ? t('results.score_ratio') : t('results.accuracy')}
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center sm:text-left">
            {t('results.answer_sheet_title')}
          </h3>
          <div className="flex items-center justify-center sm:justify-end gap-2">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                showExplanation
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={showExplanation ? t('results.hide_explanation') : t('results.show_explanation')}
            >
              {showExplanation ? (
                <EyeOff className="w-3 h-3 sm:w-4 sm:h-4" />
              ) : (
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
              )}
                              <span className="hidden sm:inline">{showExplanation ? t('results.hide_explanation') : t('results.show_explanation')}</span>
                <span className="sm:hidden">{showExplanation ? t('common.hide', { defaultValue: '隐藏' }) : t('common.show', { defaultValue: '显示' })}</span>
            </button>
          </div>
        </div>
        <div className="grid gap-2 overflow-x-hidden"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))'
        }}>
          {results.map((result, index) => (
            <button
              key={index}
              onMouseEnter={(e) => {
                setHoveredQuestion(index);
                setTooltipPosition({ x: e.clientX, y: e.clientY });
              }}
              onMouseLeave={() => setHoveredQuestion(null)}
              onMouseMove={(e) => {
                if (hoveredQuestion === index) {
                  setTooltipPosition({ x: e.clientX, y: e.clientY });
                }
              }}
              className={`p-2 sm:p-2.5 lg:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
                result.isCorrect
                  ? 'bg-success-600 text-white hover:bg-success-700'
                  : 'bg-danger-600 text-white hover:bg-danger-700'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Question Tooltip */}
      {hoveredQuestion !== null && (
        <div 
          className="fixed z-50 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md pointer-events-none"
          style={{
            left: `${Math.min(tooltipPosition.x + 10, window.innerWidth - 300)}px`,
            top: `${Math.max(tooltipPosition.y - 10, 10)}px`,
            transform: tooltipPosition.y > window.innerHeight / 2 ? 'translateY(-100%)' : 'none'
          }}
        >
          <div className="flex items-center mb-2">
            {results[hoveredQuestion].isCorrect ? (
              <CheckCircle className="w-4 h-4 text-success-400 mr-2" />
            ) : (
              <XCircle className="w-4 h-4 text-danger-400 mr-2" />
            )}
            <span className="font-medium">
              {t('results.question_num_type', { num: hoveredQuestion + 1, type: questions[hoveredQuestion].type })}
            </span>
          </div>
          <p className="text-sm mb-3">{questions[hoveredQuestion].text}</p>
          
          {/* 显示选项 */}
          {questions[hoveredQuestion].type !== '填空题' && (
            <div className="mb-3">
              <p className="text-xs text-gray-400 mb-2">{t('results.options_label')}:</p>
              <div className="space-y-1">
                {(() => {
                  const question = questions[hoveredQuestion];
                  const result = results[hoveredQuestion];
                  
                  // 获取选项内容
                  let options: string[] = [];
                  if (question.type === '判断题') {
                    options = [settings.judgementTrue, settings.judgementFalse];
                  } else {
                    options = question.options || [];
                  }
                  
                  return options.map((option, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex);
                    
                    // 判断是否为正确答案
                    let isCorrect = false;
                    if (question.type === '判断题') {
                      const correctAnswerFormatted = formatCorrectAnswer(question, settings);
                      isCorrect = option === correctAnswerFormatted;
                    } else if (question.type === '多选题') {
                      // 多选题：检查答案字符串中是否包含该字母
                      const normalizedAnswer = question.answer.replace(/[,，\s]/g, '').toUpperCase();
                      isCorrect = normalizedAnswer.includes(letter);
                    } else {
                      // 单选题：直接比较答案
                      isCorrect = question.answer.toUpperCase() === letter;
                    }
                    
                    // 判断是否为用户选答案
                    let isUserAnswer = false;
                    if (question.type === '判断题') {
                      const userAnswerFormatted = formatJudgmentAnswer(result.userAnswer, question, settings);
                      isUserAnswer = option === userAnswerFormatted;
                    } else {
                      isUserAnswer = !!(result.userAnswer && result.userAnswer.includes(letter));
                    }
                    
                    let className = 'text-xs p-1 rounded';
                    if (isCorrect && isUserAnswer) {
                      className += ' bg-green-600 text-white';
                    } else if (isCorrect) {
                      className += ' bg-green-600 text-white';
                    } else if (isUserAnswer) {
                      className += ' bg-red-600 text-white';
                    } else {
                      className += ' text-gray-300';
                    }
                    
                    return (
                      <div key={optIndex} className={`${className} flex justify-between items-center`}>
                        <span>{letter}. {option}</span>
                        {isUserAnswer && <span className="text-xs text-orange-400 border border-orange-400 bg-orange-50 px-1 rounded font-bold">{t('results.your_choice')}</span>}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-700 pt-2">
            <p className="text-xs text-gray-300">
              {t('quizui.your_answer')} {formatJudgmentAnswer(results[hoveredQuestion].userAnswer, questions[hoveredQuestion], settings)}
            </p>
            <p className="text-xs text-gray-300">
              {t('quizui.correct_answer')} {formatCorrectAnswer(questions[hoveredQuestion], settings)}
            </p>
            {showExplanation && questions[hoveredQuestion].explanation && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-1">{t('quizui.explanation')}:</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {questions[hoveredQuestion].explanation}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* 答题回顾按钮独占一行 */}
        <button onClick={onReview} className="btn btn-primary flex items-center justify-center whitespace-nowrap sm:col-span-2 lg:col-span-3">
          <Eye className="w-4 h-4 mr-2" />
          {t('results.review_quiz')}
        </button>
        
        {/* 重新答题、错题重练、返回答题共处一行 */}
        <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button onClick={onRetry} className="btn btn-success flex items-center justify-center whitespace-nowrap flex-1">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('results.retry_quiz')}
          </button>
          {wrongQuestionsCount > 0 && (
            <button onClick={onRetryWrongQuestions} className="btn btn-danger flex items-center justify-center whitespace-nowrap flex-1">
              <XCircle className="w-4 h-4 mr-2" />
              {t('results.retry_wrong_questions', { count: wrongQuestionsCount })}
            </button>
          )}
          <button onClick={onBackToQuiz} className="btn btn-info flex items-center justify-center whitespace-nowrap flex-1">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('results.back_to_quiz')}
          </button>
        </div>
        
        {/* 导出HTML和EXCEL的两个按钮共处一行 */}
        <div className="sm:col-span-2 lg:col-span-3 flex gap-3 sm:gap-4">
          <button 
            onClick={() => setShowExportDialog(true)}
            className="btn btn-warning flex items-center justify-center whitespace-nowrap flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('results.export_excel')}
          </button>
          <button 
            onClick={() => exportToHTML({ questions, results, settings, examSettings, stats })}
            className="btn btn-info flex items-center justify-center whitespace-nowrap flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            {t('results.export_html')}
          </button>
        </div>
        
        {/* 返回主页按钮独占一行 */}
        <button onClick={onBackToUpload} className="btn btn-secondary flex items-center justify-center whitespace-nowrap sm:col-span-2 lg:col-span-3">
          <Home className="w-4 h-4 mr-2" />
          {t('app.back_home')}
        </button>
      </div>

      {/* 导出格式选择对话框 */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Download className="w-6 h-6 text-warning-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('results.export_format_title')}
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {t('results.export_format_description')}
              </p>
              
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="xlsx"
                    checked={exportFormat === 'xlsx'}
                    onChange={(e) => setExportFormat(e.target.value as 'xlsx' | 'csv')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{t('results.excel_xlsx_label')}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('results.excel_xlsx_description')}
                    </div>
                  </div>
                </label>
                
                <label className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={(e) => setExportFormat(e.target.value as 'xlsx' | 'csv')}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{t('results.csv_label')}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {t('results.csv_description')}
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExportDialog(false)}
                className="btn btn-secondary"
              >
                {t('common.cancel', { defaultValue: '取消' })}
              </button>
              <button
                onClick={handleExportExcel}
                className="btn btn-warning"
              >
                {t('common.confirm_export', { defaultValue: '确认导出' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 