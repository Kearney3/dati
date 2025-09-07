import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderMapping as HeaderMappingType } from '../types';
import { StatusBanner } from './StatusBanner';

interface HeaderMappingProps {
  headers: string[];
  mapping: Partial<HeaderMappingType>;
  onMappingChange: (mapping: Partial<HeaderMappingType>) => void;
  sheetName?: string;
  onMappingStatusChange?: (status: any) => void; // 新增：回调函数，用于向父组件传递映射状态
}

const MAPPING_CONFIG = {
  question: { key: 'mapping.labels.question', required: true },
  type: { key: 'mapping.labels.type', required: true },
  answer: { key: 'mapping.labels.answer', required: true },
  optionA: { key: 'mapping.labels.optionA', required: false },
  optionB: { key: 'mapping.labels.optionB', required: false },
  optionC: { key: 'mapping.labels.optionC', required: false },
  optionD: { key: 'mapping.labels.optionD', required: false },
  optionE: { key: 'mapping.labels.optionE', required: false },
  optionF: { key: 'mapping.labels.optionF', required: false },
  explanation: { key: 'mapping.labels.explanation', required: false },
} as const;

export const HeaderMapping = ({ 
  headers, 
  mapping, 
  onMappingChange,
  sheetName,
  onMappingStatusChange
}: HeaderMappingProps) => {
  const { t } = useTranslation();
  const handleChange = (key: keyof HeaderMappingType, value: string) => {
    onMappingChange({ ...mapping, [key]: value });
  };

  // 验证表头映射配置的有效性
  const getMappingStatus = () => {
    // 检查必填字段是否已映射
    const requiredFields = Object.entries(MAPPING_CONFIG)
      .filter(([_, config]) => config.required)
      .map(([key]) => key);

    const missingFields = requiredFields.filter(field => !mapping[field as keyof HeaderMappingType]);

    if (missingFields.length > 0) {
      const missingLabels = missingFields.map(field => t(MAPPING_CONFIG[field as keyof typeof MAPPING_CONFIG].key as any));
      return {
        status: 'error',
        message: t('mapping.status_missing'),
        description: t('mapping.status_missing_desc', { fields: missingLabels.join('、') }),
        color: 'danger',
        sheetName: sheetName,
        missingFields: missingFields
      };
    }

    return {
      status: 'success',
      message: t('mapping.status_ok'),
      description: t('mapping.status_ok_desc'),
      color: 'success',
      sheetName: sheetName
    };
  };

  const mappingStatus = getMappingStatus();

  // 使用useEffect来处理状态回调，避免无限循环
  useEffect(() => {
    onMappingStatusChange?.(mappingStatus);
  }, [mappingStatus, onMappingStatusChange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('mapping.title')}</h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">{t('mapping.helper')}</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Object.entries(MAPPING_CONFIG).map(([key, config]) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t(config.key as any)}
              {config.required && <span className="text-danger-500 ml-1">*</span>}
            </label>
            <select
              value={mapping[key as keyof HeaderMappingType] || ''}
              onChange={(e) => handleChange(key as keyof HeaderMappingType, e.target.value)}
              className="input"
            >
              <option value="">{t('mapping.select_placeholder')}</option>
              {headers.map((header, index) => (
                <option key={`${header}-${index}`} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      
      {/* 映射状态显示 */}
      <StatusBanner
        type={mappingStatus.status as 'success' | 'warning' | 'error' | 'info'}
        title={mappingStatus.message}
        description={mappingStatus.description}
      />
    </div>
  );
}; 