import { Question, QuestionResult, QuizSettings, ExamSettings } from '../types';
import { formatJudgmentAnswer, formatCorrectAnswer } from './quiz';
import * as XLSX from 'xlsx';

interface ExportData {
  questions: Question[];
  results: QuestionResult[];
  settings: QuizSettings;
  examSettings?: ExamSettings;
  stats: {
    total: number;
    correct: number;
    incorrect: number;
    accuracy: number;
    totalScore?: number;
    maxScore?: number;
  };
}

// 创建答题情况工作表数据
const createQuizDetailsSheet = (data: ExportData) => {
  const sheetData = [
    data.settings.mode === 'exam' && data.examSettings
      ? ['题号', '题目类型', '题目内容', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '每题分值', '您的答案', '正确答案', '是否正确', '解析']
      : ['题号', '题目类型', '题目内容', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '您的答案', '正确答案', '是否正确', '解析']
  ];

  // 添加每道题的详细记录
  data.questions.forEach((question, index) => {
    const result = data.results[index];
    
    // 处理选项显示 - 判断题使用自定义选项
    let optionA = '', optionB = '', optionC = '', optionD = '', optionE = '', optionF = '';
    if (question.type === '判断题') {
      optionA = data.settings.judgementTrue;
      optionB = data.settings.judgementFalse;
    } else {
      optionA = question.options[0] || '';
      optionB = question.options[1] || '';
      optionC = question.options[2] || '';
      optionD = question.options[3] || '';
      optionE = question.options[4] || '';
      optionF = question.options[5] || '';
    }
    
    // 格式化用户答案和正确答案
    const formattedUserAnswer = formatJudgmentAnswer(result.userAnswer, question, data.settings);
    const formattedCorrectAnswer = formatCorrectAnswer(question, data.settings);
    
    // 获取每题分值（考试模式）
    let questionScore = '';
    if (data.settings.mode === 'exam' && data.examSettings) {
      const config = data.examSettings.configs.find(c => c.questionType === question.type);
      if (config) {
        questionScore = String(config.score);
      }
    }
    
    if (data.settings.mode === 'exam' && data.examSettings) {
      // 考试模式：包含每题分值
      sheetData.push([
        String(index + 1),
        question.type,
        question.text,
        optionA,
        optionB,
        optionC,
        optionD,
        optionE,
        optionF,
        questionScore,
        formattedUserAnswer,
        formattedCorrectAnswer,
        result.isCorrect ? '正确' : '错误',
        question.explanation || ''
      ]);
    } else {
      // 非考试模式：不包含每题分值
      sheetData.push([
        String(index + 1),
        question.type,
        question.text,
        optionA,
        optionB,
        optionC,
        optionD,
        optionE,
        optionF,
        formattedUserAnswer,
        formattedCorrectAnswer,
        result.isCorrect ? '正确' : '错误',
        question.explanation || ''
      ]);
    }
  });

  return sheetData;
};

// 创建答题总结工作表数据
const createQuizSummarySheet = (data: ExportData) => {
  const sheetData = [
    ['答题总结报告'],
    [''],
    ['总体统计'],
    ['总题目数', data.stats.total],
    ['答对题目', data.stats.correct],
    ['答错题目', data.stats.incorrect],
    ['正确率', `${data.stats.accuracy}%`],
    ...(data.settings.mode === 'exam' && data.examSettings && data.stats.totalScore !== undefined ? [['得分', `${Number(data.stats.totalScore).toFixed(1)}/${Number(data.stats.maxScore).toFixed(1)}`]] : []),
    [''],
    ['题型统计'],
    data.settings.mode === 'exam' && data.examSettings 
      ? ['题型', '题目数量', '答对数量', '正确率', '得分/满分']
      : ['题型', '题目数量', '答对数量', '正确率']
  ];

  // 按题型统计
  const typeStats: { [key: string]: { total: number; correct: number; score?: number; maxScore?: number } } = {};
  
  data.questions.forEach((question, index) => {
    const result = data.results[index];
    const type = question.type;
    if (!typeStats[type]) {
      typeStats[type] = { total: 0, correct: 0 };
      
      // 如果是考试模式，计算该题型的分数配置
      if (data.settings.mode === 'exam' && data.examSettings) {
        const config = data.examSettings.configs.find(c => c.questionType === type);
        if (config) {
          typeStats[type].maxScore = config.score * config.count;
        }
      }
    }
    typeStats[type].total++;
    if (result.isCorrect) {
      typeStats[type].correct++;
      // 如果是考试模式，累加得分
      if (data.settings.mode === 'exam' && data.examSettings) {
        const config = data.examSettings.configs.find(c => c.questionType === type);
        if (config) {
          typeStats[type].score = (typeStats[type].score || 0) + config.score;
        }
      }
    }
  });

  // 添加题型统计
  Object.entries(typeStats).forEach(([type, stats]) => {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    
    if (data.settings.mode === 'exam' && data.examSettings && stats.score !== undefined && stats.maxScore !== undefined) {
      // 考试模式：包含分数信息
      sheetData.push([
        type,
        stats.total,
        stats.correct,
        `${accuracy}%`,
        `${Number(stats.score).toFixed(1)}/${Number(stats.maxScore).toFixed(1)}`
      ]);
    } else {
      // 非考试模式：不包含分数信息
      sheetData.push([
        type,
        stats.total,
        stats.correct,
        `${accuracy}%`
      ]);
    }
  });

  sheetData.push(['']);
  sheetData.push(['答题时间', new Date().toLocaleString('zh-CN')]);
  sheetData.push(['答题模式', data.settings.mode]);
  sheetData.push(['题目顺序', data.settings.orderMode]);

  return sheetData;
};

export const exportToExcel = (data: ExportData, format: 'xlsx' | 'csv' = 'xlsx') => {
  if (format === 'xlsx') {
    // 创建Excel工作簿
    const workbook = XLSX.utils.book_new();
    
    // 创建答题情况工作表
    const quizDetailsData = createQuizDetailsSheet(data);
    const quizDetailsSheet = XLSX.utils.aoa_to_sheet(quizDetailsData);
    XLSX.utils.book_append_sheet(workbook, quizDetailsSheet, '答题情况');
    
    // 创建答题总结工作表
    const quizSummaryData = createQuizSummarySheet(data);
    const quizSummarySheet = XLSX.utils.aoa_to_sheet(quizSummaryData);
    XLSX.utils.book_append_sheet(workbook, quizSummarySheet, '答题总结');
    
    // 导出Excel文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `答题结果_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    // 导出CSV格式（只包含答题情况）
    const quizDetailsData = createQuizDetailsSheet(data);
    const csvContent = quizDetailsData.map(row => 
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `答题结果_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportToHTML = (data: ExportData) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>答题结果报告</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            padding-bottom: 100px; /* 为悬浮分页控制留出空间 */
        }
        
        body.no-pagination { 
            padding-bottom: 20px; /* 当没有分页时减少底部空间 */
        }
        .header { text-align: center; margin-bottom: 30px; }
        .header .export-buttons { margin-top: 15px; }
        .export-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            margin: 0 5px;
        }
        .theme-toggle {
            background: #111827;
            color: #f9fafb;
        }
        .theme-toggle:hover {
            background: #0b1220;
            transform: translateY(-1px);
        }
        .excel-btn {
            background: #217346;
            color: white;
        }
        .excel-btn:hover {
            background: #1e6b3d;
            transform: translateY(-1px);
        }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 2em; font-weight: bold; color: #007bff; }
        .stat-label { color: #6c757d; margin-top: 5px; }
        
        .filters { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            margin-bottom: 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            align-items: center;
        }
        .filter-group { display: flex; align-items: center; gap: 10px; }
        .filter-group label { font-weight: bold; margin-right: 5px; }
        .filter-group select, .filter-group input { padding: 5px; border: 1px solid #ddd; border-radius: 4px; }
        .filter-group input[type="checkbox"] { margin: 0; }
        
        .pagination-controls {
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 12px 20px;
            border-radius: 12px;
            margin-bottom: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(222, 226, 230, 0.8);
            z-index: 1000;
            min-width: auto;
            max-width: 90vw;
        }
        
        /* 深色主题支持 */
        @media (prefers-color-scheme: dark) {
            .pagination-controls {
                background: rgba(31, 41, 55, 0.95);
                border: 1px solid rgba(75, 85, 99, 0.8);
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            }
        }
        
        .pagination-info {
            display: none;
        }
        
        .pagination-buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
        }
        
        .pagination-btn {
            padding: 8px 12px;
            border: none;
            background: #e5e7eb;
            color: #374151;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 36px;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
        }
        
        .pagination-btn:hover:not(.hidden) {
            background: #d1d5db;
        }
        
        .pagination-btn.hidden {
            display: none;
        }
        
        .page-numbers {
            display: flex;
            gap: 4px;
        }
        
        .page-number {
            padding: 8px 12px;
            border: none;
            background: #e5e7eb;
            color: #374151;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 40px;
            text-align: center;
            font-size: 14px;
            font-weight: 500;
        }
        
        .page-number:hover {
            background: #d1d5db;
        }
        
        .page-number.active {
            background: #3b82f6;
            color: white;
        }
        
        /* 深色主题下的页码按钮样式 */
        @media (prefers-color-scheme: dark) {
            .page-number {
                background: #4b5563;
                color: #d1d5db;
            }
            
            .page-number:hover {
                background: #6b7280;
            }
            
            .page-number.active {
                background: #3b82f6;
                color: white;
            }
            
            .pagination-btn {
                background: #4b5563;
                color: #d1d5db;
            }
            
            .pagination-btn:hover:not(.hidden) {
                background: #6b7280;
            }
        }
        
        .question { margin-bottom: 20px; padding: 15px; border: 1px solid #dee2e6; border-radius: 8px; }
        .correct { border-left: 4px solid #28a745; background: #d4edda; }
        .incorrect { border-left: 4px solid #dc3545; background: #f8d7da; }
        .question-header { display: flex; justify-content-between; align-items: center; margin-bottom: 10px; }
        .question-type { background: #6c757d; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em; }
        .options { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .option { 
            margin: 5px 0; 
            padding: 12px; 
            border-radius: 8px; 
            border: 1px solid #e5e7eb; 
            display: flex; 
            align-items: center; 
            justify-content: space-between; 
        }
        .option.correct-option { 
            background: #d1fae5; 
            border-color: #10b981; 
            color: #065f46; 
        }
        .option.user-option { 
            background: #fef3c7; 
            border-color: #f59e0b; 
            color: #92400e; 
        }
        .option.correct-option.user-option { 
            background: #d1fae5; 
            border-color: #10b981; 
            color: #065f46; 
        }
        .option .user-badge {
            padding: 2px 8px;
            background: #f59e0b;
            color: #92400e;
            border-radius: 12px;
            font-size: 0.75em;
            font-weight: 500;
        }
        .answer { margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .user-answer { color: #dc3545; }
        .correct-answer { color: #28a745; }
        .explanation { margin-top: 10px; font-style: italic; color: #6c757d; }
        .hidden { display: none; }
        
        .no-results { text-align: center; padding: 40px; color: #6c757d; font-style: italic; }
        
        /* 主题：深色模式覆盖 */
        body.theme-dark { background: #111827; color: #e5e7eb; }
        body.theme-dark .stat-card { background: #1f2937; color: #e5e7eb; }
        body.theme-dark .stats .stat-value { color: #60a5fa; }
        body.theme-dark .filters { background: #1f2937; border-color: #374151; }
        body.theme-dark .filter-group select, body.theme-dark .filter-group input { background: #111827; color: #e5e7eb; border-color: #374151; }
        body.theme-dark .question { background: #111827; border-color: #374151; }
        body.theme-dark .question-type { background: #374151; color: #e5e7eb; }
        body.theme-dark .options { background: #1f2937; }
        body.theme-dark .option { border-color: #4b5563; color: #e5e7eb; }
        body.theme-dark .answer { background: #1f2937; }
        body.theme-dark .explanation { color: #9ca3af; }
        body.theme-dark .pagination-controls { background: rgba(31, 41, 55, 0.95); border: 1px solid rgba(75, 85, 99, 0.8); }
        body.theme-dark .page-number { background: #4b5563; color: #d1d5db; }
        body.theme-dark .page-number:hover { background: #6b7280; }
        body.theme-dark .page-number.active { background: #3b82f6; color: #fff; }
        body.theme-dark .pagination-btn { background: #4b5563; color: #d1d5db; }
        body.theme-dark .pagination-btn:hover:not(.hidden) { background: #6b7280; }
        body.theme-dark .scroll-button { background: #3b82f6; color: white; }
        body.theme-dark .scroll-button:hover { background: #2563eb; }
        /* 深色模式下：题块与选项的正确/错误配色 */
        body.theme-dark .question.correct { background: rgba(16, 185, 129, 0.1); border-left-color: #10b981; }
        body.theme-dark .question.incorrect { background: rgba(239, 68, 68, 0.12); border-left-color: #ef4444; }
        body.theme-dark .option.correct-option { background: rgba(16, 185, 129, 0.15); border-color: #10b981; color: #d1fae5; }
        body.theme-dark .option.user-option { background: rgba(245, 158, 11, 0.15); border-color: #f59e0b; color: #fde68a; }
        body.theme-dark .option.correct-option.user-option { background: rgba(16, 185, 129, 0.2); border-color: #10b981; color: #a7f3d0; }
        body.theme-dark .option .user-badge { background: #f59e0b; color: #111827; }
        body.theme-dark .user-answer { color: #f87171; }
        body.theme-dark .correct-answer { color: #34d399; }
        
        /* 滚动跳转按钮样式 */
        .scroll-buttons {
            position: fixed;
            right: 20px;
            bottom: 120px;
            z-index: 1000;
        }
        
        .scroll-button {
            width: 40px;
            height: 40px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .scroll-button:hover {
            background: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }
        
        .scroll-button.hidden {
            display: none;
        }
        
        /* 深色主题支持 */
        @media (prefers-color-scheme: dark) {
            .scroll-button {
                background: #3b82f6;
                color: white;
            }
            
            .scroll-button:hover {
                background: #2563eb;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>答题结果报告</h1>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
        <div class="export-buttons">
            <button onclick="exportToExcel()" class="export-btn excel-btn">
                📊 导出到Excel
            </button>
            <button id="themeToggle" onclick="toggleTheme()" class="export-btn theme-toggle" title="切换主题">🌙 深色</button>
        </div>
    </div>

    <div class="stats">
        <div class="stat-card">
            <div class="stat-value">${data.stats.total}</div>
            <div class="stat-label">总题目数</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.stats.correct}</div>
            <div class="stat-label">答对题目</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.stats.incorrect}</div>
            <div class="stat-label">答错题目</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${data.stats.accuracy}%</div>
            <div class="stat-label">正确率</div>
        </div>
        ${data.settings.mode === 'exam' && data.examSettings && data.stats.totalScore !== undefined ? `
        <div class="stat-card">
            <div class="stat-value">${Number(data.stats.totalScore).toFixed(1)}/${Number(data.stats.maxScore).toFixed(1)}</div>
            <div class="stat-label">得分/满分</div>
        </div>
        ` : ''}
    </div>

    <div class="filters">
        <div class="filter-group">
            <label>正确性筛选:</label>
            <select id="correctnessFilter">
                <option value="all">全部</option>
                <option value="correct">正确</option>
                <option value="incorrect">错误</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label>题型筛选:</label>
            <select id="typeFilter">
                <option value="all">全部题型</option>
                <option value="单选题">单选题</option>
                <option value="多选题">多选题</option>
                <option value="判断题">判断题</option>
                <option value="填空题">填空题</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label>每页显示:</label>
            <select id="pageSize">
                <option value="10">10题</option>
                <option value="20">20题</option>
                <option value="50">50题</option>
                <option value="100">100题</option>
                <option value="all">全部</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label><input type="checkbox" id="showOptions"> 显示所有选项</label>
        </div>
        
        <div class="filter-group">
            <label><input type="checkbox" id="showExplanation"> 显示解析</label>
        </div>
    </div>

    <div class="pagination-controls">
        <div class="pagination-buttons">
            <button id="firstPage" class="pagination-btn" onclick="goToPage(1)" title="首页">&lt;&lt</button>
            <button id="prevPage" class="pagination-btn" onclick="goToPage(currentPage - 1)" title="上一页">&lt;</button>
            <div class="page-numbers" id="pageNumbers"></div>
            <button id="nextPage" class="pagination-btn" onclick="goToPage(currentPage + 1)" title="下一页">&gt;</button>
            <button id="lastPage" class="pagination-btn" onclick="goToPage(totalPages)" title="尾页">&gt;&gt</button>
        </div>
    </div>
    
    <!-- 滚动跳转按钮 -->
    <div class="scroll-buttons">
        <button id="scrollTopBtn" class="scroll-button hidden" onclick="scrollToTop()" title="回到顶部">↑</button>
        <button id="scrollBottomBtn" class="scroll-button hidden" onclick="scrollToBottom()" title="跳转到底部">↓</button>
    </div>

    <h2>详细答题记录</h2>
    <div id="questionsContainer">
        ${data.questions.map((question, index) => {
            const result = data.results[index];
            
            // 处理选项显示 - 判断题使用自定义选项
            const questionOptions = question.type === '判断题' 
                ? [data.settings.judgementTrue, data.settings.judgementFalse]
                : question.options;
            
            const optionsHtml = questionOptions.length > 0 ? `
                <div class="options">
                    <strong>选项:</strong>
                    ${questionOptions.map((option, optIndex) => {
                        const letter = String.fromCharCode(65 + optIndex);
                        
                        // 判断是否为正确答案
                        let isCorrect = false;
                        if (question.type === '判断题') {
                            const correctAnswerFormatted = formatCorrectAnswer(question, data.settings);
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
                            const userAnswerFormatted = formatJudgmentAnswer(result.userAnswer, question, data.settings);
                            isUserAnswer = option === userAnswerFormatted;
                        } else {
                            isUserAnswer = !!(result.userAnswer && result.userAnswer.includes(letter));
                        }
                        
                        let className = 'option';
                        if (isCorrect) className += ' correct-option';
                        if (isUserAnswer) className += ' user-option';
                        
                        const userBadge = isUserAnswer ? '<span class="user-badge">您的选择</span>' : '';
                        return `<div class="${className}">
                            <span>${letter}. ${option}</span>
                            ${userBadge}
                        </div>`;
                    }).join('')}
                </div>
            ` : '';
            
            // 格式化用户答案和正确答案
            const formattedUserAnswer = formatJudgmentAnswer(result.userAnswer, question, data.settings);
            const formattedCorrectAnswer = formatCorrectAnswer(question, data.settings);
            
            return `
            <div class="question ${result.isCorrect ? 'correct' : 'incorrect'}" 
                 data-correctness="${result.isCorrect ? 'correct' : 'incorrect'}" 
                 data-type="${question.type}">
                <div class="question-header">
                    <h3>第 ${index + 1} 题</h3>
                    <span class="question-type">${question.type}</span>
                </div>
                <p>${question.text}</p>
                <div class="options-container hidden">${optionsHtml}</div>
                <div class="answer">
                    <div class="user-answer"><strong>您的答案:</strong> ${formattedUserAnswer}</div>
                    <div class="correct-answer"><strong>正确答案:</strong> ${formattedCorrectAnswer}</div>
                </div>
                <div class="explanation-container hidden">
                    ${question.explanation ? `<div class="explanation"><strong>解析:</strong> ${question.explanation}</div>` : '<div class="explanation"></div>'}
                </div>
            </div>
            `;
        }).join('')}
    </div>
    
    <div id="noResults" class="no-results hidden">
        没有找到符合条件的题目
    </div>

    <script src="https://cdn.sheetjs.com/xlsx-0.19.3/package/dist/xlsx.full.min.js"></script>
    <script>
        // 分页相关变量
        let currentPage = 1;
        let totalPages = 1;
        let pageSize = 10;
        let filteredQuestions = [];
        
        // 滚动按钮相关变量
        let showScrollTop = false;
        let showScrollBottom = false;

        // 主题
        function applyTheme(theme) {
            const toggleBtn = document.getElementById('themeToggle');
            if (theme === 'dark') {
                document.body.classList.add('theme-dark');
                localStorage.setItem('reportTheme', 'dark');
                if (toggleBtn) toggleBtn.textContent = '☀️ 浅色';
            } else {
                document.body.classList.remove('theme-dark');
                localStorage.setItem('reportTheme', 'light');
                if (toggleBtn) toggleBtn.textContent = '🌙 深色';
            }
        }
        function toggleTheme() {
            const isDark = document.body.classList.contains('theme-dark');
            applyTheme(isDark ? 'light' : 'dark');
        }
        
        // 导出Excel功能
        function exportToExcel() {
            // 获取页面数据
            const questions = [];
            const results = [];
            const stats = {};
            
            // 从页面提取统计数据
            const statCards = document.querySelectorAll('.stat-card');
            statCards.forEach(card => {
                const value = card.querySelector('.stat-value').textContent;
                const label = card.querySelector('.stat-label').textContent;
                stats[label] = value;
            });
            
            // 从页面提取题目数据
            const questionElements = document.querySelectorAll('.question');
            questionElements.forEach((element, index) => {
                const questionText = element.querySelector('p').textContent;
                const questionType = element.querySelector('.question-type').textContent;
                const userAnswer = element.querySelector('.user-answer').textContent.replace('您的答案: ', '');
                const correctAnswer = element.querySelector('.correct-answer').textContent.replace('正确答案: ', '');
                const isCorrect = element.classList.contains('correct');
                
                // 提取解析
                let explanation = '';
                const explanationElement = element.querySelector('.explanation');
                if (explanationElement) {
                    explanation = explanationElement.textContent.replace('解析:', '').trim();
                }
                
                // 提取选项
                const options = [];
                const optionElements = element.querySelectorAll('.option');
                optionElements.forEach(opt => {
                    const optionText = opt.querySelector('span').textContent;
                    options.push(optionText);
                });
                
                questions.push({
                    id: index + 1,
                    text: questionText,
                    type: questionType,
                    options: options,
                    answer: correctAnswer,
                    explanation: explanation
                });
                
                results.push({
                    questionId: index + 1,
                    isCorrect: isCorrect,
                    userAnswer: userAnswer,
                    correctAnswer: correctAnswer,
                    questionType: questionType,
                    explanation: explanation
                });
            });
            
            // 创建工作簿
            const workbook = XLSX.utils.book_new();
            
            // 创建答题情况工作表
            const quizDetailsData = [
                ['题号', '题目类型', '题目内容', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '您的答案', '正确答案', '是否正确', '解析']
            ];
            
            questions.forEach((question, index) => {
                const result = results[index];
                const row = [
                    String(index + 1),
                    question.type,
                    question.text,
                    question.options[0] || '',
                    question.options[1] || '',
                    question.options[2] || '',
                    question.options[3] || '',
                    question.options[4] || '',
                    question.options[5] || '',
                    result.userAnswer,
                    result.correctAnswer,
                    result.isCorrect ? '正确' : '错误',
                    result.explanation || ''
                ];
                quizDetailsData.push(row);
            });
            
            const quizDetailsSheet = XLSX.utils.aoa_to_sheet(quizDetailsData);
            XLSX.utils.book_append_sheet(workbook, quizDetailsSheet, '答题情况');
            
            // 创建答题总结工作表
            const quizSummaryData = [
                ['答题总结报告'],
                [''],
                ['总体统计'],
                ['总题目数', stats['总题目数'] || ''],
                ['答对题目', stats['答对题目'] || ''],
                ['答错题目', stats['答错题目'] || ''],
                ['正确率', stats['正确率'] || '']
            ];
            
            quizSummaryData.push(['']);
            quizSummaryData.push(['题型统计']);
            quizSummaryData.push(['题型', '题目数量', '答对数量', '正确率']);
            
            // 按题型统计
            const typeStats = {};
            questions.forEach((question, index) => {
                const result = results[index];
                const type = question.type;
                if (!typeStats[type]) {
                    typeStats[type] = { total: 0, correct: 0 };
                }
                typeStats[type].total++;
                if (result.isCorrect) {
                    typeStats[type].correct++;
                }
            });
            
            Object.entries(typeStats).forEach(function(entry) {
                const type = entry[0];
                const typeStat = entry[1];
                const accuracy = ((typeStat.correct / typeStat.total) * 100).toFixed(1);
                
                quizSummaryData.push([
                    type,
                    typeStat.total,
                    typeStat.correct,
                    accuracy + '%'
                ]);
            });
            
            quizSummaryData.push(['']);
            quizSummaryData.push(['答题时间', new Date().toLocaleString('zh-CN')]);
            
            const quizSummarySheet = XLSX.utils.aoa_to_sheet(quizSummaryData);
            XLSX.utils.book_append_sheet(workbook, quizSummarySheet, '答题总结');
            
            // 导出Excel文件
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', '答题结果_' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.xlsx');
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        
        // 筛选功能
        function filterQuestions() {
            const correctnessFilter = document.getElementById('correctnessFilter').value;
            const typeFilter = document.getElementById('typeFilter').value;
            const pageSizeValue = document.getElementById('pageSize').value;
            const showOptions = document.getElementById('showOptions').checked;
            const showExplanation = document.getElementById('showExplanation').checked;
            
            // 更新分页设置
            pageSize = pageSizeValue === 'all' ? Infinity : parseInt(pageSizeValue);
            
            const questions = document.querySelectorAll('.question');
            filteredQuestions = [];
            
            questions.forEach(question => {
                const correctness = question.getAttribute('data-correctness');
                const type = question.getAttribute('data-type');
                
                let shouldShow = true;
                
                // 正确性筛选
                if (correctnessFilter !== 'all' && correctness !== correctnessFilter) {
                    shouldShow = false;
                }
                
                // 题型筛选
                if (typeFilter !== 'all' && type !== typeFilter) {
                    shouldShow = false;
                }
                
                if (shouldShow) {
                    filteredQuestions.push(question);
                }
                
                // 选项显示控制
                const optionsContainer = question.querySelector('.options-container');
                if (showOptions) {
                    optionsContainer.classList.remove('hidden');
                } else {
                    optionsContainer.classList.add('hidden');
                }
                
                // 解析显示控制
                const explanationContainer = question.querySelector('.explanation-container');
                if (showExplanation) {
                    explanationContainer.classList.remove('hidden');
                } else {
                    explanationContainer.classList.add('hidden');
                }
            });
            
            // 重置到第一页
            currentPage = 1;
            
            // 计算总页数
            totalPages = pageSize === Infinity ? 1 : Math.ceil(filteredQuestions.length / pageSize);
            
            // 更新分页显示
            updatePagination();
            
            // 显示当前页的题目
            showCurrentPage();
        }
        
        // 更新分页显示
        function updatePagination() {
            // 更新分页按钮状态
            updatePaginationButtons();
        }
        
        // 更新分页按钮状态
        function updatePaginationButtons() {
            const pageNumbers = document.getElementById('pageNumbers');
            const firstPageBtn = document.getElementById('firstPage');
            const prevPageBtn = document.getElementById('prevPage');
            const nextPageBtn = document.getElementById('nextPage');
            const lastPageBtn = document.getElementById('lastPage');
            const paginationControls = document.querySelector('.pagination-controls');
            
            // 生成页码按钮
            pageNumbers.innerHTML = '';
            
            if (pageSize === Infinity) {
                // 如果显示全部，隐藏整个页面选择器
                paginationControls.classList.add('hidden');
                document.body.classList.add('no-pagination');
                return;
            } else {
                // 显示页面选择器
                paginationControls.classList.remove('hidden');
                document.body.classList.remove('no-pagination');
            }
            
            // 显示所有分页按钮
            firstPageBtn.classList.remove('hidden');
            prevPageBtn.classList.remove('hidden');
            nextPageBtn.classList.remove('hidden');
            lastPageBtn.classList.remove('hidden');
            
            const maxVisiblePages = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
            let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
            
            // 调整起始页，确保显示足够的页码
            if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
            }
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-number ' + (i === currentPage ? 'active' : '');
                pageBtn.textContent = i;
                pageBtn.onclick = function() { goToPage(i); };
                pageNumbers.appendChild(pageBtn);
            }
            
            // 更新首页/上一页按钮状态
            if (currentPage === 1) {
                firstPageBtn.classList.add('hidden');
                prevPageBtn.classList.add('hidden');
            } else {
                firstPageBtn.classList.remove('hidden');
                prevPageBtn.classList.remove('hidden');
            }
            
            // 更新下一页/尾页按钮状态
            if (currentPage === totalPages) {
                nextPageBtn.classList.add('hidden');
                lastPageBtn.classList.add('hidden');
            } else {
                nextPageBtn.classList.remove('hidden');
                lastPageBtn.classList.remove('hidden');
            }
        }
        
        // 显示当前页的题目
        function showCurrentPage() {
            const questions = document.querySelectorAll('.question');
            
            // 先隐藏所有题目
            questions.forEach(question => {
                question.classList.add('hidden');
            });
            
            // 显示当前页的题目
            if (pageSize === Infinity) {
                // 显示所有筛选后的题目
                filteredQuestions.forEach(question => {
                    question.classList.remove('hidden');
                });
            } else {
                const startIndex = (currentPage - 1) * pageSize;
                const endIndex = Math.min(startIndex + pageSize, filteredQuestions.length);
                
                for (let i = startIndex; i < endIndex; i++) {
                    if (filteredQuestions[i]) {
                        filteredQuestions[i].classList.remove('hidden');
                    }
                }
            }
            
            // 显示/隐藏无结果提示
            const noResults = document.getElementById('noResults');
            if (filteredQuestions.length === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
            }
        }
        
        // 跳转到指定页面
        function goToPage(page) {
            if (page < 1 || page > totalPages) return;
            
            currentPage = page;
            showCurrentPage();
            updatePagination();
        }
        
        // 滚动到顶部
        function scrollToTop() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // 滚动到底部
        function scrollToBottom() {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
        }
        
        // 更新滚动按钮显示状态
        function updateScrollButtons() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            
            const scrollTopBtn = document.getElementById('scrollTopBtn');
            const scrollBottomBtn = document.getElementById('scrollBottomBtn');
            
            // 显示/隐藏回到顶部按钮
            if (scrollTop > 300) {
                scrollTopBtn.classList.remove('hidden');
                showScrollTop = true;
            } else {
                scrollTopBtn.classList.add('hidden');
                showScrollTop = false;
            }
            
            // 显示/隐藏跳转到底部按钮
            if (scrollTop + windowHeight < documentHeight - 100) {
                scrollBottomBtn.classList.remove('hidden');
                showScrollBottom = true;
            } else {
                scrollBottomBtn.classList.add('hidden');
                showScrollBottom = false;
            }
        }
        
        // 绑定事件监听器
        document.getElementById('correctnessFilter').addEventListener('change', filterQuestions);
        document.getElementById('typeFilter').addEventListener('change', filterQuestions);
        document.getElementById('pageSize').addEventListener('change', filterQuestions); // 添加页面大小筛选器
        document.getElementById('showOptions').addEventListener('change', filterQuestions);
        document.getElementById('showExplanation').addEventListener('change', filterQuestions);
        
        // 初始化筛选
        filterQuestions();
        
        // 初始化时检查页面大小，确保页面选择器状态正确
        if (pageSize === Infinity) {
            document.body.classList.add('no-pagination');
        }
        
        // 绑定滚动事件监听器
        window.addEventListener('scroll', updateScrollButtons, { passive: true });
        
        // 初始化滚动按钮状态
        updateScrollButtons();

        // 初始化主题
        (function initTheme(){
            try {
                const saved = localStorage.getItem('reportTheme');
                if (saved === 'dark' || saved === 'light') {
                    applyTheme(saved);
                } else {
                    // 默认遵循系统主题
                    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
                    applyTheme(prefersDark ? 'dark' : 'light');
                }
            } catch (e) {
                applyTheme('light');
            }
        })();
    </script>
</body>
</html>`;

  // 创建下载链接
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `答题结果_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.html`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}; 