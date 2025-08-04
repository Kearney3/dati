import { useState } from 'react';
import { Trophy, RefreshCw, ArrowLeft, Eye, CheckCircle, XCircle, Download, Home } from 'lucide-react';
import { Question, QuestionResult, QuizSettings } from '../types';
import { getQuizStats, getExamStats, formatJudgmentAnswer, formatCorrectAnswer } from '../utils/quiz';
import { exportToExcel, exportToHTML } from '../utils/export';

interface ResultsScreenProps {
  questions: Question[];
  results: QuestionResult[];
  settings: QuizSettings;
  examSettings?: any;
  onRetry: () => void;
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
  onReview, 
  onBackToUpload,
  onBackToQuiz
}: ResultsScreenProps) => {
  const [hoveredQuestion, setHoveredQuestion] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const stats = settings.mode === 'exam' && examSettings 
    ? getExamStats(results, examSettings)
    : getQuizStats(results);

  const handleExportExcel = () => {
    exportToExcel({ questions, results, settings, examSettings, stats }, exportFormat);
    setShowExportDialog(false);
  };

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
              第 {hoveredQuestion + 1} 题
            </span>
          </div>
          <p className="text-sm mb-2">{questions[hoveredQuestion].text}</p>
          <p className="text-xs text-gray-300">
            您的答案: {formatJudgmentAnswer(results[hoveredQuestion].userAnswer, questions[hoveredQuestion], settings)}
          </p>
          <p className="text-xs text-gray-300">
            正确答案: {formatCorrectAnswer(questions[hoveredQuestion], settings)}
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
        <button onClick={onBackToQuiz} className="btn btn-info">
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回答题
        </button>
        <button 
          onClick={() => setShowExportDialog(true)}
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
          <Home className="w-4 h-4 mr-2" />
          返回主页
        </button>
      </div>

      {/* 导出格式选择对话框 */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Download className="w-6 h-6 text-warning-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                选择导出格式
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                请选择要导出的Excel格式：
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
                    <div className="font-medium text-gray-900 dark:text-white">Excel (.xlsx)</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      包含两个工作表：答题情况和答题总结
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
                    <div className="font-medium text-gray-900 dark:text-white">CSV (.csv)</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      仅包含答题情况，适合数据分析
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
                取消
              </button>
              <button
                onClick={handleExportExcel}
                className="btn btn-warning"
              >
                确认导出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 