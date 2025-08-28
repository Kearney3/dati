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
    ['题号', '题目类型', '题目内容', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '您的答案', '正确答案', '是否正确', '解析']
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
    ['题型', '题目数量', '答对数量', '正确率']
  ];

  // 按题型统计
  const typeStats: { [key: string]: { total: number; correct: number } } = {};
  data.questions.forEach((question, index) => {
    const result = data.results[index];
    const type = question.type;
    if (!typeStats[type]) {
      typeStats[type] = { total: 0, correct: 0 };
    }
    typeStats[type].total++;
    if (result.isCorrect) {
      typeStats[type].correct++;
    }
  });

  // 添加题型统计
  Object.entries(typeStats).forEach(([type, stats]) => {
    const accuracy = ((stats.correct / stats.total) * 100).toFixed(1);
    sheetData.push([
      type,
      stats.total,
      stats.correct,
      `${accuracy}%`
    ]);
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
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
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
    </style>
</head>
<body>
    <div class="header">
        <h1>答题结果报告</h1>
        <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
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
            <label><input type="checkbox" id="showOptions"> 显示所有选项</label>
        </div>
        
        <div class="filter-group">
            <label><input type="checkbox" id="showExplanation"> 显示解析</label>
        </div>
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
                    ${question.explanation ? `<div class="explanation"><strong>解析:</strong> ${question.explanation}</div>` : '<div class="explanation">暂无解析</div>'}
                </div>
            </div>
            `;
        }).join('')}
    </div>
    
    <div id="noResults" class="no-results hidden">
        没有找到符合条件的题目
    </div>

    <script>
        // 筛选功能
        function filterQuestions() {
            const correctnessFilter = document.getElementById('correctnessFilter').value;
            const typeFilter = document.getElementById('typeFilter').value;
            const showOptions = document.getElementById('showOptions').checked;
            const showExplanation = document.getElementById('showExplanation').checked;
            
            const questions = document.querySelectorAll('.question');
            let visibleCount = 0;
            
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
                    question.classList.remove('hidden');
                    visibleCount++;
                } else {
                    question.classList.add('hidden');
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
            
            // 显示/隐藏无结果提示
            const noResults = document.getElementById('noResults');
            if (visibleCount === 0) {
                noResults.classList.remove('hidden');
            } else {
                noResults.classList.add('hidden');
            }
        }
        
        // 绑定事件监听器
        document.getElementById('correctnessFilter').addEventListener('change', filterQuestions);
        document.getElementById('typeFilter').addEventListener('change', filterQuestions);
        document.getElementById('showOptions').addEventListener('change', filterQuestions);
        document.getElementById('showExplanation').addEventListener('change', filterQuestions);
        
        // 初始化筛选
        filterQuestions();
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