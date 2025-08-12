import { useState, useEffect, useRef } from 'react';
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
}

export const QuizScreen = ({ 
  questions, 
  settings, 
  quizState, 
  onQuizStateChange, 
  onComplete, 
  onExit 
}: QuizScreenProps) => {
  const [showNavPanel, setShowNavPanel] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [navButtonsOnTop, setNavButtonsOnTop] = useState(false);
  
  // 滑动状态
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isWheelProcessing, setIsWheelProcessing] = useState(false);
  const wheelIdleTimerRef = useRef<number | null>(null);
  const prevButtonRef = useRef<HTMLButtonElement | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  
  const currentQuestion = questions[quizState.currentQuestionIndex];
  const currentAnswer = quizState.userAnswers[quizState.currentQuestionIndex];

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

  // 触摸滑动处理函数
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    
    // 检查当前焦点是否在输入框上
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      (activeElement as HTMLElement).contentEditable === 'true'
    );
    
    // 填空题时，如果焦点在输入框上，不设置滑动方向
    if (currentQuestion.type !== '填空题' || !isInputFocused) {
      setSwipeDirection(null);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    
    // 检查当前焦点是否在输入框上
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      (activeElement as HTMLElement).contentEditable === 'true'
    );
    
    // 填空题时，如果焦点在输入框上，不显示滑动指示器
    if (currentQuestion.type === '填空题' && isInputFocused) return;
    
    if (touchStart) {
      const distance = touchStart - e.targetTouches[0].clientX;
      
      if (distance > 10) {
        setSwipeDirection('left');
      } else if (distance < -10) {
        setSwipeDirection('right');
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // 检查当前焦点是否在输入框上
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      (activeElement as HTMLElement).contentEditable === 'true'
    );

    // 填空题时，如果焦点在输入框上，禁用滑动切换功能
    if (currentQuestion.type === '填空题' && isInputFocused) return;

    if (isLeftSwipe && quizState.currentQuestionIndex < questions.length - 1) {
      // 向左滑动，下一题
      setSwipeDirection('left');
      setTimeout(() => {
        handleNext();
        setSwipeDirection(null);
      }, 150);
    } else if (isRightSwipe && quizState.currentQuestionIndex > 0) {
      // 向右滑动，上一题
      setSwipeDirection('right');
      setTimeout(() => {
        handlePrev();
        setSwipeDirection(null);
      }, 150);
    } else {
      setSwipeDirection(null);
    }
  };

  // 鼠标拖拽处理函数（用于电脑测试）
  const [mouseStart, setMouseStart] = useState<number | null>(null);
  const [mouseEnd, setMouseEnd] = useState<number | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseEnd(null);
    setMouseStart(e.clientX);
    
    // 检查当前焦点是否在输入框上
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      (activeElement as HTMLElement).contentEditable === 'true'
    );
    
    // 填空题时，如果焦点在输入框上，不设置滑动方向
    if (currentQuestion.type !== '填空题' || !isInputFocused) {
      setSwipeDirection(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (mouseStart !== null) {
      setMouseEnd(e.clientX);
      
      // 检查当前焦点是否在输入框上
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement).contentEditable === 'true'
      );
      
      // 填空题时，如果焦点在输入框上，不显示滑动指示器
      if (currentQuestion.type === '填空题' && isInputFocused) return;
      
      const distance = mouseStart - e.clientX;
      
      if (distance > 10) {
        setSwipeDirection('left');
      } else if (distance < -10) {
        setSwipeDirection('right');
      } else {
        setSwipeDirection(null);
      }
    }
  };

  const handleMouseUp = () => {
    if (!mouseStart || !mouseEnd) return;
    
    const distance = mouseStart - mouseEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    // 检查当前焦点是否在输入框上
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      (activeElement as HTMLElement).contentEditable === 'true'
    );

    // 填空题时，如果焦点在输入框上，禁用滑动切换功能
    if (currentQuestion.type === '填空题' && isInputFocused) return;

    if (isLeftSwipe && quizState.currentQuestionIndex < questions.length - 1) {
      // 向左滑动，下一题
      setSwipeDirection('left');
      setTimeout(() => {
        handleNext();
        setSwipeDirection(null);
      }, 150);
    } else if (isRightSwipe && quizState.currentQuestionIndex > 0) {
      // 向右滑动，上一题
      setSwipeDirection('right');
      setTimeout(() => {
        handlePrev();
        setSwipeDirection(null);
      }, 150);
    } else {
      setSwipeDirection(null);
    }
    
    // 重置状态
    setMouseStart(null);
    setMouseEnd(null);
  };

  // 滚动切换题目处理函数
  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    // 检查当前焦点是否在输入框上
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      (activeElement as HTMLElement).contentEditable === 'true'
    );

    // 填空题时，如果焦点在输入框上，禁用滚动切换功能
    if (currentQuestion.type === '填空题' && isInputFocused) return;

    // 防止在输入框内滚动时触发题目切换
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    // 仅在水平滚动占主导时触发
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();

      // 若当前正在处理一次滚动切换，则仅刷新“空闲解锁”计时器，保证一次手势只切换一题
      if (isWheelProcessing) {
        if (wheelIdleTimerRef.current) window.clearTimeout(wheelIdleTimerRef.current);
        wheelIdleTimerRef.current = window.setTimeout(() => {
          setIsWheelProcessing(false);
          wheelIdleTimerRef.current = null;
        }, 150);
        return;
      }

      // 未锁定时，触发一次切换并进入锁定状态
      setIsWheelProcessing(true);
      if (e.deltaX > 0 && quizState.currentQuestionIndex < questions.length - 1) {
        // 通过“点击下一题按钮”模拟真实按下触发
        nextButtonRef.current?.click();
      } else if (e.deltaX < 0 && quizState.currentQuestionIndex > 0) {
        // 通过“点击上一题按钮”模拟真实按下触发
        prevButtonRef.current?.click();
      }

      // 启动/重置“空闲解锁”计时器：只有当一段时间内没有新的 wheel 事件，才解除锁定
      if (wheelIdleTimerRef.current) window.clearTimeout(wheelIdleTimerRef.current);
      wheelIdleTimerRef.current = window.setTimeout(() => {
        setIsWheelProcessing(false);
        wheelIdleTimerRef.current = null;
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
      // 检查当前焦点是否在输入框上
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' || 
        activeElement.tagName === 'TEXTAREA' || 
        (activeElement as HTMLElement).contentEditable === 'true'
      );

      // 填空题时，如果焦点在输入框上，只允许ESC键关闭导航面板
      if (isInputFocused && currentQuestion.type === '填空题') {
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

      // 验证填空题快捷键是否可用的辅助函数
      const isValidFillInShortcut = () => {
        return currentQuestion.type === '填空题' && !isInputFocused;
      };

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          // 填空题时，只有在没有输入框焦点时才允许左右换题
          if (currentQuestion.type !== '填空题' || !isInputFocused) {
            handlePrev();
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          // 填空题时，只有在没有输入框焦点时才允许左右换题
          if (currentQuestion.type !== '填空题' || !isInputFocused) {
            if (quizState.currentQuestionIndex < questions.length - 1) {
              handleNext();
            } else {
              handleSubmit();
            }
          }
          break;
        case ' ':
          e.preventDefault();
          // 空格键：提示答案（仅在非背诵模式下，填空题时需要在没有输入框焦点时）
          if (settings.mode !== 'recite' && (currentQuestion.type !== '填空题' || !isInputFocused)) {
            handleHint();
          }
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          // N键：切换题目导航面板（填空题时需要在没有输入框焦点时）
          if (currentQuestion.type !== '填空题' || !isInputFocused) {
            setShowNavPanel(!showNavPanel);
          }
          break;
        case 'Escape':
          e.preventDefault();
          // ESC键：关闭导航面板
          setShowNavPanel(false);
          break;
        default:
          // 处理选项键
          const mapping = keyMappings.find(m => m.keys.includes(e.key));
          if (mapping && (isValidOption(mapping.minOptions) || isValidFillInShortcut())) {
            handleOptionSelection(mapping.letter);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestion, quizState.currentQuestionIndex, settings.mode, handleAnswerChange, handlePrev, handleNext, handleSubmit]);

  // 组件卸载时清理计时器
  useEffect(() => {
    return () => {
      if (wheelIdleTimerRef.current) {
        window.clearTimeout(wheelIdleTimerRef.current);
        wheelIdleTimerRef.current = null;
      }
    };
  }, []);

  if (!currentQuestion) return null;

  // 导航按钮组件
  const NavigationButtons = () => (
    <div className="flex flex-row items-center gap-2 sm:gap-4">
      <button
        ref={prevButtonRef}
        onClick={handlePrev}
        disabled={quizState.currentQuestionIndex === 0}
        className="btn btn-secondary text-sm px-2 sm:px-3 py-2 flex-1"
      >
        <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">上一题</span>
        <span className="sm:hidden">上</span>
      </button>
      
      {/* 提前交卷按钮 */}
      <button 
        onClick={handleEarlySubmit}
        className="btn btn-warning text-sm px-2 sm:px-3 py-2 flex-1"
        title="提前交卷"
      >
        <Newspaper className="w-4 h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">提前交卷</span>
        <span className="sm:hidden">交卷</span>
      </button>
      
      {quizState.currentQuestionIndex < questions.length - 1 ? (
        <button ref={nextButtonRef} onClick={handleNext} className="btn btn-primary text-sm px-2 sm:px-3 py-2 flex-1">
          <span className="hidden sm:inline">下一题</span>
          <span className="sm:hidden">下</span>
          <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
        </button>
      ) : (
        <button onClick={handleSubmit} className="btn btn-success text-sm px-2 sm:px-3 py-2 flex-1">
          <span className="hidden sm:inline">提交试卷</span>
          <span className="sm:hidden">提交</span>
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto min-w-[350px]">
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
              {quizState.currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>
          <div className="flex justify-center">
            <div className="flex flex-wrap items-center gap-2">
              {settings.mode !== 'recite' && (
                <button
                  onClick={handleHint}
                  className="btn btn-warning text-sm px-3 py-2 flex items-center justify-center"
                  title="提示答案"
                >
                  <HelpCircle className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">提示</span>
                </button>
              )}
              
              {/* 快捷键提示 */}
              <button
                onClick={() => setShowShortcuts(!showShortcuts)}
                className="btn btn-info text-sm px-3 py-2 flex items-center justify-center"
                title="快捷键提示"
              >
                <Keyboard className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">快捷键</span>
              </button>
              
              <button
                onClick={() => setShowNavPanel(!showNavPanel)}
                className="btn btn-success text-sm px-3 py-2 flex items-center justify-center"
                title="题号导航"
              >
                <Grid className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">导航</span>
              </button>
              
              {/* 按钮位置切换 */}
              <button
                onClick={() => setNavButtonsOnTop(!navButtonsOnTop)}
                className="btn btn-secondary text-sm px-3 py-2 flex items-center justify-center"
                title={navButtonsOnTop ? "将按钮移到题目下方" : "将按钮移到题目上方"}
              >
                <ArrowUpDown className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">{navButtonsOnTop ? "移到底部" : "移到顶部"}</span>
              </button>
              
              <button
                onClick={onExit}
                className="btn btn-danger text-sm px-3 py-2 flex items-center justify-center"
                title="返回主页"
              >
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">返回主页</span>
              </button>
            </div>
          </div>
          
          {/* 展开的快捷键提示 */}
          {showShortcuts && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs text-blue-600 dark:text-blue-400">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">←</kbd>
                  <span>上一题</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">→</kbd>
                  <span>下一题</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">A-F</kbd>
                  <span>选择答案</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">1-6</kbd>
                  <span>选择答案（对应A-F）</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">空格</kbd>
                  <span>答案提示</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs font-mono">N</kbd>
                  <span>题目导航</span>
                </div>
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
        className="card p-6 mb-6 relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ userSelect: 'none' }}
      >
        {/* 滑动指示器 - 填空题时只在没有输入框焦点时显示 */}
        {swipeDirection && (() => {
          // 检查当前焦点是否在输入框上
          const activeElement = document.activeElement;
          const isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            (activeElement as HTMLElement).contentEditable === 'true'
          );
          return currentQuestion.type !== '填空题' || !isInputFocused;
        })() && (
          <div className={`absolute inset-0 flex items-center justify-center z-50 pointer-events-none transition-all duration-200 ${
            swipeDirection === 'left' ? 'bg-blue-500/20' : 'bg-green-500/20'
          }`}>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/90 dark:bg-gray-800/90 shadow-lg ${
              swipeDirection === 'left' ? 'text-blue-600' : 'text-green-600'
            }`}>
              {swipeDirection === 'left' ? (
                <>
                  <ChevronRight className="w-5 h-5" />
                  <span className="font-medium">下一题</span>
                </>
              ) : (
                <>
                  <ChevronLeft className="w-5 h-5" />
                  <span className="font-medium">上一题</span>
                </>
              )}
            </div>
          </div>
        )}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">
              {quizState.currentQuestionIndex + 1}. {currentQuestion.text}
            </h2>
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium flex-shrink-0">
              {currentQuestion.type}
            </span>
          </div>

          {/* Options */}
          {currentQuestion.type !== '填空题' && (
            <div className="space-y-3">
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
                  <label
                    key={index}
                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : isCorrectAnswer && settings.mode === 'recite'
                        ? 'border-success-500 bg-success-50 dark:bg-success-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300 dark:hover:border-primary-600'
                    } ${settings.mode === 'recite' ? 'pointer-events-none opacity-75' : ''}`}
                  >
                    <input
                      type={currentQuestion.type === '多选题' ? 'checkbox' : 'radio'}
                      name={`question-${quizState.currentQuestionIndex}`}
                      value={letter}
                      checked={isSelected || false}
                      onChange={(e) => {
                        if (currentQuestion.type === '多选题') {
                          // 确保currentAnswer是字符串
                          const currentAnswerStr = currentAnswer || '';
                          const currentAnswers = currentAnswerStr.split('').filter(char => char.match(/[A-Z]/));
                          
                          if (e.target.checked) {
                            if (!currentAnswers.includes(letter)) {
                              currentAnswers.push(letter);
                            }
                          } else {
                            const index = currentAnswers.indexOf(letter);
                            if (index > -1) currentAnswers.splice(index, 1);
                          }
                          
                          const newAnswer = currentAnswers.sort().join('');
                          handleAnswerChange(newAnswer || null);
                        } else {
                          handleAnswerChange(letter);
                        }
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
                    <span className="text-gray-900 dark:text-white flex items-center">
                      {letter}. {option}
                      {isCorrectAnswer && settings.mode === 'recite' && (
                        <span className="ml-2 text-success-600 dark:text-success-400 text-sm font-medium">
                          ✓ 正确答案
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Fill-in question */}
          {currentQuestion.type === '填空题' && (
            <div className="space-y-3">
              {currentQuestion.answer.split('|||').map((_, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder={`请填写第 ${index + 1} 个答案`}
                  value={currentAnswer ? currentAnswer.split('|||')[index] || '' : ''}
                  onChange={(e) => {
                    const answers = currentAnswer ? currentAnswer.split('|||') : [];
                    answers[index] = e.target.value;
                    handleAnswerChange(answers.join('|||'));
                  }}
                  className="input"
                  disabled={settings.mode === 'recite'}
                />
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
                {settings.mode === 'recite' ? '正确答案' : 
                 feedbackData.isCorrect ? '回答正确！' : '回答错误'}
              </span>
            </div>
            {feedbackData.userAnswerText && (
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                您的答案: <span dangerouslySetInnerHTML={{ __html: feedbackData.userAnswerText }} />
              </p>
            )}
            <p className="text-gray-700 dark:text-gray-300">
              正确答案: <span dangerouslySetInnerHTML={{ __html: feedbackData.correctAnswerText }} />
            </p>
            {currentQuestion.explanation && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                <strong>解析:</strong> {currentQuestion.explanation}
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
                题目导航
              </h3>
              {/* 关闭按钮与标题水平对齐 */}
              <button
                onClick={() => setShowNavPanel(false)}
                className="absolute right-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors duration-200"
                title="关闭导航"
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
                  className={`p-2 sm:p-2.5 md:p-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 ${
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
                确认提前交卷
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                您确定要提前交卷吗？
              </p>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  已答题数：{quizState.userAnswers.filter(a => a !== null).length} / {questions.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  未答题数：{quizState.userAnswers.filter(a => a === null).length}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelSubmit}
                className="btn btn-secondary"
              >
                取消
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="btn btn-warning"
              >
                确认交卷
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 