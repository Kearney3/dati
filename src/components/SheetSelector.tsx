import React, { useState, useEffect } from 'react';
import { Check, Settings, X, Globe, FileText } from 'lucide-react';
import { MultiSheetConfig, SheetConfig, HeaderMapping } from '../types';
import { StatusBanner } from './StatusBanner';
import { getSheetData } from '../utils/excel';

interface SheetSelectorProps {
  sheetNames: string[];
  multiSheetConfig: MultiSheetConfig;
  onMultiSheetConfigChange: (config: MultiSheetConfig) => void;
  workbook?: any;
}

interface SheetMappingModalProps {
  sheet: SheetConfig;
  headers: string[];
  onClose: () => void;
  onSave: (sheetName: string, mapping: Partial<HeaderMapping>) => void;
}

const SheetMappingModal = ({ sheet, headers, onClose, onSave }: SheetMappingModalProps) => {
  const [mapping, setMapping] = useState<Partial<HeaderMapping>>(sheet.mapping);

  const handleSave = () => {
    onSave(sheet.sheetName, mapping);
    onClose();
  };

  // 处理ESC键退出
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // 处理点击空白处退出
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  const MAPPING_CONFIG = {
    question: { label: '题干', required: true },
    type: { label: '题型', required: true },
    answer: { label: '答案', required: true },
    optionA: { label: '选项A', required: false },
    optionB: { label: '选项B', required: false },
    optionC: { label: '选项C', required: false },
    optionD: { label: '选项D', required: false },
    optionE: { label: '选项E', required: false },
    optionF: { label: '选项F', required: false },
    explanation: { label: '解析', required: false },
  } as const;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            配置表头映射 - {sheet.sheetName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            为 {sheet.sheetName} 工作表配置独立的表头映射
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(MAPPING_CONFIG).map(([key, config]) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {config.label}
                  {config.required && <span className="text-danger-500 ml-1">*</span>}
                </label>
                <select
                  value={mapping[key as keyof HeaderMapping] || ''}
                  onChange={(e) => setMapping({ ...mapping, [key]: e.target.value })}
                  className="input"
                >
                  <option value="">-- 请选择 --</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SheetSelector = ({
  multiSheetConfig,
  onMultiSheetConfigChange,
  workbook,
}: SheetSelectorProps) => {
  const [selectedSheetForMapping, setSelectedSheetForMapping] = useState<SheetConfig | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);

  const handleSelectAll = () => {
    const newSheets = multiSheetConfig.sheets.map(sheet => ({
      ...sheet,
      isSelected: true
    }));
    
    // 检查是否需要更新统一表头映射状态
    const allUseGlobalMapping = newSheets.every(sheet => sheet.useGlobalMapping);
    
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      useGlobalMapping: allUseGlobalMapping,
      sheets: newSheets
    });
  };

  const handleDeselectAll = () => {
    const newSheets = multiSheetConfig.sheets.map(sheet => ({
      ...sheet,
      isSelected: false
    }));
    
    // 当没有选中工作表时，保持统一表头映射状态不变
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      sheets: newSheets
    });
  };

  const handleToggleGlobalMapping = () => {
    const newUseGlobalMapping = !multiSheetConfig.useGlobalMapping;
    
    // 当开启统一表头映射时，将所有工作表切换至使用全局映射
    const newSheets = multiSheetConfig.sheets.map(sheet => ({
      ...sheet,
      useGlobalMapping: newUseGlobalMapping ? true : sheet.useGlobalMapping
    }));
    
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      useGlobalMapping: newUseGlobalMapping,
      sheets: newSheets
    });
  };

  const handleSheetToggle = (sheetName: string) => {
    const newSheets = multiSheetConfig.sheets.map(sheet => 
      sheet.sheetName === sheetName 
        ? { ...sheet, isSelected: !sheet.isSelected }
        : sheet
    );
    
    // 检查是否需要更新统一表头映射状态
    const selectedSheets = newSheets.filter(sheet => sheet.isSelected);
    const allUseGlobalMapping = selectedSheets.length > 0 && selectedSheets.every(sheet => sheet.useGlobalMapping);
    
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      useGlobalMapping: allUseGlobalMapping,
      sheets: newSheets
    });
  };

  const handleSheetUseGlobalMapping = (sheetName: string) => {
    const newSheets = multiSheetConfig.sheets.map(sheet => 
      sheet.sheetName === sheetName 
        ? { ...sheet, useGlobalMapping: !sheet.useGlobalMapping }
        : sheet
    );
    
    // 检查是否需要更新统一表头映射状态
    const selectedSheets = newSheets.filter(sheet => sheet.isSelected);
    const allUseGlobalMapping = selectedSheets.length > 0 && selectedSheets.every(sheet => sheet.useGlobalMapping);
    
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      useGlobalMapping: allUseGlobalMapping,
      sheets: newSheets
    });
  };

  const handleOpenMappingModal = (sheet: SheetConfig) => {
    if (workbook) {
      const { headers } = getSheetData(workbook, sheet.sheetName);
      setSheetHeaders(headers || []);
      setSelectedSheetForMapping(sheet);
    }
  };

  const handleSaveSheetMapping = (sheetName: string, mapping: Partial<HeaderMapping>) => {
    const newSheets = multiSheetConfig.sheets.map(sheet => 
      sheet.sheetName === sheetName 
        ? { ...sheet, mapping }
        : sheet
    );
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      sheets: newSheets
    });
  };

  const selectedCount = multiSheetConfig.sheets.filter(sheet => sheet.isSelected).length;
  const totalCount = multiSheetConfig.sheets.length;

  // 检查配置有效性
  const checkConfigurationValidity = () => {
    const selectedSheets = multiSheetConfig.sheets.filter(sheet => sheet.isSelected);
    
    if (selectedSheets.length === 0) {
      return { isValid: false, message: '请选择工作表' };
    }

    // 检查是否有工作表使用全局映射
    const hasGlobalMappingSheets = selectedSheets.some(sheet => sheet.useGlobalMapping);
    
    if (hasGlobalMappingSheets) {
      // 如果有工作表使用全局映射，检查全局映射是否配置完整
      const requiredFields = ['question', 'type', 'answer'];
      const missingFields = requiredFields.filter(field => !multiSheetConfig.globalMapping[field as keyof HeaderMapping]);
      
      if (missingFields.length > 0) {
        return { isValid: false, message: '全局映射配置不完整' };
      }
    } else {
      // 如果所有工作表都使用独立映射，检查每个工作表的独立映射是否配置完整
      const requiredFields = ['question', 'type', 'answer'];
      const invalidSheets = selectedSheets.filter(sheet => 
        requiredFields.some(field => !sheet.mapping[field as keyof HeaderMapping])
      );

      if (invalidSheets.length > 0) {
        return { 
          isValid: false, 
          message: `配置有误：${invalidSheets.map(s => s.sheetName).join('、')} 映射不完整` 
        };
      }
    }

    return { isValid: true, message: '配置有效' };
  };

  const configValidity = checkConfigurationValidity();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          工作表选择
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="btn btn-secondary text-xs px-3 py-1"
          >
            全选
          </button>
          <button
            onClick={handleDeselectAll}
            className="btn btn-secondary text-xs px-3 py-1"
          >
            取消全选
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* 全局配置开关 */}
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                统一表头映射
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={multiSheetConfig.useGlobalMapping}
                onChange={handleToggleGlobalMapping}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            启用后，所有工作表将使用统一的表头映射配置
          </p>
        </div>

        {/* 工作表列表 */}
        <div className="space-y-3">
          {multiSheetConfig.sheets.map((sheet) => (
            <div
              key={sheet.sheetName}
              className={`card p-4 transition-all duration-200 ${
                sheet.isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sheet.isSelected}
                      onChange={() => handleSheetToggle(sheet.sheetName)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600"></div>
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {sheet.sheetName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({sheet.questionCount} 条数据)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sheet.isSelected && (
                    <>
                      {/* 使用全局映射按钮 */}
                      <button
                        onClick={() => handleSheetUseGlobalMapping(sheet.sheetName)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                          sheet.useGlobalMapping
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        <Globe className="w-4 h-4" />
                        <span>使用全局映射</span>
                      </button>
                      
                      {/* 独立映射按钮 */}
                      <button
                        onClick={() => handleOpenMappingModal(sheet)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                          !sheet.useGlobalMapping
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 border border-gray-200 dark:border-gray-600 cursor-not-allowed'
                        }`}
                        disabled={sheet.useGlobalMapping}
                        title={sheet.useGlobalMapping ? "请先取消使用全局映射" : "配置表头映射"}
                      >
                        <Settings className="w-4 h-4" />
                        <span>独立映射</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {sheet.isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>已选择</span>
                    {!multiSheetConfig.useGlobalMapping && !sheet.useGlobalMapping && (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                        使用独立映射
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 统计信息 */}
        <div className="card p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                已选择 {selectedCount} / {totalCount} 个工作表
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                总计数据条数: {multiSheetConfig.sheets
                  .filter(sheet => sheet.isSelected)
                  .reduce((sum, sheet) => sum + sheet.questionCount, 0)} 条
              </p>
            </div>
          </div>
        </div>
        
        {/* 配置状态Banner */}
        {(() => {
          if (selectedCount === 0) {
            return (
              <StatusBanner
                type="info"
                title="请选择工作表"
                description="请至少选择一个工作表以继续配置"
              />
            );
          }

          if (!configValidity.isValid) {
            return (
              <StatusBanner
                type="error"
                title="配置有误"
                description={configValidity.message}
              />
            );
          }

          return (
            <StatusBanner
              type="success"
              title="配置有效"
              description={multiSheetConfig.useGlobalMapping ? '使用全局映射' : '使用独立映射'}
            />
          );
        })()}
      </div>

      {/* 表头映射配置模态框 */}
      {selectedSheetForMapping && (
        <SheetMappingModal
          sheet={selectedSheetForMapping}
          headers={sheetHeaders}
          onClose={() => setSelectedSheetForMapping(null)}
          onSave={handleSaveSheetMapping}
        />
      )}
    </div>
  );
}; 