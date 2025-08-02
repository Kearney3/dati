import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ExamConfig as ExamConfigType, ExamSettings, QuestionRange } from '../types';
import { loadExamConfig, saveExamConfig } from '../utils/storage';

interface ExamConfigProps {
  questionTypes: string[];
  onConfigChange: (config: ExamSettings) => void;
  totalQuestions?: number; // 新增：总题目数量
  selectedSheets?: any[]; // 新增：选中的工作表信息
  questions?: any[]; // 新增：实际的题目数据
}

export const ExamConfig = ({ onConfigChange, totalQuestions = 0, selectedSheets = [], questions = [] }: ExamConfigProps) => {
  const [configs, setConfigs] = useState<ExamConfigType[]>([]);
  const [examDragState, setExamDragState] = useState<{
    isDragging: boolean;
    configIndex: number;
    rangeIndex: number;
    startX: number;
    startLeft: number;
  } | null>(null);

  // 使用useMemo缓存题目类型统计，避免重复计算
  const questionTypeCounts = useMemo(() => {
    const counts: { [key: string]: number } = {};
    if (questions && questions.length > 0) {
      questions.forEach(q => {
        const type = q.type;
        counts[type] = (counts[type] || 0) + 1;
      });
    }
    return counts;
  }, [questions]);

  // 计算每种题型在选中工作表中的实际题目数量
  const getQuestionTypeCount = useCallback((type: string) => {
    return questionTypeCounts[type] || 0;
  }, [questionTypeCounts]);

  // 从localStorage加载配置
  const loadConfigsFromStorage = () => {
    try {
      const savedExamSettings = loadExamConfig();
      if (savedExamSettings) {
        return savedExamSettings.configs || null;
      }
    } catch (error) {
      console.error('Failed to load exam configs from storage:', error);
    }
    return null;
  };

  // 保存配置到localStorage
  const saveConfigsToStorage = useCallback((configs: ExamConfigType[]) => {
    try {
      // 计算总分
      const totalQuestions = configs.reduce((sum, config) => sum + config.count, 0);
      const totalScore = configs.reduce((sum, config) => sum + (config.count * config.score), 0);
      
      const examSettings = {
        configs,
        totalQuestions,
        totalScore
      };
      
      saveExamConfig(examSettings);
    } catch (error) {
      console.error('Failed to save exam configs to storage:', error);
    }
  }, []);

  useEffect(() => {
    // Initialize configs for the 4 basic question types only
    const basicQuestionTypes = ['单选题', '多选题', '判断题', '填空题'];
    
    // 尝试从localStorage加载配置
    const savedConfigs = loadConfigsFromStorage();
    
    if (savedConfigs && savedConfigs.length > 0) {
      // 使用保存的配置，但更新题目数量
      const updatedConfigs = savedConfigs.map((config: ExamConfigType) => ({
        ...config,
        count: Math.min(config.count, getQuestionTypeCount(config.questionType))
      }));
      setConfigs(updatedConfigs);
    } else {
      // 创建新的配置
      const initialConfigs = basicQuestionTypes.map(type => ({
        questionType: type,
        count: 0,
        score: 1,
        questionRanges: [],
        useCustomRanges: false
      }));
      setConfigs(initialConfigs);
    }
  }, []); // 只在组件挂载时初始化一次，不依赖其他状态

  // 当题目数量变化时，更新配置中的count值，但不重新初始化
  useEffect(() => {
    if (configs.length > 0) {
      const updatedConfigs = configs.map((config: ExamConfigType) => ({
        ...config,
        count: Math.min(config.count, getQuestionTypeCount(config.questionType))
      }));
      setConfigs(updatedConfigs);
    }
  }, [questionTypeCounts, configs.length]); // 依赖题目类型统计和配置数量

  useEffect(() => {
    // Calculate totals and notify parent
    const totalQuestions = configs.reduce((sum, config) => sum + config.count, 0);
    const totalScore = configs.reduce((sum, config) => sum + (config.count * config.score), 0);
    
    const examSettings: ExamSettings = {
      configs,
      totalQuestions,
      totalScore
    };
    
    onConfigChange(examSettings);
    
    // 保存到localStorage
    saveConfigsToStorage(configs);
  }, [configs, onConfigChange, saveConfigsToStorage]);

  const handleConfigChange = useCallback((index: number, field: keyof ExamConfigType, value: number | boolean | QuestionRange[]) => {
    setConfigs(prevConfigs => {
      const newConfigs = [...prevConfigs];
      const currentConfig = newConfigs[index];
      
      if (field === 'count') {
        const maxCount = getQuestionTypeCount(currentConfig.questionType);
        const newCount = Math.min(Math.max(0, value as number), maxCount);
        newConfigs[index] = {
          ...currentConfig,
          count: newCount
        };
      } else {
        newConfigs[index] = {
          ...currentConfig,
          [field]: value
        };
      }
      
      return newConfigs;
    });
  }, [getQuestionTypeCount]);

  // 考试模式拖拽处理函数
  const handleExamRangeDragStart = (e: React.MouseEvent, configIndex: number, rangeIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    const config = configs[configIndex];
    const range = config.questionRanges[rangeIndex];
    const maxQuestions = getQuestionTypeCount(config.questionType);
    const startX = e.clientX;
    const startLeft = ((range.start - 1) / maxQuestions) * 100;
    
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
    const maxQuestions = getQuestionTypeCount(config.questionType);
    const sliderTrack = document.querySelector(`[data-config-index="${configIndex}"][data-range-index="${rangeIndex}"] .slider-track`) as HTMLElement;
    
    if (!sliderTrack) return;
    
    const rect = sliderTrack.getBoundingClientRect();
    const deltaX = e.clientX - startX;
    const deltaPercent = (deltaX / rect.width) * 100;
    const rangeWidthPercent = ((range.end - range.start + 1) / maxQuestions) * 100;
    const newLeft = Math.max(0, Math.min(100 - rangeWidthPercent, startLeft + deltaPercent));
    
    const newStart = Math.floor((newLeft / 100) * maxQuestions) + 1;
    const rangeWidth = range.end - range.start + 1;
    const newEnd = Math.min(maxQuestions, newStart + rangeWidth - 1);
    
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

  // 优化配置验证逻辑
  const getConfigStatus = () => {
    const totalConfiguredQuestions = configs.reduce((sum, config) => sum + config.count, 0);
    const totalAvailableQuestions = totalQuestions;
    const hasInvalidConfigs = configs.some(config => config.count < 0 || config.score < 0);
    const hasZeroScores = configs.some(config => config.count > 0 && config.score === 0);
    const hasQuestions = totalConfiguredQuestions > 0;
    const exceedsAvailable = totalConfiguredQuestions > totalAvailableQuestions;

    if (hasInvalidConfigs) {
      return {
        status: 'error',
        message: '配置有误',
        description: '存在无效的题目数量或分值设置',
        color: 'danger'
      };
    }

    if (hasZeroScores) {
      return {
        status: 'warning',
        message: '分值设置',
        description: '有题目数量但分值为0，请检查分值设置',
        color: 'warning'
      };
    }

    if (!hasQuestions) {
      return {
        status: 'info',
        message: '请设置题目',
        description: '请为至少一种题型设置题目数量',
        color: 'info'
      };
    }

    if (exceedsAvailable) {
      return {
        status: 'warning',
        message: '题目超限',
        description: `配置题目数(${totalConfiguredQuestions})超过可用题目数(${totalAvailableQuestions})`,
        color: 'warning'
      };
    }

    return {
      status: 'success',
      message: '配置有效',
      description: `已配置 ${totalConfiguredQuestions} 题，满分 ${configs.reduce((sum, config) => sum + (config.count * config.score), 0)} 分`,
      color: 'success'
    };
  };

  const configStatus = getConfigStatus();

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        考试配置
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        为每种题型设置出题数量和分值
      </p>
      
      {selectedSheets.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <span>📊</span>
            <span>已选择 {selectedSheets.length} 个工作表，总计 {totalQuestions} 题</span>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {configs.map((config, index) => {
          const maxQuestions = getQuestionTypeCount(config.questionType);
          return (
            <div key={config.questionType} className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {config.questionType}
                </h4>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  题库中共有 {maxQuestions} 题
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
                    max={maxQuestions}
                    value={config.count}
                    onChange={(e) => handleConfigChange(index, 'count', parseInt(e.target.value) || 0)}
                    className="input"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    最大可出 {maxQuestions} 题
                  </p>
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
                          {Array.from({ length: Math.min(10, maxQuestions) }, (_, i) => (
                            <div key={i} className="flex-1 border-r border-gray-300 dark:border-gray-600"></div>
                          ))}
                        </div>
                        
                        {/* 范围覆盖 */}
                        {config.questionRanges.map((range, rangeIndex) => {
                          const startPercent = ((range.start - 1) / maxQuestions) * 100;
                          const endPercent = (range.end / maxQuestions) * 100;
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
                          <span className="float-right">{maxQuestions}</span>
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
                            max={maxQuestions}
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
                            max={maxQuestions}
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
                                left: `${((range.start - 1) / maxQuestions) * 100}%`,
                                width: `${((range.end - range.start + 1) / maxQuestions) * 100}%`
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
                                max={maxQuestions}
                                value={range.end}
                                onChange={(e) => {
                                  const newValue = parseInt(e.target.value) || 1;
                                  const newRanges = [...config.questionRanges];
                                  newRanges[rangeIndex] = {
                                    ...newRanges[rangeIndex],
                                    end: Math.max(Math.min(newValue, maxQuestions), range.start)
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
          );
        })}
      </div>
      
      <div className="card p-4 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="font-medium text-gray-900 dark:text-white">
              总计: {configs.reduce((sum, config) => sum + config.count, 0)} 题
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              满分: {configs.reduce((sum, config) => sum + (config.count * config.score), 0)} 分
            </p>
            {configStatus.status !== 'success' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {configStatus.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              configStatus.status === 'success'
                ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200'
                : configStatus.status === 'warning'
                  ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-200'
                  : configStatus.status === 'error'
                    ? 'bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-200'
                    : 'bg-info-100 text-info-800 dark:bg-info-900/30 dark:text-info-200'
            }`}>
              {configStatus.message}
            </div>
            {configStatus.status === 'success' && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {configStatus.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 