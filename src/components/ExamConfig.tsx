import React, { useState, useEffect } from 'react';
import { ExamConfig as ExamConfigType, ExamSettings, QuestionRange } from '../types';

interface ExamConfigProps {
  questionTypes: string[];
  onConfigChange: (config: ExamSettings) => void;
}

export const ExamConfig = ({ questionTypes, onConfigChange }: ExamConfigProps) => {
  const [configs, setConfigs] = useState<ExamConfigType[]>([]);
  const [examDragState, setExamDragState] = useState<{
    isDragging: boolean;
    configIndex: number;
    rangeIndex: number;
    startX: number;
    startLeft: number;
  } | null>(null);

  useEffect(() => {
    // Initialize configs for the 4 basic question types only
    const basicQuestionTypes = ['单选题', '多选题', '判断题', '填空题'];
    
    // Only initialize if configs is empty
    if (configs.length === 0) {
      const initialConfigs = basicQuestionTypes.map(type => ({
        questionType: type,
        count: 0,
        score: 1,
        questionRanges: [],
        useCustomRanges: false
      }));
      setConfigs(initialConfigs);
    }
  }, [configs.length]);

  useEffect(() => {
    // Calculate totals and notify parent
    const totalQuestions = configs.reduce((sum, config) => sum + config.count, 0);
    const totalScore = configs.reduce((sum, config) => sum + (config.count * config.score), 0);
    
    onConfigChange({
      configs,
      totalQuestions,
      totalScore
    });
  }, [configs, onConfigChange]);

  const handleConfigChange = (index: number, field: keyof ExamConfigType, value: number | boolean | QuestionRange[]) => {
    const newConfigs = [...configs];
    newConfigs[index] = {
      ...newConfigs[index],
      [field]: field === 'count' || field === 'score' ? Math.max(0, value as number) : value
    };
    setConfigs(newConfigs);
  };

  // 考试模式拖拽处理函数
  const handleExamRangeDragStart = (e: React.MouseEvent, configIndex: number, rangeIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const config = configs[configIndex];
    const range = config.questionRanges[rangeIndex];
    const startX = e.clientX;
    const startLeft = ((range.start - 1) / 50) * 100;
    
    setExamDragState({
      isDragging: true,
      configIndex,
      rangeIndex,
      startX,
      startLeft
    });
  };

  const handleExamRangeDragMove = (e: MouseEvent) => {
    if (!examDragState?.isDragging) return;
    
    const { configIndex, rangeIndex, startX, startLeft } = examDragState;
    const config = configs[configIndex];
    const range = config.questionRanges[rangeIndex];
    const sliderTrack = document.querySelector(`[data-config-index="${configIndex}"][data-range-index="${rangeIndex}"] .slider-track`) as HTMLElement;
    
    if (!sliderTrack) return;
    
    const rect = sliderTrack.getBoundingClientRect();
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / rect.width) * 100;
    const rangeWidthPercent = ((range.end - range.start + 1) / 50) * 100;
    const newLeft = Math.max(0, Math.min(100 - rangeWidthPercent, startLeft + deltaPercent));
    
    const newStart = Math.floor((newLeft / 100) * 50) + 1;
    const rangeWidth = range.end - range.start + 1;
    const newEnd = Math.min(50, newStart + rangeWidth - 1);
    
    const newConfigs = [...configs];
    const newRanges = [...config.questionRanges];
    newRanges[rangeIndex] = {
      start: newStart,
      end: newEnd
    };
    newConfigs[configIndex] = {
      ...config,
      questionRanges: newRanges
    };
    
    setConfigs(newConfigs);
  };

  const handleExamRangeDragEnd = () => {
    setExamDragState(null);
  };

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (examDragState?.isDragging) {
      document.addEventListener('mousemove', handleExamRangeDragMove);
      document.addEventListener('mouseup', handleExamRangeDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleExamRangeDragMove);
        document.removeEventListener('mouseup', handleExamRangeDragEnd);
      };
    }
  }, [examDragState, configs]);

  const validateConfig = (config: ExamConfigType) => {
    return config.count >= 0 && config.score >= 0;
  };

  const isValid = configs.every(validateConfig);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        考试配置
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        为每种题型设置出题数量和分值
      </p>
      
      <div className="space-y-4">
        {configs.map((config, index) => (
          <div key={config.questionType} className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {config.questionType}
              </h4>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                题库中共有 {questionTypes.filter(type => type === config.questionType).length} 题
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  出题数量
                </label>
                <input
                  type="number"
                  min="0"
                  value={config.count}
                  onChange={(e) => handleConfigChange(index, 'count', parseInt(e.target.value) || 0)}
                  className="input"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  每题分值
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={config.score}
                  onChange={(e) => handleConfigChange(index, 'score', parseFloat(e.target.value) || 0)}
                  className="input"
                  placeholder="1"
                />
              </div>
            </div>
            
            {/* 答题范围配置 */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  答题范围
                </label>
                <button
                  type="button"
                  onClick={() => handleConfigChange(index, 'useCustomRanges', !config.useCustomRanges)}
                  className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                    !config.useCustomRanges
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {config.useCustomRanges ? '自定义' : '全选'}
                </button>
              </div>
              
              {config.useCustomRanges ? (
                <div className="space-y-3">
                  {/* 可视化答题范围 */}
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      范围可视化
                    </label>
                    <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                      {/* 背景网格 */}
                      <div className="absolute inset-0 flex">
                        {Array.from({ length: Math.min(10, 50) }, (_, i) => (
                          <div key={i} className="flex-1 border-r border-gray-300 dark:border-gray-600"></div>
                        ))}
                      </div>
                      
                      {/* 范围覆盖 */}
                      {config.questionRanges.map((range, rangeIndex) => {
                        const startPercent = ((range.start - 1) / 50) * 100;
                        const endPercent = (range.end / 50) * 100;
                        const width = endPercent - startPercent;
                        
                        return (
                          <div
                            key={rangeIndex}
                            className="absolute h-full bg-primary-500 opacity-70"
                            style={{
                              left: `${startPercent}%`,
                              width: `${width}%`
                            }}
                            title={`范围 ${rangeIndex + 1}: ${range.start}-${range.end}`}
                          ></div>
                        );
                      })}
                      
                      {/* 刻度标签 */}
                      <div className="absolute bottom-0 left-0 right-0 text-xs text-gray-500 px-1">
                        <span>1</span>
                        <span className="float-right">50</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 双滑块控制 */}
                  {config.questionRanges.map((range, rangeIndex) => (
                    <div key={rangeIndex} data-config-index={index} data-range-index={rangeIndex} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs text-gray-600 dark:text-gray-400">
                          范围 {rangeIndex + 1}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newRanges = config.questionRanges.filter((_, i) => i !== rangeIndex);
                            handleConfigChange(index, 'questionRanges', newRanges);
                          }}
                          className="px-1 py-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-xs"
                        >
                          删除
                        </button>
                      </div>
                      
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={range.start}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            const newRanges = [...config.questionRanges];
                            newRanges[rangeIndex] = {
                              ...newRanges[rangeIndex],
                              start: Math.min(newValue, range.end)
                            };
                            handleConfigChange(index, 'questionRanges', newRanges);
                          }}
                          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-range"
                          style={{ zIndex: 2 }}
                        />
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={range.end}
                          onChange={(e) => {
                            const newValue = parseInt(e.target.value);
                            const newRanges = [...config.questionRanges];
                            newRanges[rangeIndex] = {
                              ...newRanges[rangeIndex],
                              end: Math.max(newValue, range.start)
                            };
                            handleConfigChange(index, 'questionRanges', newRanges);
                          }}
                          className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-range"
                          style={{ zIndex: 2 }}
                        />
                        
                        {/* 滑块轨道 */}
                        <div className="slider-track h-2 bg-gray-200 dark:bg-gray-700 rounded relative">
                          <div
                            className="slider-fill absolute h-full bg-primary-500 rounded cursor-move"
                            style={{
                              left: `${((range.start - 1) / 50) * 100}%`,
                              width: `${((range.end - range.start + 1) / 50) * 100}%`
                            }}
                            onMouseDown={(e) => handleExamRangeDragStart(e, index, rangeIndex)}
                            title="拖拽移动范围"
                          ></div>
                        </div>
                        
                        {/* 数值输入框 */}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max={range.end}
                              value={range.start}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value) || 1;
                                const newRanges = [...config.questionRanges];
                                newRanges[rangeIndex] = {
                                  ...newRanges[rangeIndex],
                                  start: Math.min(Math.max(newValue, 1), range.end)
                                };
                                handleConfigChange(index, 'questionRanges', newRanges);
                              }}
                              className="w-12 h-6 px-1 text-center text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                            <span className="text-gray-500 text-xs">-</span>
                            <input
                              type="number"
                              min={range.start}
                              max="50"
                              value={range.end}
                              onChange={(e) => {
                                const newValue = parseInt(e.target.value) || 1;
                                const newRanges = [...config.questionRanges];
                                newRanges[rangeIndex] = {
                                  ...newRanges[rangeIndex],
                                  end: Math.max(Math.min(newValue, 50), range.start)
                                };
                                handleConfigChange(index, 'questionRanges', newRanges);
                              }}
                              className="w-12 h-6 px-1 text-center text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    onClick={() => {
                      const newRanges = [...config.questionRanges, { start: 1, end: 1 }];
                      handleConfigChange(index, 'questionRanges', newRanges);
                    }}
                    className="btn btn-secondary text-xs px-2 py-1"
                  >
                    添加范围
                  </button>
                </div>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  将答题该类型所有题目
                </p>
              )}
            </div>
            
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              小计: {config.count} 题 × {config.score} 分 = {config.count * config.score} 分
            </div>
          </div>
        ))}
      </div>
      
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              总计: {configs.reduce((sum, config) => sum + config.count, 0)} 题
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              满分: {configs.reduce((sum, config) => sum + (config.count * config.score), 0)} 分
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            isValid 
              ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200'
              : 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-200'
          }`}>
            {isValid ? '配置有效' : '请检查配置'}
          </div>
        </div>
      </div>
    </div>
  );
}; 