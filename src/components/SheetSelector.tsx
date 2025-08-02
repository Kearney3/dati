import { MultiSheetConfig, SheetConfig, HeaderMapping } from '../types';
import { Check, Settings, Globe, FileText, X } from 'lucide-react';
import { useState } from 'react';
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
  workbook
}: SheetSelectorProps) => {
  const [selectedSheetForMapping, setSelectedSheetForMapping] = useState<SheetConfig | null>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);

  const handleSelectAll = () => {
    const newSheets = multiSheetConfig.sheets.map(sheet => ({
      ...sheet,
      isSelected: true
    }));
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      sheets: newSheets
    });
  };

  const handleDeselectAll = () => {
    const newSheets = multiSheetConfig.sheets.map(sheet => ({
      ...sheet,
      isSelected: false
    }));
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      sheets: newSheets
    });
  };

  const handleToggleGlobalMapping = () => {
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      useGlobalMapping: !multiSheetConfig.useGlobalMapping
    });
  };

  const handleSheetToggle = (sheetName: string) => {
    const newSheets = multiSheetConfig.sheets.map(sheet => 
      sheet.sheetName === sheetName 
        ? { ...sheet, isSelected: !sheet.isSelected }
        : sheet
    );
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      sheets: newSheets
    });
  };

  const handleSheetUseGlobalMapping = (sheetName: string) => {
    const newSheets = multiSheetConfig.sheets.map(sheet => 
      sheet.sheetName === sheetName 
        ? { ...sheet, useGlobalMapping: !sheet.useGlobalMapping }
        : sheet
    );
    onMultiSheetConfigChange({
      ...multiSheetConfig,
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
                    <div className="w-5 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded peer dark:bg-gray-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded after:h-3 after:w-3 after:transition-all dark:border-gray-600"></div>
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {sheet.sheetName}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({sheet.questionCount} 题)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {sheet.isSelected && (
                    <>
                      {!multiSheetConfig.useGlobalMapping && (
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sheet.useGlobalMapping}
                            onChange={() => handleSheetUseGlobalMapping(sheet.sheetName)}
                            className="sr-only peer"
                          />
                          <div className="w-4 h-4 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded peer dark:bg-gray-700 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded after:h-2 after:w-2 after:transition-all dark:border-gray-600"></div>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            使用全局映射
                          </span>
                        </label>
                      )}
                      
                      <button
                        onClick={() => handleOpenMappingModal(sheet)}
                        className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        title="配置表头映射"
                      >
                        <Settings className="w-4 h-4" />
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
                总计题目数: {multiSheetConfig.sheets
                  .filter(sheet => sheet.isSelected)
                  .reduce((sum, sheet) => sum + sheet.questionCount, 0)} 题
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              selectedCount > 0 
                ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {selectedCount > 0 ? '配置有效' : '请选择工作表'}
            </div>
          </div>
        </div>
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