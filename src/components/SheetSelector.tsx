import { useState, useEffect } from 'react';
import { Check, Settings, X, Globe, FileText } from 'lucide-react';
import { MultiSheetConfig, SheetConfig, HeaderMapping } from '../types';
import { StatusBanner } from './StatusBanner';
import { getSheetData } from '../utils/excel';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();

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
    question: { label: t('mapping.labels.question'), required: true },
    type: { label: t('mapping.labels.type'), required: true },
    answer: { label: t('mapping.labels.answer'), required: true },
    optionA: { label: t('mapping.labels.optionA'), required: false },
    optionB: { label: t('mapping.labels.optionB'), required: false },
    optionC: { label: t('mapping.labels.optionC'), required: false },
    optionD: { label: t('mapping.labels.optionD'), required: false },
    optionE: { label: t('mapping.labels.optionE'), required: false },
    optionF: { label: t('mapping.labels.optionF'), required: false },
    explanation: { label: t('mapping.labels.explanation'), required: false },
  } as const;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('sheetselector.config_mapping_title', { sheetName: sheet.sheetName })}
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
            {t('sheetselector.config_mapping_description', { sheetName: sheet.sheetName })}
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  <option value="">{t('mapping.select_placeholder')}</option>
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
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              {t('common.save', { defaultValue: '保存' })}
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
  const { t } = useTranslation();

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
    
    // 当开启统一表头映射时，将所有选中的工作表切换至使用全局映射
    const newSheets = multiSheetConfig.sheets.map(sheet => ({
      ...sheet,
      useGlobalMapping: newUseGlobalMapping && sheet.isSelected ? true : sheet.useGlobalMapping
    }));
    
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      useGlobalMapping: newUseGlobalMapping,
      sheets: newSheets
    });
  };

  const handleSheetToggle = (sheetName: string) => {
    const updatedSheets = multiSheetConfig.sheets.map(sheet => 
      sheet.sheetName === sheetName 
        ? { ...sheet, isSelected: !sheet.isSelected }
        : sheet
    );
    
    onMultiSheetConfigChange({
      ...multiSheetConfig,
      sheets: updatedSheets
    });
    
    // 检查是否需要更新统一全局映射状态
    const selectedSheets = updatedSheets.filter(sheet => sheet.isSelected);
    if (selectedSheets.length === 0) {
      // 当没有选中工作表时，保持统一全局映射状态不变
      return;
    }
    
    // 当开启统一全局映射时，将新选中的工作表切换至使用全局映射
    if (multiSheetConfig.useGlobalMapping) {
      const finalUpdatedSheets = updatedSheets.map(sheet => 
        sheet.sheetName === sheetName && sheet.isSelected
          ? { ...sheet, useGlobalMapping: true }
          : sheet
      );
      
      onMultiSheetConfigChange({
        ...multiSheetConfig,
        sheets: finalUpdatedSheets
      });
    }
  };

  const handleSheetUseGlobalMapping = (sheetName: string) => {
    const newSheets = multiSheetConfig.sheets.map(sheet => 
      sheet.sheetName === sheetName 
        ? { ...sheet, useGlobalMapping: !sheet.useGlobalMapping }
        : sheet
    );
    
    // 检查是否需要更新统一全局映射状态
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
      return { isValid: false, message: t('sheetselector.select_sheet_warning_title'), description: t('sheetselector.select_sheet_warning_desc') };
    }

    const requiredFields = ['question', 'type', 'answer'];
    
    // 检查全局映射配置
    const globalMappingMissingFields = requiredFields.filter(field => !multiSheetConfig.globalMapping[field as keyof HeaderMapping]);
    const isGlobalMappingIncomplete = globalMappingMissingFields.length > 0;
    
    // 检查独立映射配置
    const sheetsWithIndependentMapping = selectedSheets.filter(sheet => !sheet.useGlobalMapping);
    const invalidIndependentSheets = sheetsWithIndependentMapping.filter(sheet => 
      requiredFields.some(field => !sheet.mapping[field as keyof HeaderMapping])
    );
    
    // 检查使用全局映射的工作表
    const sheetsWithGlobalMapping = selectedSheets.filter(sheet => sheet.useGlobalMapping);
    const hasGlobalMappingSheets = sheetsWithGlobalMapping.length > 0;
    
    // 构建详细的错误信息
    let errorMessage = '';
    let errorDescription = '';
    
    // 检查独立映射错误
    if (invalidIndependentSheets.length > 0) {
      errorMessage = t('sheetselector.independent_mapping_incomplete_title');
      errorDescription = t('sheetselector.independent_mapping_incomplete_desc', { sheets: invalidIndependentSheets.map(s => s.sheetName).join('、') });
    }
    
    // 检查全局映射错误（只有当有工作表使用全局映射时才检查）
    if (isGlobalMappingIncomplete && hasGlobalMappingSheets) {
      const missingLabels = globalMappingMissingFields.map(field => {
        const fieldLabels = { question: t('mapping.labels.question'), type: t('mapping.labels.type'), answer: t('mapping.labels.answer') };
        return fieldLabels[field as keyof typeof fieldLabels];
      });
      
      if (errorMessage) {
        // 如果已经有独立映射错误，则合并显示
        errorMessage = t('sheetselector.mapping_incomplete_title');
        errorDescription = `${errorDescription}；${t('sheetselector.global_mapping_missing_desc', { fields: missingLabels.join('、') })}`;
      } else {
        // 只有全局映射错误
        errorMessage = t('sheetselector.global_mapping_incomplete_title');
        errorDescription = t('sheetselector.global_mapping_missing_desc', { fields: missingLabels.join('、') });
      }
    }
    
    if (errorMessage) {
      return { isValid: false, message: errorMessage, description: errorDescription };
    }

    return { isValid: true, message: t('sheetselector.config_valid_title'), description: t('sheetselector.config_valid_desc') };
  };

  const configValidity = checkConfigurationValidity();

  // 检查是否需要更新统一全局映射状态
  useEffect(() => {
    const selectedSheets = multiSheetConfig.sheets.filter(sheet => sheet.isSelected);
    
    if (selectedSheets.length === 0) {
      // 当没有选中工作表时，保持统一全局映射状态不变
      return;
    }
    
    // 当开启统一全局映射时，只对新选中的工作表启用全局映射
    if (multiSheetConfig.useGlobalMapping) {
      const updatedSheets = multiSheetConfig.sheets.map(sheet => 
        sheet.isSelected && !sheet.useGlobalMapping
          ? { ...sheet, useGlobalMapping: true }
          : sheet
      );
      
      // 只有当有工作表状态发生变化时才更新
      const hasChanges = updatedSheets.some((sheet, index) => 
        sheet.useGlobalMapping !== multiSheetConfig.sheets[index].useGlobalMapping
      );
      
      if (hasChanges) {
        onMultiSheetConfigChange({
          ...multiSheetConfig,
          sheets: updatedSheets
        });
      }
    }
  }, [multiSheetConfig.useGlobalMapping, multiSheetConfig.sheets, onMultiSheetConfigChange]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('sheetselector.title')}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAll}
            className="btn btn-secondary text-xs px-3 py-1"
          >
            {t('sheetselector.select_all')}
          </button>
          <button
            onClick={handleDeselectAll}
            className="btn btn-secondary text-xs px-3 py-1"
          >
            {t('sheetselector.deselect_all')}
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
                {t('sheetselector.global_mapping_toggle_label')}
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
            {t('sheetselector.global_mapping_toggle_description')}
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                      {t('sheetselector.data_count', { count: sheet.questionCount })}
                    </span>
                  </div>
                </div>

                <div className="flex flex-row items-center gap-2">
                  {sheet.isSelected && (
                    <>
                      {/* 使用全局映射按钮 */}
                      <button
                        onClick={() => handleSheetUseGlobalMapping(sheet.sheetName)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                          sheet.useGlobalMapping
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                        } ${multiSheetConfig.useGlobalMapping && !sheet.useGlobalMapping ? 'cursor-not-allowed opacity-50' : ''}`}
                        disabled={multiSheetConfig.useGlobalMapping && !sheet.useGlobalMapping}
                        title={multiSheetConfig.useGlobalMapping && !sheet.useGlobalMapping ? t('sheetselector.global_mapping_disabled_tip') : t('sheetselector.toggle_global_mapping_tip')}
                      >
                        <Globe className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('sheetselector.use_global_mapping')}</span>
                        <span className="sm:hidden">{t('sheetselector.global_mapping_short')}</span>
                      </button>
                      
                      {/* 独立映射按钮 */}
                      <button
                        onClick={() => handleOpenMappingModal(sheet)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                          !sheet.useGlobalMapping
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 border border-gray-200 dark:border-gray-600 cursor-not-allowed'
                        }`}
                        disabled={sheet.useGlobalMapping}
                        title={sheet.useGlobalMapping ? t('sheetselector.independent_mapping_disabled_tip') : t('sheetselector.config_independent_mapping_tip')}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('sheetselector.independent_mapping_config')}</span>
                        <span className="sm:hidden">{t('sheetselector.independent_mapping_short')}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {sheet.isSelected && (
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>{t('sheetselector.selected_status')}</span>
                    {sheet.useGlobalMapping ? (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {t('sheetselector.use_global_mapping_status')}
                      </span>
                    ) : (
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                        {t('sheetselector.use_independent_mapping_status')}
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
                {t('sheetselector.sheets_summary', { selectedCount: selectedCount, totalCount: totalCount })}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('sheetselector.total_data_count', { count: multiSheetConfig.sheets
                  .filter(sheet => sheet.isSelected)
                  .reduce((sum, sheet) => sum + sheet.questionCount, 0) })}
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
                title={t('sheetselector.select_sheet_warning_title')}
                description={t('sheetselector.select_sheet_warning_desc')}
              />
            );
          }

          if (!configValidity.isValid) {
            return (
              <StatusBanner
                type="error"
                title={configValidity.message}
                description={configValidity.description}
              />
            );
          }

          return (
            <StatusBanner
              type="success"
              title={t('sheetselector.config_valid_title')}
              description={configValidity.description}
            />
          );
        })()}
      </div>

      {/* 全局映射配置模态框 */}
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