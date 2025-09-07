import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  HelpCircle,
  Grid,
  AlertCircle,
  Home,
  Newspaper,
  ArrowUpDown,
  Keyboard
} from 'lucide-react';
import { Question, QuestionResult, QuizSettings } from '../types';
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
  isWrongQuestionsMode?: boolean;
  onBackToFullQuiz?: () => void;
}

export const QuizScreen = ({ 
  questions, 
  settings, 
  quizState, 
  onQuizStateChange, 
  onComplete, 
  onExit,
  isWrongQuestionsMode = false,
  onBackToFullQuiz
}: QuizScreenProps) => {
  const { t } = useTranslation();
  const [showNavPanel, setShowNavPanel] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [navButtonsOnTop, setNavButtonsOnTop] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(true);
  const [showWrongQuestionsHint, setShowWrongQuestionsHint] = useState(true);
  const [swipeEnabled, setSwipeEnabled] = useState(true);
  const [showQuizSettings, setShowQuizSettings] = useState(false);
  
  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) || 
                            window.innerWidth <= 640;
      setIsMobile(isMobileDevice);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 滑动切题管理器
  const useSwipeManager = () => {
    // 滑动配置
    const SWIPE_CONFIG = {
      DRAG_THRESHOLD: 15, // 拖拽检测阈值（像素）
      HINT_THRESHOLD: 50, // 显示提示的阈值（像素）
      TRIGGER_THRESHOLD: 100, // 触发切题的阈值（像素）
      MAX_VERTICAL_DELTA: 80, // 最大垂直位移（像素）
      DEBOUNCE_TIME: 300, // 防抖时间（毫秒）
    };

    // 状态管理
    const [swipeState, setSwipeState] = useState({
      isActive: false,
      direction: null as 'left' | 'right' | null,
      startPos: null as { x: number; y: number } | null,
      isDragging: false,
      isProcessing: false,
    });

    // 重置状态
    const resetState = () => {
      setSwipeState({
        isActive: false,
        direction: null,
        startPos: null,
        isDragging: false,
        isProcessing: false,
      });
    };

    // 开始滑动检测
    const startSwipe = (x: number, y: number) => {
      setSwipeState(prev => ({
        ...prev,
        isActive: true,
        startPos: { x, y },
        isDragging: false,
        direction: null,
      }));
    };

    // 更新滑动状态
    const updateSwipe = (currentX: number, currentY: number) => {
      setSwipeState(prev => {
        if (!prev.isActive || !prev.startPos) return prev;

        const deltaX = currentX - prev.startPos.x;
        const deltaY = currentY - prev.startPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // 检测是否为拖拽
        let isDragging = prev.isDragging;
        if (!prev.isDragging && distance > SWIPE_CONFIG.DRAG_THRESHOLD) {
          isDragging = true;
        }

        // 只有在拖拽状态下才处理滑动
        if (isDragging) {
          // 检查垂直位移
          if (Math.abs(deltaY) > SWIPE_CONFIG.MAX_VERTICAL_DELTA) {
            return { ...prev, isDragging, direction: null };
          }

          // 确定滑动方向
          let newDirection: 'left' | 'right' | null = null;
          if (deltaX < -SWIPE_CONFIG.HINT_THRESHOLD) {
            newDirection = 'left';
          } else if (deltaX > SWIPE_CONFIG.HINT_THRESHOLD) {
            newDirection = 'right';
          }

          return { ...prev, isDragging, direction: newDirection };
        }

        return { ...prev, isDragging };
      });
    };

    // 结束滑动检测
    const endSwipe = (endX: number, endY: number) => {
      if (!swipeState.isActive || !swipeState.startPos) {
        return null;
      }

      const deltaX = endX - swipeState.startPos.x;
      const deltaY = endY - swipeState.startPos.y;

      // 检查是否满足切题条件
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);
      const isEnoughDistance = Math.abs(deltaX) > SWIPE_CONFIG.TRIGGER_THRESHOLD;
      const isDragging = swipeState.isDragging;

      let result: 'left' | 'right' | null = null;
      if (isHorizontalSwipe && isEnoughDistance && isDragging) {
        result = deltaX < 0 ? 'left' : 'right';
      }

      // 无论是否满足切题条件，都返回结果，让外部决定是否重置状态
      return result;
    };

    return {
      swipeState,
      startSwipe,
      updateSwipe,
      endSwipe,
      resetState,
    };
  };

  const swipeManager = useSwipeManager();
  
  // 防抖状态，防止连续快速滑动
  const [isProcessingSwipe, setIsProcessingSwipe] = useState(false);
  
  // 触摸事件管理器 - 用于区分点击和滑动
  const useTouchManager = () => {
    const [touchState, setTouchState] = useState({
      startPos: null as { x: number; y: number } | null,
      isDragging: false,
      startTime: 0,
    });
    
    const TOUCH_CONFIG = {
      MOVE_THRESHOLD: 10, // 移动阈值（像素）
      TIME_THRESHOLD: 300, // 时间阈值（毫秒）
    };
    
    const startTouch = (x: number, y: number) => {
      setTouchState({
        startPos: { x, y },
        isDragging: false,
        startTime: Date.now(),
      });
    };
    
    const updateTouch = (currentX: number, currentY: number) => {
      setTouchState(prev => {
        if (!prev.startPos) return prev;
        
        const deltaX = Math.abs(currentX - prev.startPos.x);
        const deltaY = Math.abs(currentY - prev.startPos.y);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > TOUCH_CONFIG.MOVE_THRESHOLD) {
          return { ...prev, isDragging: true };
        }
        
        return prev;
      });
    };
    
    const endTouch = () => {
      const result = {
        isClick: !touchState.isDragging && 
                 (Date.now() - touchState.startTime) < TOUCH_CONFIG.TIME_THRESHOLD,
        isDragging: touchState.isDragging,
      };
      
      setTouchState({
        startPos: null,
        isDragging: false,
        startTime: 0,
      });
      
      return result;
    };
    
    return {
      touchState,
      startTouch,
      updateTouch,
      endTouch,
    };
  };
  
  const touchManager = useTouchManager();

  const currentQuestion = questions[quizState.currentQuestionIndex];
  const currentAnswer = quizState.userAnswers[quizState.currentQuestionIndex];

  // 判断当前是否为填空题且输入框处于聚焦状态
  const isFillInputFocused = () => {
    const activeElement = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement | null;
    const isInputFocused = !!(activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    ));
    return currentQuestion.type === '填空题' && isInputFocused;
  };

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
    onComplete();
  };

  const handleEarlySubmit = () => {
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setShowSubmitConfirm(false);
    onComplete();
  };

  const handleCancelSubmit = () => {
    setShowSubmitConfirm(false);
  };

  const handleHint = () => {
    if (showFeedback) {
      // 如果已经显示反馈，则隐藏
      setShowFeedback(false);
    } else {
      // 如果未显示反馈，则显示
      const result = checkAnswer(currentQuestion, currentAnswer, settings);
      setFeedbackData(result);
      setShowFeedback(true);
    }
  };

  // 优化的触摸滑动处理函数
  const handleTouchStart = (e: React.TouchEvent) => {
    // 如果滑动被禁用或正在处理滑动，直接返回
    if (!swipeEnabled || isProcessingSwipe) return;
    
    // 检查是否在选项区域或输入框区域
    const target = e.target as HTMLElement;
    const isOptionArea = target.closest('label') || target.closest('.quiz-options-area') || target.closest('input') || target.closest('button');
    const isInputArea = target.closest('input') || target.closest('.input') || target.closest('.quiz-fill-area');
    
    // 如果在选项区域或输入框区域，不处理滑动
    if (isOptionArea || isInputArea) {
      return;
    }
    
    const startX = e.targetTouches[0].clientX;
    const startY = e.targetTouches[0].clientY;
    
    // 使用滑动管理器开始检测
    swipeManager.startSwipe(startX, startY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // 如果滑动被禁用，直接返回
    if (!swipeEnabled) return;
    
    // 检查是否在选项区域或输入框区域
    const target = e.target as HTMLElement;
    const isOptionArea = target.closest('label') || target.closest('.quiz-options-area') || target.closest('input') || target.closest('button');
    const isInputArea = target.closest('input') || target.closest('.input') || target.closest('.quiz-fill-area');
    const isFillInputArea = currentQuestion.type === '填空题' && (
      target.closest('input') || target.closest('.input') || target.closest('.quiz-fill-area') || target.tagName === 'INPUT'
    );
    
    // 如果在选项区域、输入框区域或填空题输入框聚焦，不处理滑动
    if (isFillInputFocused() || isFillInputArea || isOptionArea || isInputArea) {
      swipeManager.resetState();
      return;
    }
    
    // 如果滑动状态未激活，直接返回
    if (!swipeManager.swipeState.isActive) return;
    
    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    
    // 使用滑动管理器更新状态
    swipeManager.updateSwipe(currentX, currentY);
  };

  const handleTouchEnd = (e?: React.TouchEvent) => {
    // 如果滑动被禁用或正在处理滑动，直接返回
    if (!swipeEnabled || isProcessingSwipe) return;
    
    // 检查是否在选项区域或输入框区域
    const target = document.activeElement as HTMLElement;
    const isOptionArea = target && (target.closest('label') || target.closest('.quiz-options-area') || target.closest('input') || target.closest('button'));
    const isInputArea = target && (target.closest('input') || target.closest('.input') || target.closest('.quiz-fill-area') || target.closest('button'));
    const isFillInputArea = currentQuestion.type === '填空题' && (
      target && (target.closest('input') || target.closest('.input') || target.closest('.quiz-fill-area') || target.tagName === 'INPUT')
    );
    
    // 如果在选项区域、输入框区域或填空题输入框聚焦，不处理滑动
    if (isFillInputFocused() || isFillInputArea || isOptionArea || isInputArea) {
      swipeManager.resetState();
      return;
    }
    
    // 获取结束位置
    let endX = 0, endY = 0;
    if (e && e.changedTouches && e.changedTouches.length > 0) {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
    }
    
    // 使用滑动管理器结束检测并获取结果
    const result = swipeManager.endSwipe(endX, endY);
    
    // 立即重置滑动状态，避免状态残留
    swipeManager.resetState();
    
    // 处理滑动结果
    if (result === 'left' && quizState.currentQuestionIndex < questions.length - 1) {
      // 向左滑动，下一题
      setIsProcessingSwipe(true);
      setTimeout(() => {
        handleNext();
        setIsProcessingSwipe(false);
      }, 150);
    } else if (result === 'right' && quizState.currentQuestionIndex > 0) {
      // 向右滑动，上一题
      setIsProcessingSwipe(true);
      setTimeout(() => {
        handlePrev();
        setIsProcessingSwipe(false);
      }, 150);
    }
  };

  // 鼠标拖拽处理函数（使用滑动管理器）
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果正在处理滑动，直接返回
    if (isProcessingSwipe) return;
    
    // 检查是否在选项区域
    const target = e.target as HTMLElement;
    const isOptionArea = target.closest('label') || target.closest('input') || target.closest('.quiz-options-area') || target.closest('button');
    const isInputArea = target.closest('input') || target.closest('.input') || target.closest('.quiz-fill-area');
    
    if (isOptionArea || isInputArea) {
      // 在选项区域或输入框区域，不处理鼠标滑动
      return;
    }
    
    // 使用滑动管理器开始检测
    swipeManager.startSwipe(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 检查是否在选项区域
    const target = e.target as HTMLElement;
    const isOptionArea = target.closest('label') || target.closest('input') || target.closest('.quiz-options-area') || target.closest('button');
    const isInputArea = target.closest('input') || target.closest('.input') || target.closest('.quiz-fill-area');
    
    if (isFillInputFocused() || isOptionArea || isInputArea) {
      swipeManager.resetState();
      return;
    }
    
    // 如果滑动状态未激活，直接返回
    if (!swipeManager.swipeState.isActive) return;
    
    // 使用滑动管理器更新状态
    swipeManager.updateSwipe(e.clientX, e.clientY);
  };

  const handleMouseUp = (e?: React.MouseEvent) => {
    // 如果正在处理滑动，直接返回
    if (isProcessingSwipe) return;
    
    // 检查是否在选项区域
    const target = document.activeElement as HTMLElement;
    const isOptionArea = target && (target.closest('label') || target.closest('input') || target.closest('.quiz-options-area') || target.closest('button'));
    const isInputArea = target && (target.closest('input') || target.closest('.input') || target.closest('.quiz-fill-area'));
    
    if (isFillInputFocused() || isOptionArea || isInputArea) {
      swipeManager.resetState();
      return;
    }
    
    // 获取结束位置
    let endX = 0, endY = 0;
    if (e) {
      endX = e.clientX;
      endY = e.clientY;
    }
    
    // 使用滑动管理器结束检测并获取结果
    const result = swipeManager.endSwipe(endX, endY);
    
    // 立即重置滑动状态，避免状态残留
    swipeManager.resetState();
    
    // 处理滑动结果
    if (result === 'left' && quizState.currentQuestionIndex < questions.length - 1) {
      // 向左滑动，下一题
      setIsProcessingSwipe(true);
      setTimeout(() => {
        handleNext();
        setIsProcessingSwipe(false);
      }, 150);
    } else if (result === 'right' && quizState.currentQuestionIndex > 0) {
      // 向右滑动，上一题
      setIsProcessingSwipe(true);
      setTimeout(() => {
        handlePrev();
        setIsProcessingSwipe(false);
      }, 150);
    }
  };

  // Show immediate feedback in recite mode
  useEffect(() => {
    if (settings.mode === 'recite') {
      const result = checkAnswer(currentQuestion, null, settings);
      setFeedbackData(result);
      setShowFeedback(true);
    }
  }, [currentQuestion, settings.mode]);

  // 题目切换时重置滑动状态
  useEffect(() => {
    swipeManager.resetState();
    setIsProcessingSwipe(false);
  }, [quizState.currentQuestionIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    // 键盘映射配置
    const keyMappings = [
      { keys: ['a', 'A', '1'], letter: 'A', minOptions: 1 },
      { keys: ['b', 'B', '2'], letter: 'B', minOptions: 2 },
      { keys: ['c', 'C', '3'], letter: 'C', minOptions: 3 },
      { keys: ['d', 'D', '4'], letter: 'D', minOptions: 4 },
      { keys: ['e', 'E', '5'], letter: 'E', minOptions: 5 },
      { keys: ['f', 'F', '6'], letter: 'F', minOptions: 6 }
    ];

    const handleKeyDown = (e: KeyboardEvent) => {
      // 填空题输入框聚焦时，屏蔽快捷键（保留ESC）
      if (isFillInputFocused()) {
        // 只允许ESC键关闭导航面板
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowNavPanel(false);
        }
        return;
      }

      // Allow navigation shortcuts in recite mode, but disable answer selection
      if (settings.mode === 'recite' && ['a', 'A', 'b', 'B', 'c', 'C', 'd', 'D', 'e', 'E', 'f', 'F', '1', '2', '3', '4', '5', '6'].includes(e.key)) {
        return;
      }

      // 处理选项选择的辅助函数
      const handleOptionSelection = (letter: string) => {
        if (currentQuestion.type === '多选题') {
          // 多选题：切换选项状态
          const currentAnswerStr = currentAnswer || '';
          const currentAnswers = currentAnswerStr.split('').filter(char => char.match(/[A-Z]/));
          
          if (currentAnswers.includes(letter)) {
            // 如果已选中，则移除
            const index = currentAnswers.indexOf(letter);
            currentAnswers.splice(index, 1);
          } else {
            // 如果未选中，则添加
            currentAnswers.push(letter);
          }
          
          const newAnswer = currentAnswers.sort().join('');
          handleAnswerChange(newAnswer || null);
        } else {
          // 单选题和判断题：直接设置答案
          handleAnswerChange(letter);
        }
      };

      // 验证选项是否可用的辅助函数
      const isValidOption = (minOptions: number) => {
        return currentQuestion.type !== '填空题' && 
               (currentQuestion.type === '判断题' || currentQuestion.options.length >= minOptions);
      };

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          // 仅当填空题输入框聚焦时屏蔽，其它情况允许
          handlePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          // 仅当填空题输入框聚焦时屏蔽，其它情况允许
          if (quizState.currentQuestionIndex < questions.length - 1) {
            handleNext();
          } else {
            handleSubmit();
          }
          break;
        case ' ':
          e.preventDefault();
          // 空格键：提示答案（仅在非背诵模式下）
          if (settings.mode !== 'recite') {
            handleHint();
          }
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          // N键：切换题目导航面板
          setShowNavPanel(!showNavPanel);
          break;
        case 'Escape':
          e.preventDefault();
          // ESC键：关闭导航面板
          setShowNavPanel(false);
          break;
        default:
          // 处理选项键
          const mapping = keyMappings.find(m => m.keys.includes(e.key));
          if (mapping && isValidOption(mapping.minOptions)) {
            handleOptionSelection(mapping.letter);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, quizState.currentQuestionIndex, settings.mode, currentAnswer, questions.length, showNavPanel, showFeedback, handleAnswerChange, handlePrev, handleNext, handleSubmit, handleHint]);

  if (!currentQuestion) return null;

  // 导航按钮组件
  const NavigationButtons = () => (
    <div className="flex flex-row items-center gap-2 sm:gap-4">
      <button
        onClick={handlePrev}
        disabled={quizState.currentQuestionIndex === 0}
        className="btn btn-secondary text-sm px-2 sm:px-3 py-2 flex-1"
      >
        <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">{t('quizui.prev')}</span>
        <span className="sm:hidden">{t('quizui.prev')}</span>
      </button>
      
      {/* 提前交卷按钮 */}
      <button 
        onClick={handleEarlySubmit}
        className="btn btn-warning text-sm px-2 sm:px-3 py-2 flex-1"
        title={t('quizui.early_submit_title')}
      >
        <Newspaper className="w-4 h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">{t('quizui.early_submit')}</span>
        <span className="sm:hidden">{t('quizui.submit')}</span>
      </button>
      
      {quizState.currentQuestionIndex < questions.length - 1 ? (
        <button onClick={handleNext} className="btn btn-primary text-sm px-2 sm:px-3 py-2 flex-1">
          <span className="hidden sm:inline">{t('quizui.next')}</span>
          <span className="sm:hidden">{t('quizui.next')}</span>
          <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
        </button>
      ) : (
        <button onClick={handleSubmit} className="btn btn-success text-sm px-2 sm:px-3 py-2 flex-1">
          <span className="hidden sm:inline">{t('quizui.submit_paper')}</span>
          <span className="sm:hidden">{t('quizui.submit')}</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto min-w-[350px]">
      {/* 移动设备操作提示横幅 */}
      {isMobile && showMobileHint && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <span className="text-lg">📱</span>
              <span>{t('quizui.mobile_swipe_banner')}</span>
            </div>
            <button
              onClick={() => setShowMobileHint(false)}
              className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 错题模式提示横幅 */}
      {isWrongQuestionsMode && showWrongQuestionsHint && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <span className="text-lg">🎯</span>
              <span>{t('quizui.wrong_mode_banner', { count: questions.length })}</span>
            </div>
            <div className="flex items-center gap-2">
              {onBackToFullQuiz && (
                <button
                  onClick={onBackToFullQuiz}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 font-medium text-sm"
                >
                  {t('quizui.back_full_quiz')}
                </button>
              )}
              <button
                onClick={() => setShowWrongQuestionsHint(false)}
                className="text-orange-400 hover:text-orange-600 dark:hover:text-orange-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Header */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col space-y-3">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative">
            <div 
              className="bg-primary-400 dark:bg-primary-500 h-8 rounded-full transition-all duration-300"
              style={{ 
                width: `${((quizState.currentQuestionIndex + 1) / questions.length) * 100}%`,
                minWidth: '2rem'
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center text-gray-800 dark:text-white text-xs sm:text-sm font-medium z-10 px-2">
              {t('quizui.progress', { current: quizState.currentQuestionIndex + 1, total: questions.length })}
            </span>
          </div>
          <div className="flex justify-center">
            <div className="flex flex-wrap items-center gap-2">
              {settings.mode !== 'recite' && (
                <button
                  onClick={handleHint}
                  className="btn btn-warning text-sm px-3 py-2 flex items-center justify-center"
                  title={t('quizui.hint_answer')}
                >
                  <HelpCircle className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t('quizui.hint_button')}</span>
                </button>
              )}
              
              {/* 快捷键提示 */}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="btn btn-info text-sm px-3 py-2 flex items-center justify-center"
                title={t('quizui.keyboard_shortcuts_title')}
              >
                <Keyboard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('quizui.shortcuts_button')}</span>
              </button>


              {/* 答题设置按钮 */}
              <button
                onClick={() => setShowQuizSettings(!showQuizSettings)}
                className="btn btn-secondary text-sm px-3 py-2 flex items-center justify-center"
                title={t('quizui.settings_title')}
              >
                <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">{t('quizui.settings_button')}</span>
              </button>
              
              
              <button
                onClick={() => setShowNavPanel(!showNavPanel)}
                className="btn btn-success text-sm px-3 py-2 flex items-center justify-center"
                title={t('quizui.nav_panel_title')}
              >
                <Grid className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('quizui.nav_button')}</span>
              </button>
              
              <button
                onClick={onExit}
                className="btn btn-danger text-sm px-3 py-2 flex items-center justify-center"
                title={t('quizui.back_home')}
              >
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{t('quizui.back_button')}</span>
              </button>
            </div>
          </div>
          
          {/* 展开的快捷键提示 */}
          {showShortcuts && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">←</kbd>
                  <span>{t('quizui.prev')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">→</kbd>
                  <span>{t('quizui.next')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">A-F</kbd>
                  <span>{t('quizui.hint_answer')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">1-6</kbd>
                  <span>{t('quizui.hint_answer')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">空格</kbd>
                  <span>{t('quizui.hint_answer')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">N</kbd>
                  <span>{t('quizui.nav_button')}</span>
                </div>
              </div>
              
              {/* 移动设备操作提示 */}
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                  📱 {t('quizui.mobile_swipe_banner')}
                </div>
              </div>
            </div>
          )}

          {/* 答题设置面板 */}
          {showQuizSettings && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="space-y-4">
                {/* 切题按钮位置设置 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('quizui.settings_nav_position')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNavButtonsOnTop(false)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        !navButtonsOnTop
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`}
                    >
                      {t('quizui.position_bottom')}
                    </button>
                    <button
                      onClick={() => setNavButtonsOnTop(true)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        navButtonsOnTop
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                      }`}
                    >
                      {t('quizui.position_top')}
                    </button>
                  </div>
                </div>

                {/* 滑动切题开关 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👆</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('quizui.swipe_toggle')}</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={swipeEnabled}
                      onChange={(e) => setSwipeEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {/* 状态提示 */}
                {!swipeEnabled && (
                  <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300">
                    💡 {t('quizui.swipe_disabled_tip')}
                  </div>
                )}

                {/* 错题模式返回完整题库按钮 */}
                {isWrongQuestionsMode && onBackToFullQuiz && (
                  <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎯</span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('quizui.wrong_mode')}</span>
                      </div>
                      <button
                        onClick={onBackToFullQuiz}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-xs font-medium transition-colors"
                      >
                        {t('quizui.back_full_quiz')}
                      </button>
                    </div>
                    <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-xs text-orange-700 dark:text-orange-300">
                      💡 {t('quizui.wrong_mode_tip', { count: questions.length })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons - Top */}
      {navButtonsOnTop && (
        <div className="mb-6">
          <NavigationButtons />
        </div>
      )}

      {/* Question */}
      <div 
        className="card p-6 mb-6 relative overflow-hidden touch-manipulation"
        onTouchStart={swipeEnabled ? handleTouchStart : undefined}
        onTouchMove={swipeEnabled ? handleTouchMove : undefined}
        onTouchEnd={swipeEnabled ? (e) => handleTouchEnd(e) : undefined}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={(e) => handleMouseUp(e)}
        onMouseLeave={handleMouseUp}
        style={{ 
          userSelect: 'none',
          touchAction: swipeEnabled ? 'pan-y' : 'auto', // 禁用滑动时允许所有触摸操作
          WebkitOverflowScrolling: 'touch' // iOS 滚动优化
        }}
      >
        {/* 滑动指示器 */}
        {swipeManager.swipeState.direction && (
          <div className={`absolute inset-0 flex items-center justify-center z-50 pointer-events-none transition-all duration-200 ${
            swipeManager.swipeState.direction === 'left' ? 'bg-blue-500/20' : 'bg-green-500/20'
          }`}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg ${
              swipeManager.swipeState.direction === 'left' ? 'text-blue-600' : 'text-green-600'
            }`}>
              {swipeManager.swipeState.direction === 'left' ? (
                <>
                  <ChevronRight className="w-5 h-5" />
                  <span className="font-medium">{t('quizui.swipe_next')}</span>
                </>
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-medium">{t('quizui.swipe_prev')}</span>
                </>
              )}
            </div>
          </div>
        )}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex-1 quiz-question-text">
              {quizState.currentQuestionIndex + 1}. {currentQuestion.text}
            </h2>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium flex-shrink-0">
              {currentQuestion.type}
            </span>
          </div>

                    {/* Options */}
          {currentQuestion.type !== '填空题' && (
            <div 
              className="space-y-3 quiz-options-area"
              onTouchStart={(e) => {
                // 在选项区域，完全阻止事件冒泡到滑动处理
                e.stopPropagation();
              }}
              onTouchMove={(e) => {
                // 在选项区域，完全阻止事件冒泡
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                // 在选项区域，完全阻止事件冒泡
                e.stopPropagation();
              }}
            >
              {(currentQuestion.type === '判断题' 
                ? [settings.judgementTrue, settings.judgementFalse]
                : currentQuestion.options
              ).map((option, index) => {
                const letter = String.fromCharCode(65 + index);
                // 修复多选题的选中状态判断
                const isSelected = currentQuestion.type === '多选题' 
                  ? (currentAnswer && currentAnswer.includes(letter))
                  : currentAnswer === letter;
                const isCorrectAnswer = currentQuestion.answer.includes(letter);
                
                return (
                  <div
                    key={index}
                    className={`relative ${
                      settings.mode === 'recite' ? 'pointer-events-none opacity-75' : ''
                    }`}
                  >
                    <label
                      className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 min-h-[60px] touch-manipulation ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                          : isCorrectAnswer && settings.mode === 'recite'
                          ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600 active:bg-gray-50 dark:active:bg-gray-700'
                      }`}
                      onMouseDown={(e) => {
                        // 防止事件冒泡到滑动处理
                        e.stopPropagation();
                        if (settings.mode === 'recite') return;
                        
                        // 立即处理选项选择
                        if (currentQuestion.type === '多选题') {
                          // 多选题：切换选项状态
                          const currentAnswerStr = currentAnswer || '';
                          const currentAnswers = currentAnswerStr.split('').filter(char => char.match(/[A-Z]/));
                          
                          if (currentAnswers.includes(letter)) {
                            // 如果已选中，则移除
                            const index = currentAnswers.indexOf(letter);
                            currentAnswers.splice(index, 1);
                          } else {
                            // 如果未选中，则添加
                            currentAnswers.push(letter);
                          }
                          
                          const newAnswer = currentAnswers.sort().join('');
                          handleAnswerChange(newAnswer || null);
                        } else {
                          // 单选题和判断题：直接设置答案
                          handleAnswerChange(letter);
                        }
                      }}
                      onTouchStart={(e) => {
                        // 完全阻止事件冒泡
                        e.stopPropagation();
                        // 开始触摸检测
                        const touch = e.touches[0];
                        if (touch) {
                          touchManager.startTouch(touch.clientX, touch.clientY);
                        }
                      }}
                      onTouchMove={(e) => {
                        // 完全阻止事件冒泡
                        e.stopPropagation();
                        // 更新触摸状态
                        const touch = e.touches[0];
                        if (touch) {
                          touchManager.updateTouch(touch.clientX, touch.clientY);
                        }
                      }}
                      onTouchEnd={(e) => {
                        // 完全阻止事件冒泡
                        e.stopPropagation();
                        
                        if (settings.mode === 'recite') return;
                        
                        // 检查触摸结果
                        const touchResult = touchManager.endTouch();
                        
                        // 只有真正的点击才处理选项选择
                        if (touchResult.isClick) {
                          // 处理选项选择
                          if (currentQuestion.type === '多选题') {
                            // 多选题：切换选项状态
                            const currentAnswerStr = currentAnswer || '';
                            const currentAnswers = currentAnswerStr.split('').filter(char => char.match(/[A-Z]/));
                            
                            if (currentAnswers.includes(letter)) {
                              // 如果已选中，则移除
                              const index = currentAnswers.indexOf(letter);
                              currentAnswers.splice(index, 1);
                            } else {
                              // 如果未选中，则添加
                              currentAnswers.push(letter);
                            }
                            
                            const newAnswer = currentAnswers.sort().join('');
                            handleAnswerChange(newAnswer || null);
                          } else {
                            // 单选题和判断题：直接设置答案
                            handleAnswerChange(letter);
                          }
                        }
                      }}
                    >
                      <input
                        type={currentQuestion.type === '多选题' ? 'checkbox' : 'radio'}
                        name={`question-${quizState.currentQuestionIndex}`}
                        value={letter}
                        checked={isSelected || false}
                        onChange={(e) => {
                          // 防止重复处理
                          e.stopPropagation();
                        }}
                        className="sr-only"
                        disabled={settings.mode === 'recite'}
                      />
                      <span className={`flex-shrink-0 w-6 h-6 border-2 mr-3 flex items-center justify-center ${
                        currentQuestion.type === '多选题' 
                          ? 'rounded border-gray-300 dark:border-gray-600' 
                          : 'rounded-full border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && (
                          currentQuestion.type === '多选题' ? (
                            <div className="w-3 h-3 bg-primary-600 rounded-sm" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-primary-600" />
                          )
                        )}
                        {isCorrectAnswer && settings.mode === 'recite' && !isSelected && (
                          currentQuestion.type === '多选题' ? (
                            <div className="w-3 h-3 bg-success-600 rounded-sm" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-success-600" />
                          )
                        )}
                      </span>
                      <span className="text-gray-900 dark:text-white flex items-center flex-1">
                        {letter}. {option}
                        {isCorrectAnswer && settings.mode === 'recite' && (
                          <span className="ml-2 text-success-600 dark:text-success-400 text-sm font-medium">
                            ✓ {t('quizui.correct_answer')}
                          </span>
                        )}
                      </span>
                    </label>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fill-in question */}
          {currentQuestion.type === '填空题' && (
            <div className="space-y-3 quiz-fill-area">
              {currentQuestion.answer.split(settings.fillBlankSeparator || '|').map((_, index) => (
                <div key={index} className="relative">
                  <input
                    type="text"
                    placeholder={t('quizui.fill_placeholder', { index: index + 1 })}
                    value={currentAnswer ? currentAnswer.split(settings.fillBlankSeparator || '|')[index] || '' : ''}
                    onChange={(e) => {
                      const separator = settings.fillBlankSeparator || '|';
                      const answers = currentAnswer ? currentAnswer.split(separator) : [];
                      answers[index] = e.target.value;
                      handleAnswerChange(answers.join(separator));
                    }}
                    onTouchStart={(e) => {
                      // 只阻止事件冒泡，不阻止默认行为
                      e.stopPropagation();
                    }}
                    onTouchMove={(e) => {
                      // 只阻止事件冒泡，不阻止默认行为
                      e.stopPropagation();
                    }}
                    onTouchEnd={(e) => {
                      // 只阻止事件冒泡，不阻止默认行为
                      e.stopPropagation();
                    }}
                    onMouseDown={(e) => {
                      // 只阻止事件冒泡，不阻止默认行为
                      e.stopPropagation();
                    }}
                    onMouseMove={(e) => {
                      // 只阻止事件冒泡，不阻止默认行为
                      e.stopPropagation();
                    }}
                    onMouseUp={(e) => {
                      // 只阻止事件冒泡，不阻止默认行为
                      e.stopPropagation();
                    }}
                    className="input w-full text-base py-3 px-4 min-h-[48px] touch-manipulation focus:ring-2 focus:ring-primary-500 focus:border-primary-500 active:scale-[0.98] transition-all duration-150"
                    disabled={settings.mode === 'recite'}
                    style={{
                      fontSize: '16px', // 防止iOS缩放
                      WebkitAppearance: 'none',
                      borderRadius: '8px',
                      touchAction: 'manipulation', // 优化触摸操作
                      WebkitTouchCallout: 'none', // 禁用iOS长按菜单
                      WebkitUserSelect: 'text', // 允许文本选择
                      userSelect: 'text' // 允许文本选择
                    }}
                  />
                </div>
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
                {settings.mode === 'recite' ? t('quizui.correct_answer_title') : 
                 feedbackData.isCorrect ? t('quizui.answer_correct') : t('quizui.answer_wrong')}
              </span>
            </div>
            {feedbackData.userAnswerText && (
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {t('quizui.your_answer')} <span dangerouslySetInnerHTML={{ __html: feedbackData.userAnswerText }} />
              </p>
            )}
            <p className="text-gray-700 dark:text-gray-300">
              {t('quizui.correct_answer')} <span dangerouslySetInnerHTML={{ __html: feedbackData.correctAnswerText }} />
            </p>
            {currentQuestion.explanation && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                <strong>{t('quizui.explanation')}</strong> {currentQuestion.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation Buttons - Bottom */}
      {!navButtonsOnTop && (
        <div className="mt-6">
          <NavigationButtons />
        </div>
      )}

      {/* Navigation Panel */}
      {showNavPanel && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={(e) => {
            // 点击背景关闭面板
            if (e.target === e.currentTarget) {
              setShowNavPanel(false);
            }
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 max-w-4xl w-full mx-2 sm:mx-4 max-h-[85vh] sm:max-h-[80vh] flex flex-col relative overflow-hidden">
            <div className="flex justify-center items-center mb-4 pt-2 relative">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('quizui.nav_panel_title')}
              </h3>
              {/* 关闭按钮与标题水平对齐 */}
              <button
                onClick={() => setShowNavPanel(false)}
                className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors duration-200"
                title={t('quizui.close_nav')}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid gap-2 flex-1 overflow-y-auto overflow-x-hidden"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))'
            }}>
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onQuizStateChange({ ...quizState, currentQuestionIndex: index });
                    setShowNavPanel(false);
                  }}
                  className={`p-2 sm:p-2.5 lg:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
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

      {/* 提前交卷确认对话框 */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-warning-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('quizui.early_submit_confirm_title')}
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                {t('quizui.early_submit_confirm_desc')}
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('quizui.answered_count', { answered: quizState.userAnswers.filter(a => a !== null).length, total: questions.length })}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('quizui.unanswered_count', { count: quizState.userAnswers.filter(a => a === null).length })}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelSubmit}
                className="btn btn-secondary"
              >
                {t('common.cancel', { defaultValue: '取消' })}
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="btn btn-warning"
              >
                {t('quizui.early_submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 