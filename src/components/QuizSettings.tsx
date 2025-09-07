import { useState, useEffect } from 'react';
import { QuizSettings as QuizSettingsType, ExamSettings } from '../types';
import { ExamConfig } from './ExamConfig';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
            {t('quizsettings.title')}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('quizsettings.description')}
          </p>
        </div>
        
        <div className="space-y-6">
          {/* 答题模式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('quizsettings.mode_label')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'quiz', label: t('quizsettings.mode_quiz_label'), desc: t('quizsettings.mode_quiz_desc') },
                { value: 'review', label: t('quizsettings.mode_review_label'), desc: t('quizsettings.mode_review_desc') },
                { value: 'recite', label: t('quizsettings.mode_recite_label'), desc: t('quizsettings.mode_recite_desc') },
                { value: 'exam', label: t('quizsettings.mode_exam_label'), desc: t('quizsettings.mode_exam_desc') }
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
              {t('quizsettings.order_label')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'sequential', label: t('quizsettings.order_sequential_label'), desc: t('quizsettings.order_sequential_desc') },
                { value: 'random', label: t('quizsettings.order_random_label'), desc: t('quizsettings.order_random_desc') }
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
                {t('quizsettings.limit_label')}
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
                {t('quizsettings.limit_desc', { maxQuestions: maxQuestions })}
              </p>
            </div>
          )}

          {/* 答题范围 - 考试模式下隐藏 */}
          {settings.mode !== 'exam' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quizsettings.range_label')}
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
                  {settings.useCustomRanges ? t('quizsettings.custom_range') : t('quizsettings.select_all')}
                </button>
              </div>
              
              {settings.useCustomRanges ? (
                <div className="space-y-4">
                  {/* 可视化答题范围 */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {t('quizsettings.range_visualization_label')}
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
                            title={t('quizsettings.range_n', { index: index + 1, start: range.start, end: range.end })}
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
                          {t('quizsettings.range_n_short', { index: index + 1 })}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newRanges = settings.questionRanges.filter((_, i) => i !== index);
                            handleChange('questionRanges', newRanges);
                          }}
                          className="px-2 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs"
                        >
                          {t('common.delete', { defaultValue: '删除' })}
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
                            title={t('quizsettings.drag_to_move')}
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
                    {t('quizsettings.add_range')}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('quizsettings.all_questions_range', { totalQuestions: totalQuestions })}
                </p>
              )}
            </div>
          )}

          {/* 判断题选项 - 只在有判断题时显示 */}
          {questionTypes.includes('判断题') && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quizsettings.judgement_options_title')}
                </label>
                <div className="relative group">
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-help hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">?</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    <div className="relative">
                      <div className="mb-2">
                        <strong>{t('quizsettings.tolerance_mechanism_title')}</strong>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>• {t('quizsettings.tolerance_mechanism_desc1')}</div>
                        <div>• {t('quizsettings.tolerance_mechanism_desc2')}</div>
                        <div>• {t('quizsettings.tolerance_mechanism_desc3')}</div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('quizsettings.judgement_true_label')}
                  </label>
                  <input
                    type="text"
                    value={settings.judgementTrue}
                    onChange={(e) => handleChange('judgementTrue', e.target.value)}
                    className="input"
                    placeholder={t('quizsettings.judgement_true_placeholder')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('quizsettings.judgement_false_label')}
                  </label>
                  <input
                    type="text"
                    value={settings.judgementFalse}
                    onChange={(e) => handleChange('judgementFalse', e.target.value)}
                    className="input"
                    placeholder={t('quizsettings.judgement_false_placeholder')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* 填空题答案分隔符配置 - 只在有填空题时显示 */}
          {questionTypes.includes('填空题') && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('quizsettings.fill_blank_separator_title')}
                </label>
                <div className="relative group">
                  <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-help hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">?</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    <div className="relative">
                      <div className="mb-2">
                        <strong>{t('quizsettings.separator_description_title')}</strong>
                      </div>
                      <div className="text-xs space-y-1">
                        <div>• {t('quizsettings.separator_description_desc1')}</div>
                        <div>• {t('quizsettings.separator_description_desc2')}</div>
                        <div>• {t('quizsettings.separator_description_desc3')}</div>
                      </div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* 预设分隔符选项 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('quizsettings.preset_separator_label')}
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      { value: '|', label: t('quizsettings.separator_pipe_label'), desc: '| ' + t('common.recommended') },
                      { value: '/', label: t('quizsettings.separator_slash_label'), desc: '/' },
                      { value: '#', label: t('quizsettings.separator_hash_label'), desc: '#' },
                      { value: '、', label: t('quizsettings.separator_dot_label'), desc: '、' }
                    ].map((separator) => (
                      <button
                        key={separator.value}
                        type="button"
                        onClick={() => handleChange('fillBlankSeparator', separator.value)}
                        className={`p-3 text-left rounded-lg border transition-all duration-200 ${
                          settings.fillBlankSeparator === separator.value
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
                        }`}
                      >
                        <div className="font-medium text-sm">{separator.label}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{separator.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* 自定义分隔符 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('quizsettings.custom_separator_label')}
                  </label>
                  <input
                    type="text"
                    value={settings.fillBlankSeparator}
                    onChange={(e) => handleChange('fillBlankSeparator', e.target.value)}
                    className="input font-mono"
                    placeholder={t('quizsettings.custom_separator_placeholder')}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('quizsettings.current_separator')}: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{settings.fillBlankSeparator || '|||'}</code>
                  </p>
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
              {t('quizsettings.exam_config_title')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('quizsettings.exam_config_description')}
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