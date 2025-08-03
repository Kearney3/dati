import { useEffect } from 'react';
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

export const HeaderMapping = ({ 
  headers, 
  mapping, 
  onMappingChange,
  sheetName,
  onMappingStatusChange
}: HeaderMappingProps) => {
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
      const missingLabels = missingFields.map(field => MAPPING_CONFIG[field as keyof typeof MAPPING_CONFIG].label);
      return {
        status: 'error',
        message: '映射不完整',
        description: `缺少必填字段：${missingLabels.join('、')}`,
        color: 'danger',
        sheetName: sheetName,
        missingFields: missingFields
      };
    }

    return {
      status: 'success',
      message: '映射有效',
      description: '所有必填字段已正确映射',
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          表头映射
          {sheetName && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({sheetName})
            </span>
          )}
        </h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        将Excel列名与题目属性进行对应
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(MAPPING_CONFIG).map(([key, config]) => (
          <div key={key} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {config.label}
              {config.required && <span className="text-danger-500 ml-1">*</span>}
            </label>
            <select
              value={mapping[key as keyof HeaderMappingType] || ''}
              onChange={(e) => handleChange(key as keyof HeaderMappingType, e.target.value)}
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
      
      {/* 映射状态显示 */}
      <StatusBanner
        type={mappingStatus.status as 'success' | 'warning' | 'error' | 'info'}
        title={mappingStatus.message}
        description={mappingStatus.description}
      />
    </div>
  );
}; 