import { useState, useEffect } from 'react';
import { QuizSettings as QuizSettingsType, ExamSettings } from '../types';
import { ExamConfig } from './ExamConfig';

interface QuizSettingsProps {
  settings: QuizSettingsType;
  onSettingsChange: (settings: QuizSettingsType) => void;
  questionTypes?: string[];
  onExamSettingsChange?: (settings: ExamSettings) => void;
  totalQuestions?: number;
  selectedSheets?: any[]; // 新增：选中的工作表信息
  questions?: any[]; // 新增：实际的题目数据
}

export const QuizSettings = ({ 
  settings, 
  onSettingsChange,
  questionTypes = [],
  onExamSettingsChange,
  totalQuestions = 0,
  selectedSheets = [],
  questions = []
}: QuizSettingsProps) => {
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    rangeIndex: number;
    startX: number;
    startLeft: number;
  } | null>(null);
  const handleChange = (key: keyof QuizSettingsType, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // 拖拽处理函数
  const handleRangeDragStart = (e: React.MouseEvent, rangeIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const range = settings.questionRanges[rangeIndex];
    const startX = e.clientX;
    const startLeft = ((range.start - 1) / totalQuestions) * 100;
    
    setDragState({
      isDragging: true,
      rangeIndex,
      startX,
      startLeft
    });
  };

  const handleRangeDragMove = (e: MouseEvent) => {
    if (!dragState?.isDragging) return;
    
    const { rangeIndex, startX, startLeft } = dragState;
    const range = settings.questionRanges[rangeIndex];
    const sliderTrack = document.querySelector(`[data-range-index="${rangeIndex}"] .slider-track`) as HTMLElement;
    
    if (!sliderTrack) return;
    
    const rect = sliderTrack.getBoundingClientRect();
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / rect.width) * 100;
    const rangeWidthPercent = ((range.end - range.start + 1) / totalQuestions) * 100;
    const newLeft = Math.max(0, Math.min(100 - rangeWidthPercent, startLeft + deltaPercent));
    
    const newStart = Math.floor((newLeft / 100) * totalQuestions) + 1;
    const rangeWidth = range.end - range.start + 1;
    const newEnd = Math.min(totalQuestions, newStart + rangeWidth - 1);
    
    const newRanges = [...settings.questionRanges];
    newRanges[rangeIndex] = {
      start: newStart,
      end: newEnd
    };
    
    onSettingsChange({ ...settings, questionRanges: newRanges });
  };

  const handleRangeDragEnd = () => {
    setDragState(null);
  };

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (dragState?.isDragging) {
      document.addEventListener('mousemove', handleRangeDragMove);
      document.addEventListener('mouseup', handleRangeDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleRangeDragMove);
        document.removeEventListener('mouseup', handleRangeDragEnd);
      };
    }
  }, [dragState, settings.questionRanges, totalQuestions]);

  const maxQuestions = Math.max(totalQuestions, 100);
  const currentValue = settings.limit || 0;
  const percentage = maxQuestions > 0 ? (currentValue / maxQuestions) * 100 : 0;

  return (
    <div className="space-y-8">
      {/* 答题设置部分 */}
      <div className="space-y-6">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            答题设置
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            配置答题模式、顺序和范围等基本设置
          </p>
        </div>
        
        <div className="space-y-6">
          {/* 答题模式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              答题模式
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'quiz', label: '答题模式', desc: '正常答题，提交后查看结果' },
                { value: 'review', label: '复习模式', desc: '可随时查看答案和解析' },
                { value: 'recite', label: '背题模式', desc: '直接显示答案，用于记忆' },
                { value: 'exam', label: '考试模式', desc: '按题型配置出题数量和分值' }
              ].map((mode) => (
                <label key={mode.value} className="relative flex cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 p-4 focus:outline-none hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                  <input
                    type="radio"
                    name="mode"
                    value={mode.value}
                    checked={settings.mode === mode.value}
                    onChange={(e) => handleChange('mode', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">{mode.label}</p>
                        <p className="text-gray-500 dark:text-gray-400">{mode.desc}</p>
                      </div>
                    </div>
                    <div className={`shrink-0 w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all duration-200 ${
                      settings.mode === mode.value 
                        ? 'border-primary-600 bg-primary-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {settings.mode === mode.value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 题目顺序 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              题目顺序
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'sequential', label: '顺序出题', desc: '按照题目原有顺序进行答题' },
                { value: 'random', label: '随机出题', desc: '随机打乱题目顺序进行答题' }
              ].map((order) => (
                <label key={order.value} className="relative flex cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 p-4 focus:outline-none hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                  <input
                    type="radio"
                    name="orderMode"
                    value={order.value}
                    checked={settings.orderMode === order.value}
                    onChange={(e) => handleChange('orderMode', e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900 dark:text-white">{order.label}</p>
                        <p className="text-gray-500 dark:text-gray-400">{order.desc}</p>
                      </div>
                    </div>
                    <div className={`shrink-0 w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all duration-200 ${
                      settings.orderMode === order.value 
                        ? 'border-primary-600 bg-primary-600' 
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {settings.orderMode === order.value && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 答题数量 - 考试模式下隐藏 */}
          {settings.mode !== 'exam' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                答题数量
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max={maxQuestions}
                    value={currentValue}
                    onChange={(e) => handleChange('limit', parseInt(e.target.value) || 0)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
                    style={{
                      '--percentage': `${percentage}%`,
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`
                    } as React.CSSProperties}
                  />
                </div>
                <div className="w-20">
                  <input
                    type="number"
                    min="0"
                    max={maxQuestions}
                    value={currentValue}
                    onChange={(e) => handleChange('limit', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                    className="input text-center"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                0表示不限制题目数量，最大{maxQuestions}题（会受答题范围影响）
              </p>
            </div>
          )}

          {/* 答题范围 - 考试模式下隐藏 */}
          {settings.mode !== 'exam' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  答题范围
                </label>
                <button
                  type="button"
                  onClick={() => handleChange('useCustomRanges', !settings.useCustomRanges)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                    !settings.useCustomRanges
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {settings.useCustomRanges ? '自定义范围' : '全选'}
                </button>
              </div>
              
              {settings.useCustomRanges ? (
                <div className="space-y-4">
                  {/* 可视化答题范围 */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                      答题范围可视化
                    </label>
                    <div className="relative h-8 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                      {/* 背景网格 */}
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: Math.min(20, totalQuestions) }, (_, i) => (
                          <div key={i} className="flex-1 border-r border-gray-300 dark:border-gray-600"></div>
                        ))}
                      </div>
                      
                      {/* 范围覆盖 */}
                      {settings.questionRanges.map((range, index) => {
                        const startPercent = ((range.start - 1) / totalQuestions) * 100;
                        const endPercent = (range.end / totalQuestions) * 100;
                        const width = endPercent - startPercent;
                        
                        return (
                          <div
                            key={index}
                            className="absolute h-full bg-primary-500 opacity-70"
                            style={{
                              left: `${startPercent}%`,
                              width: `${width}%`
                            }}
                            title={`范围 ${index + 1}: ${range.start}-${range.end}`}
                          ></div>
                        );
                      })}
                      
                      {/* 刻度标签 */}
                      <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-500 px-2">
                        <span>1</span>
                        <span className="float-right">{totalQuestions}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 双滑块控制 */}
                  {settings.questionRanges.map((range, index) => (
                    <div key={index} data-range-index={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs text-gray-600 dark:text-gray-400">
                          范围 {index + 1}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newRanges = settings.questionRanges.filter((_, i) => i !== index);
                            handleChange('questionRanges', newRanges);
                          }}
                          className="px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs"
                        >
                          删除
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max={totalQuestions}
                          value={range.start}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            const newRanges = [...settings.questionRanges];
                            newRanges[index] = {
                              ...newRanges[index],
                              start: Math.min(newValue, range.end)
                            };
                            handleChange('questionRanges', newRanges);
                          }}
                          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-range"
                          style={{ zIndex: 2 }}
                        />
                        <input
                          type="range"
                          min="1"
                          max={totalQuestions}
                          value={range.end}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            const newRanges = [...settings.questionRanges];
                            newRanges[index] = {
                              ...newRanges[index],
                              end: Math.max(newValue, range.start)
                            };
                            handleChange('questionRanges', newRanges);
                          }}
                          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-range"
                          style={{ zIndex: 2 }}
                        />
                        
                        {/* 滑块轨道 */}
                        <div className="slider-track h-2 bg-gray-200 dark:bg-gray-700 rounded-lg relative">
                          <div
                            className="slider-fill absolute h-full bg-primary-500 rounded-lg cursor-move"
                            style={{
                              left: `${((range.start - 1) / totalQuestions) * 100}%`,
                              width: `${((range.end - range.start + 1) / totalQuestions) * 100}%`
                            }}
                            onMouseDown={(e) => handleRangeDragStart(e, index)}
                            title="拖拽移动范围"
                          ></div>
                        </div>
                      
                      {/* 数值输入框 */}
                      <div className="flex justify-between items-center mt-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max={range.end}
                            value={range.start}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 1;
                              const newRanges = [...settings.questionRanges];
                              newRanges[index] = {
                                ...newRanges[index],
                                start: Math.min(Math.max(newValue, 1), range.end)
                              };
                              handleChange('questionRanges', newRanges);
                            }}
                            className="w-16 h-8 px-2 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                          <span className="text-gray-500 text-sm">-</span>
                          <input
                            type="number"
                            min={range.start}
                            max={totalQuestions}
                            value={range.end}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value) || 1;
                              const newRanges = [...settings.questionRanges];
                              newRanges[index] = {
                                ...newRanges[index],
                                end: Math.max(Math.min(newValue, totalQuestions), range.start)
                              };
                              handleChange('questionRanges', newRanges);
                            }}
                            className="w-16 h-8 px-2 text-center text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                          />
                        </div>
                      </div>
                    </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newRanges = [...settings.questionRanges, { start: 1, end: 1 }];
                      handleChange('questionRanges', newRanges);
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    添加范围
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  将答题所有题目（1-{totalQuestions}）
                </p>
              )}
            </div>
          )}

          {/* 判断题选项 - 只在有判断题时显示 */}
          {questionTypes.includes('判断题') && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  判断题选项配置
                </label>
                <div className="relative group">
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-help hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">?</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    <div className="relative">
                      <div className="mb-2">
                        <strong>宽容机制说明：</strong>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>• 支持多种正确答案格式</div>
                        <div>• 如：A/B、对/错、正确/错误</div>
                        <div>• 系统会自动识别和匹配</div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    判断题正确选项
                  </label>
                  <input
                    type="text"
                    value={settings.judgementTrue}
                    onChange={(e) => handleChange('judgementTrue', e.target.value)}
                    className="input"
                    placeholder="正确"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    判断题错误选项
                  </label>
                  <input
                    type="text"
                    value={settings.judgementFalse}
                    onChange={(e) => handleChange('judgementFalse', e.target.value)}
                    className="input"
                    placeholder="错误"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 考试配置部分 - 只在考试模式下显示 */}
      {settings.mode === 'exam' && questionTypes.length > 0 && onExamSettingsChange && (
        <div className="space-y-6">
          {/* 分隔线 */}
          <div className="border-t-2 border-gray-300 dark:border-gray-600 my-8"></div>
          
          {/* 考试配置标题 */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              考试配置
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              为每种题型设置出题数量和分值，配置考试规则
            </p>
          </div>
          
          <ExamConfig 
            questionTypes={questionTypes}
            onConfigChange={onExamSettingsChange}
            totalQuestions={totalQuestions}
            selectedSheets={selectedSheets}
            questions={questions}
          />
        </div>
      )}
    </div>
  );
}; 