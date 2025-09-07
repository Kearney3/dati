import { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { SheetSelector } from './components/SheetSelector';
import { HeaderMapping } from './components/HeaderMapping';
import { QuizSettings } from './components/QuizSettings';
import { QuizScreen } from './components/QuizScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { ThemeToggle } from './components/ThemeToggle';
import { ToastContainer } from './components/ToastContainer';
import { Github, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  Question,
  QuizSettings as QuizSettingsType, 
  ExamSettings, 
  MultiSheetConfig, 
  SheetConfig, 
  HeaderMapping as HeaderMappingType,
  QuestionResult
} from './types';
import { 
  getSheetData, 
  autoMapHeaders,
  processMultiSheetQuestions
} from './utils/excel';
import { generateQuizData, calculateResults } from './utils/quiz';
import { loadExamConfig, saveExamConfig } from './utils/storage';

type Screen = 'upload' | 'config' | 'quiz' | 'results' | 'review';

export default function App() {
  const { t } = useTranslation();
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
    judgementTrue: t('quizsettings.judgement_true_placeholder'),
    judgementFalse: t('quizsettings.judgement_false_placeholder'),
    questionRanges: [],
    useCustomRanges: false,
    fillBlankSeparator: '|'
  });
  const [quizState, setQuizState] = useState({
    currentQuestionIndex: 0,
    userAnswers: [] as (string | null)[],
    questionResults: [] as QuestionResult[],
    isCompleted: false
  });
  
  // 添加状态来跟踪是否在错题模式
  const [isWrongQuestionsMode, setIsWrongQuestionsMode] = useState(false);
  const [originalQuestions, setOriginalQuestions] = useState<Question[]>([]);
  const [examSettings, setExamSettings] = useState<ExamSettings | undefined>(undefined);
  
  // 新增：多工作表配置状态
  const [multiSheetConfig, setMultiSheetConfig] = useState<MultiSheetConfig>({
    sheets: [],
    globalMapping: {},
    useGlobalMapping: false
  });

  // 添加提示信息状态
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    description?: string;
    duration?: number;
  }>>([]);

  // 显示提示信息的函数
  const showAlert = (type: 'success' | 'warning' | 'error' | 'info', title: string, description?: string, duration = 5000) => {
    const id = Date.now().toString();
    const newToast = {
      id,
      type,
      title,
      description,
      duration
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // 自动移除
    setTimeout(() => {
      removeToast(id);
    }, duration);
  };

  // 移除Toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 从localStorage加载考试配置
  useEffect(() => {
    const savedExamSettings = loadExamConfig();
    if (savedExamSettings) {
      setExamSettings(savedExamSettings);
    }
  }, []);

  // 保存考试配置到localStorage
  const handleExamSettingsChange = (settings: ExamSettings) => {
    setExamSettings(settings);
    saveExamConfig(settings);
  };

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
    
    // 检查新选中工作表的表头映射合法性
    const newlySelectedSheets = config.sheets.filter(sheet => 
      sheet.isSelected && 
      !multiSheetConfig.sheets.find(prevSheet => 
        prevSheet.sheetName === sheet.sheetName && prevSheet.isSelected
      )
    );
    
    if (newlySelectedSheets.length > 0) {
      // 检查新选中工作表的全局映射合法性
      const requiredFields = ['question', 'type', 'answer'];
      const isGlobalMappingIncomplete = requiredFields.some(field => !config.globalMapping[field as keyof HeaderMappingType]);
      
      if (isGlobalMappingIncomplete) {
        showAlert('warning', t('mapping.status_missing'), t('quiz.start_warning_desc'));
        return;
      }
      
      // 如果使用独立映射模式，检查独立映射配置
      if (!config.useGlobalMapping) {
        const invalidSheets = newlySelectedSheets.filter(sheet => {
          if (sheet.useGlobalMapping) {
            // 使用全局映射的工作表，检查全局映射是否完整
            return requiredFields.some(field => !config.globalMapping[field as keyof HeaderMappingType]);
          } else {
            // 使用独立映射的工作表，检查独立映射是否完整
            return requiredFields.some(field => !sheet.mapping[field as keyof HeaderMappingType]);
          }
        });
        
        if (invalidSheets.length > 0) {
          showAlert('warning', t('mapping.status_missing'), `${invalidSheets.map(s => s.sheetName).join(', ')}`);
        }
      }
    }
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

    // 设置全局映射
    setMapping(config.globalMapping);

    // 处理所有选中工作表的数据
    const allQuestions = processMultiSheetQuestions(workbook, selectedSheets, config.globalMapping);
    setQuestions(allQuestions);
  };

  const handleMappingChange = (mapping: Partial<HeaderMappingType>) => {
    setMapping(mapping);
    
    // 更新全局映射配置
    setMultiSheetConfig(prev => ({
      ...prev,
      globalMapping: mapping
    }));
  };

  const handleStartQuiz = () => {
    const selectedSheets = multiSheetConfig.sheets.filter(sheet => sheet.isSelected);
    
    if (selectedSheets.length === 0) {
      showAlert('warning', t('quiz.select_sheet_warning_title'), t('quiz.select_sheet_warning_desc'));
      return;
    }

    // 检查是否有工作表使用全局映射
    const hasGlobalMappingSheets = selectedSheets.some(sheet => sheet.useGlobalMapping);
    
    if (hasGlobalMappingSheets) {
      // 如果有工作表使用全局映射，检查全局映射是否配置完整
      if (!multiSheetConfig.globalMapping.question || !multiSheetConfig.globalMapping.type || !multiSheetConfig.globalMapping.answer) {
        showAlert('warning', t('quiz.start_warning_title'), t('quiz.start_warning_desc'));
        return;
      }
    } else {
      // 如果所有工作表都使用独立映射，检查每个工作表的独立映射是否配置完整
      const incompleteSheets = selectedSheets.filter(sheet => 
        !sheet.mapping.question || !sheet.mapping.type || !sheet.mapping.answer
      );
      
      if (incompleteSheets.length > 0) {
        const names = incompleteSheets.map(s => s.sheetName).join(', ');
        showAlert('warning', t('mapping.status_missing'), names);
        return;
      }
    }

    // 检查考试配置
    if (settings.mode === 'exam' && examSettings) {
      const totalExamQuestions = examSettings.totalQuestions;
      if (totalExamQuestions === 0) {
        showAlert('warning', t('exam.exam_questions_zero_title'), t('exam.exam_questions_zero_desc'));
        return;
      }
      
      // 检查每种题型是否都有配置
      const invalidConfigs = examSettings.configs.filter(config => 
        config.count > 0 && config.count > questions.filter(q => q.type === config.questionType).length
      );
      
      if (invalidConfigs.length > 0) {
        const invalidTypes = invalidConfigs.map(c => c.questionType).join(', ');
        showAlert('warning', t('exam.exceed_available_types_title', { types: invalidTypes }), t('exam.exceed_available_types_desc', { types: invalidTypes }));
        return;
      }
    }

    // 使用新的多工作表处理函数
    const allQuestions = processMultiSheetQuestions(workbook, selectedSheets, multiSheetConfig.globalMapping);
    
    if (allQuestions.length === 0) {
      showAlert('warning', t('quiz.cannot_generate_title'), t('quiz.cannot_generate_desc'));
      return;
    }

    setQuestions(allQuestions);
    const generatedQuiz = generateQuizData(allQuestions, settings, examSettings);
    setQuizQuestions(generatedQuiz);
    setOriginalQuestions(generatedQuiz); // 保存原始题目
    setIsWrongQuestionsMode(false); // 重置错题模式
    setQuizState({
      currentQuestionIndex: 0,
      userAnswers: new Array(generatedQuiz.length).fill(null),
      questionResults: [],
      isCompleted: false
    });
    setCurrentScreen('quiz');
    
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    setOriginalQuestions(generatedQuiz); // 保存原始题目
    setIsWrongQuestionsMode(false); // 重置错题模式
    setQuizState({
      currentQuestionIndex: 0,
      userAnswers: new Array(generatedQuiz.length).fill(null),
      questionResults: [],
      isCompleted: false
    });
    setCurrentScreen('quiz');
    
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRetryWrongQuestions = () => {
    // 筛选出错误的题目
    const wrongQuestions = quizQuestions.filter((_, index) => 
      !quizState.questionResults[index]?.isCorrect
    );
    
    if (wrongQuestions.length === 0) {
      showAlert('info', t('results.no_wrong_title'), t('results.no_wrong_desc'));
      return;
    }
    
    // 设置错题为新的答题题目
    setQuizQuestions(wrongQuestions);
    setIsWrongQuestionsMode(true); // 设置为错题模式
    setQuizState({
      currentQuestionIndex: 0,
      userAnswers: new Array(wrongQuestions.length).fill(null),
      questionResults: [],
      isCompleted: false
    });
    setCurrentScreen('quiz');
    
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToFullQuiz = () => {
    if (originalQuestions.length > 0) {
      setQuizQuestions(originalQuestions);
      setIsWrongQuestionsMode(false);
      setQuizState({
        currentQuestionIndex: 0,
        userAnswers: new Array(originalQuestions.length).fill(null),
        questionResults: [],
        isCompleted: false
      });
      setCurrentScreen('quiz');
      
      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
    setIsWrongQuestionsMode(false);
    setOriginalQuestions([]);
  };

  return (
    <div className="min-h-screen min-w-[350px] bg-gray-50 dark:bg-gray-900 flex flex-col">
      <ThemeToggle />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 min-w-[350px]">
          {/* 提示信息Toast */}
          <ToastContainer
            toasts={toasts}
            onRemoveToast={removeToast}
          />

          {currentScreen === 'upload' && (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('app.title')}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  {workbook ? t('app.continue_config') : t('app.subtitle_upload')}
                </p>
              </div>
              {workbook ? (
                <div className="text-center">
                  <div className="card p-8 mb-6">
                    <div className="mb-4">
                      <div className="text-4xl mb-4">📊</div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('app.uploaded_title')}</h2>
                      <p className="text-gray-600 dark:text-gray-400">
                        {t('app.contains_sheets', { count: sheetNames.length })}
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentScreen('config')}
                      className="btn btn-primary"
                    >
                      {t('app.continue_config')}
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
                    {t('app.reupload')}
                  </button>
                </div>
              ) : (
                <FileUpload onFileLoaded={handleFileLoaded} />
              )}
            </div>
          )}

          {currentScreen === 'config' && (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* 返回首页按钮 */}
              <div className="relative flex justify-between items-center">
                <button
                  onClick={handleBackToUpload}
                  className="btn btn-secondary flex items-center gap-2 z-10"
                  title={t('app.back_home')}
                >
                  <Home className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('app.back_home')}</span>
                </button>
                <div className="absolute inset-0 flex flex-col justify-center items-center">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('app.configure_bank')}</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('app.select_and_map')}
                  </p>
                </div>
                <div className="w-24 z-10"></div> {/* 占位，保持标题居中 */}
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
                    sheetName={t('app.global_mapping_sheet_name')}
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
                    onExamSettingsChange={handleExamSettingsChange}
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
                    {t('app.start_quiz')}
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
              isWrongQuestionsMode={isWrongQuestionsMode}
              onBackToFullQuiz={handleBackToFullQuiz}
            />
          )}

          {currentScreen === 'results' && (
            <ResultsScreen
              questions={quizQuestions}
              results={quizState.questionResults}
              settings={settings}
              examSettings={examSettings}
              onRetry={handleRetry}
              onRetryWrongQuestions={handleRetryWrongQuestions}
              onReview={() => setCurrentScreen('review')}
              onBackToUpload={handleBackToUpload}
              onBackToQuiz={() => {
                setCurrentScreen('quiz');
                // 滚动到页面顶部
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
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
      </main>
      
      {/* Footer - 始终显示 */}
      <footer className="py-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 min-w-[350px]">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
            <span className="text-gray-600 dark:text-gray-400 text-sm">{t('app.footer')}</span>
            <div className="flex items-center space-x-4">
              <a
                href="https://github.com/Kearney3/dati"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200 group"
                title={t('app.github')}
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm font-medium">{t('app.github')}</span>
              </a>
              <span className="text-gray-400 dark:text-gray-500">|</span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">{t('app.made_with')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 