import { useState } from 'react';
import { Trophy, RefreshCw, ArrowLeft, Eye, CheckCircle, XCircle, Download } from 'lucide-react';
import { Question, QuestionResult, QuizSettings } from '../types';
import { getQuizStats, getExamStats } from '../utils/quiz';
import { exportToExcel, exportToHTML } from '../utils/export';

interface ResultsScreenProps {
  questions: Question[];
  results: QuestionResult[];
  settings: QuizSettings;
  examSettings?: any;
  onRetry: () => void;
  onReview: () => void;
  onBackToUpload: () => void;
}

export const ResultsScreen = ({ 
  questions, 
  results, 
  settings,
  examSettings,
  onRetry, 
  onReview, 
  onBackToUpload 
}: ResultsScreenProps) => {
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
  const stats = settings.mode === 'exam' && examSettings 
    ? getExamStats(results, examSettings)
    : getQuizStats(results);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-primary-100 dark:bg-primary-900/30">
            <Trophy className="w-12 h-12 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          答题完成！
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          恭喜您完成了本次答题
        </p>
      </div>

      {/* Stats */}
      <div className="card p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
              {stats.correct}
            </div>
            <div className="text-gray-600 dark:text-gray-400">答对题目</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.total}
            </div>
            <div className="text-gray-600 dark:text-gray-400">总题目数</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-success-600 dark:text-success-400 mb-2">
              {settings.mode === 'exam' ? `${stats.totalScore}/${stats.maxScore}` : `${stats.accuracy}%`}
            </div>
            <div className="text-gray-600 dark:text-gray-400">
              {settings.mode === 'exam' ? '得分/满分' : '正确率'}
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="card p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          答题卡 (悬浮查看详情)
        </h3>
        <div className="grid grid-cols-8 gap-2">
          {results.map((result, index) => (
            <button
              key={index}
              onMouseEnter={() => setHoveredQuestion(index)}
              onMouseLeave={() => setHoveredQuestion(null)}
              className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
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
        <div className="fixed z-50 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center mb-2">
            {results[hoveredQuestion].isCorrect ? (
              <CheckCircle className="w-4 h-4 text-success-400 mr-2" />
            ) : (
              <XCircle className="w-4 h-4 text-danger-400 mr-2" />
            )}
            <span className="font-medium">
              第 {hoveredQuestion + 1} 题
            </span>
          </div>
          <p className="text-sm mb-2">{questions[hoveredQuestion].text}</p>
          <p className="text-xs text-gray-300">
            您的答案: {results[hoveredQuestion].userAnswer || '未作答'}
          </p>
          <p className="text-xs text-gray-300">
            正确答案: {results[hoveredQuestion].correctAnswer}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button onClick={onReview} className="btn btn-primary">
          <Eye className="w-4 h-4 mr-2" />
          答题回顾
        </button>
        <button onClick={onRetry} className="btn btn-success">
          <RefreshCw className="w-4 h-4 mr-2" />
          重新答题
        </button>
        <button 
          onClick={() => exportToExcel({ questions, results, settings, examSettings, stats })}
          className="btn btn-warning"
        >
          <Download className="w-4 h-4 mr-2" />
          导出Excel
        </button>
        <button 
          onClick={() => exportToHTML({ questions, results, settings, examSettings, stats })}
          className="btn btn-info"
        >
          <Download className="w-4 h-4 mr-2" />
          导出HTML
        </button>
        <button onClick={onBackToUpload} className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回主页
        </button>
      </div>
    </div>
  );
}; 