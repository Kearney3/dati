import { useState } from 'react';
import { ThemeToggle } from './components/ThemeToggle';
import { FileUpload } from './components/FileUpload';
import { HeaderMapping } from './components/HeaderMapping';
import { SheetSelector } from './components/SheetSelector';
import { QuizSettings } from './components/QuizSettings';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { getSheetData, processMultiSheetQuestions, autoMapHeaders } from './utils/excel';
import { generateQuizData, calculateResults } from './utils/quiz';
import { Question, QuizSettings as QuizSettingsType, HeaderMapping as HeaderMappingType, QuestionResult, ExamSettings, MultiSheetConfig, SheetConfig } from './types';

type Screen = 'upload' | 'config' | 'quiz' | 'results' | 'review';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('upload');
  const [workbook, setWorkbook] = useState<any>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<HeaderMappingType>>({});
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);
  const [settings, setSettings] = useState<QuizSettingsType>({
    mode: 'quiz',
    orderMode: 'sequential',
    limit: 0,
    judgementTrue: '正确',
    judgementFalse: '错误',
    questionRanges: [],
    useCustomRanges: false
  });
  const [quizState, setQuizState] = useState({
    currentQuestionIndex: 0,
    userAnswers: [] as (string | null)[],
    questionResults: [] as QuestionResult[],
    isCompleted: false
  });
  const [examSettings, setExamSettings] = useState<ExamSettings | undefined>(undefined);
  
  // 新增：多工作表配置状态
  const [multiSheetConfig, setMultiSheetConfig] = useState<MultiSheetConfig>({
    sheets: [],
    globalMapping: {},
    useGlobalMapping: false
  });

  const handleFileLoaded = (workbook: any) => {
    setWorkbook(workbook);
    setSheetNames(workbook.SheetNames);
    
    // 初始化多工作表配置
    const initialSheets: SheetConfig[] = workbook.SheetNames.map((sheetName: string) => {
      const { jsonData, headers } = getSheetData(workbook, sheetName);
      // 自动映射表头
      const autoMapping = autoMapHeaders(headers || []);
      return {
        sheetName,
        isSelected: false,
        mapping: autoMapping,
        useGlobalMapping: true,
        questionCount: jsonData.length
      };
    });
    
    // 使用第一个工作表的自动映射作为全局映射
    const firstSheetHeaders = getSheetData(workbook, workbook.SheetNames[0]).headers;
    const globalMapping = autoMapHeaders(firstSheetHeaders || []);
    
    setMultiSheetConfig({
      sheets: initialSheets,
      globalMapping,
      useGlobalMapping: false
    });
    
    setCurrentScreen('config');
  };

  const handleMultiSheetConfigChange = (config: MultiSheetConfig) => {
    setMultiSheetConfig(config);
    
    // 更新题目数量统计
    updateQuestionCounts(config);
  };

  const updateQuestionCounts = (config: MultiSheetConfig) => {
    const selectedSheets = config.sheets.filter(sheet => sheet.isSelected);
    if (selectedSheets.length === 0) {
      setQuestions([]);
      setHeaders([]);
      return;
    }

    // 获取第一个选中工作表的表头用于显示
    const firstSelectedSheet = selectedSheets[0];
    const { headers } = getSheetData(workbook, firstSelectedSheet.sheetName);
    setHeaders(headers || []);

    // 如果使用全局映射，更新当前映射
    if (config.useGlobalMapping) {
      setMapping(config.globalMapping);
    } else {
      // 使用第一个选中工作表的映射
      const firstSheet = selectedSheets.find(sheet => !sheet.useGlobalMapping) || selectedSheets[0];
      setMapping(firstSheet.mapping);
    }

    // 处理所有选中工作表的数据
    const allQuestions = processMultiSheetQuestions(workbook, selectedSheets, config.globalMapping);
    setQuestions(allQuestions);
  };

  const handleMappingChange = (mapping: Partial<HeaderMappingType>) => {
    setMapping(mapping);
    
    // 如果当前使用全局映射，则更新全局映射
    if (multiSheetConfig.useGlobalMapping) {
      setMultiSheetConfig(prev => ({
        ...prev,
        globalMapping: mapping
      }));
    } else {
      // 更新当前选中工作表的映射
      const selectedSheets = multiSheetConfig.sheets.filter(sheet => sheet.isSelected);
      if (selectedSheets.length > 0) {
        const firstSelectedSheet = selectedSheets[0];
        setMultiSheetConfig(prev => ({
          ...prev,
          sheets: prev.sheets.map(sheet => 
            sheet.sheetName === firstSelectedSheet.sheetName
              ? { ...sheet, mapping }
              : sheet
          )
        }));
      }
    }
  };

  const handleGlobalMappingToggle = () => {
    const newUseGlobalMapping = !multiSheetConfig.useGlobalMapping;
    setMultiSheetConfig(prev => ({
      ...prev,
      useGlobalMapping: newUseGlobalMapping
    }));
    
    // 切换时更新当前映射
    if (newUseGlobalMapping) {
      setMapping(multiSheetConfig.globalMapping);
    } else {
      const selectedSheets = multiSheetConfig.sheets.filter(sheet => sheet.isSelected);
      if (selectedSheets.length > 0) {
        const firstSheet = selectedSheets.find(sheet => !sheet.useGlobalMapping) || selectedSheets[0];
        setMapping(firstSheet.mapping);
      }
    }
  };

  const handleStartQuiz = () => {
    const selectedSheets = multiSheetConfig.sheets.filter(sheet => sheet.isSelected);
    
    if (selectedSheets.length === 0) {
      alert('请至少选择一个工作表');
      return;
    }

    // 检查全局映射是否配置完整
    if (multiSheetConfig.useGlobalMapping) {
      if (!multiSheetConfig.globalMapping.question || !multiSheetConfig.globalMapping.type || !multiSheetConfig.globalMapping.answer) {
        alert('请完成全局表头映射配置');
        return;
      }
    } else {
      // 检查每个选中的工作表是否配置完整
      const incompleteSheets = selectedSheets.filter(sheet => 
        !sheet.useGlobalMapping && (!sheet.mapping.question || !sheet.mapping.type || !sheet.mapping.answer)
      );
      
      if (incompleteSheets.length > 0) {
        alert(`以下工作表的表头映射配置不完整：${incompleteSheets.map(s => s.sheetName).join(', ')}`);
        return;
      }
    }

    // 检查考试配置
    if (settings.mode === 'exam' && examSettings) {
      const totalExamQuestions = examSettings.totalQuestions;
      if (totalExamQuestions === 0) {
        alert('考试配置中题目数量为0，请设置题目数量');
        return;
      }
      
      // 检查每种题型是否都有配置
      const invalidConfigs = examSettings.configs.filter(config => 
        config.count > 0 && config.count > questions.filter(q => q.type === config.questionType).length
      );
      
      if (invalidConfigs.length > 0) {
        alert(`以下题型的配置超出实际题目数量：${invalidConfigs.map(c => c.questionType).join(', ')}`);
        return;
      }
    }

    // 使用新的多工作表处理函数
    const allQuestions = processMultiSheetQuestions(workbook, selectedSheets, multiSheetConfig.globalMapping);
    
    if (allQuestions.length === 0) {
      alert('无法生成题库，请检查Excel内容或表头映射是否正确！');
      return;
    }

    setQuestions(allQuestions);
    const generatedQuiz = generateQuizData(allQuestions, settings, examSettings);
    setQuizQuestions(generatedQuiz);
    setQuizState({
      currentQuestionIndex: 0,
      userAnswers: new Array(generatedQuiz.length).fill(null),
      questionResults: [],
      isCompleted: false
    });
    setCurrentScreen('quiz');
  };

  const handleQuizComplete = () => {
    const results = calculateResults(quizQuestions, quizState.userAnswers, settings);
    setQuizState(prev => ({
      ...prev,
      questionResults: results,
      isCompleted: true
    }));
    setCurrentScreen('results');
  };

  const handleRetry = () => {
    const generatedQuiz = generateQuizData(questions, settings, examSettings);
    setQuizQuestions(generatedQuiz);
    setQuizState({
      currentQuestionIndex: 0,
      userAnswers: new Array(generatedQuiz.length).fill(null),
      questionResults: [],
      isCompleted: false
    });
    setCurrentScreen('quiz');
  };

  const handleBackToUpload = () => {
    setCurrentScreen('upload');
    // 保留workbook、sheetNames、selectedSheet、headers、mapping、questions
    // 只重置答题相关状态
    setQuizQuestions([]);
    setQuizState({
      currentQuestionIndex: 0,
      userAnswers: [],
      questionResults: [],
      isCompleted: false
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <ThemeToggle />
      
      <div className="container mx-auto px-4 py-8">
        {currentScreen === 'upload' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                智能答题系统
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {workbook ? '继续配置题库' : '上传您的Excel题库，开启个性化刷题之旅'}
              </p>
            </div>
            {workbook ? (
              <div className="text-center">
                <div className="card p-8 mb-6">
                  <div className="mb-4">
                    <div className="text-4xl mb-4">📊</div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                      已上传题库文件
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      包含 {sheetNames.length} 个工作表
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentScreen('config')}
                    className="btn btn-primary"
                  >
                    继续配置
                  </button>
                </div>
                <button
                  onClick={() => {
                    setWorkbook(null);
                    setSheetNames([]);
                    setHeaders([]);
                    setMapping({});
                    setQuestions([]);
                    setMultiSheetConfig({
                      sheets: [],
                      globalMapping: {},
                      useGlobalMapping: false
                    });
                  }}
                  className="btn btn-secondary"
                >
                  重新上传文件
                </button>
              </div>
            ) : (
              <FileUpload onFileLoaded={handleFileLoaded} />
            )}
          </div>
        )}

        {currentScreen === 'config' && (
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                配置题库
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                选择工作表并配置表头映射
              </p>
            </div>

            {/* 工作表选择 */}
            <div className="card p-6">
              <SheetSelector
                sheetNames={sheetNames}
                multiSheetConfig={multiSheetConfig}
                onMultiSheetConfigChange={handleMultiSheetConfigChange}
                workbook={workbook}
              />
            </div>

            {/* 表头映射 */}
            {multiSheetConfig.sheets.some(sheet => sheet.isSelected) && (
              <div className="card p-6">
                <HeaderMapping
                  headers={headers}
                  mapping={mapping}
                  onMappingChange={handleMappingChange}
                  isGlobalMapping={multiSheetConfig.useGlobalMapping}
                  onGlobalMappingToggle={handleGlobalMappingToggle}
                />
              </div>
            )}

            {/* 答题设置 */}
            {multiSheetConfig.sheets.some(sheet => sheet.isSelected) && (
              <div className="card p-6">
                <QuizSettings
                  settings={settings}
                  onSettingsChange={setSettings}
                  questionTypes={questions.map(q => q.type)}
                  onExamSettingsChange={setExamSettings}
                  totalQuestions={questions.length}
                  selectedSheets={multiSheetConfig.sheets.filter(sheet => sheet.isSelected)}
                  questions={questions}
                />
              </div>
            )}

            {/* 开始按钮 */}
            {multiSheetConfig.sheets.some(sheet => sheet.isSelected) && (
              <div className="text-center">
                <button
                  onClick={handleStartQuiz}
                  className="btn btn-primary text-lg px-8 py-3"
                >
                  开始答题
                </button>
              </div>
            )}
          </div>
        )}

        {currentScreen === 'quiz' && (
          <QuizScreen
            questions={quizQuestions}
            settings={settings}
            quizState={quizState}
            onQuizStateChange={setQuizState}
            onComplete={handleQuizComplete}
            onExit={handleBackToUpload}
          />
        )}

        {currentScreen === 'results' && (
          <ResultsScreen
            questions={quizQuestions}
            results={quizState.questionResults}
            settings={settings}
            examSettings={examSettings}
            onRetry={handleRetry}
            onReview={() => setCurrentScreen('review')}
            onBackToUpload={handleBackToUpload}
          />
        )}

        {currentScreen === 'review' && (
          <ReviewScreen
            questions={quizQuestions}
            results={quizState.questionResults}
            userAnswers={quizState.userAnswers}
            settings={settings}
            onBack={() => setCurrentScreen('results')}
            onBackToUpload={handleBackToUpload}
          />
        )}
      </div>
    </div>
  );
} 