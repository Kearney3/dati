import * as XLSX from 'xlsx';
import { Question, HeaderMapping, SheetConfig } from '../types';

export const parseExcelFile = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

export const getSheetData = (workbook: any, sheetName: string) => {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: "" });
  const aoa = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
  const headers = (aoa[0] as string[]) || [];
  
  return { jsonData, headers };
};

// 新增：获取所有工作表的数据
export const getAllSheetsData = (workbook: any) => {
  const sheetsData: { [sheetName: string]: { jsonData: any[], headers: string[] } } = {};
  
  workbook.SheetNames.forEach((sheetName: string) => {
    sheetsData[sheetName] = getSheetData(workbook, sheetName);
  });
  
  return sheetsData;
};

// 新增：处理多个工作表的数据
export const processMultiSheetQuestions = (
  workbook: any, 
  selectedSheets: SheetConfig[], 
  globalMapping: Partial<HeaderMapping>
): Question[] => {
  let allQuestions: Question[] = [];
  let questionId = 0;
  
  selectedSheets.forEach(sheet => {
    const { jsonData } = getSheetData(workbook, sheet.sheetName);
    const sheetMapping = sheet.useGlobalMapping 
      ? globalMapping 
      : sheet.mapping;
    
    const processedQuestions = processQuestions(jsonData, sheetMapping as HeaderMapping);
    
    // 为每个工作表的题目分配唯一ID
    const questionsWithIds = processedQuestions.map(q => ({
      ...q,
      id: questionId++
    }));
    
    allQuestions = [...allQuestions, ...questionsWithIds];
  });
  
  return allQuestions;
};

export const processQuestions = (data: any[], mapping: HeaderMapping): Question[] => {
  return data
    .map((row, index) => {
      const question: Question = {
        id: index,
        text: row[mapping.question]?.toString() || '',
        type: normalizeQuestionType(row[mapping.type]?.toString().trim() || ''),
        answer: row[mapping.answer]?.toString().trim() || '',
        options: [],
        explanation: mapping.explanation ? row[mapping.explanation]?.toString() || '' : ''
      };

      // Process options
      ['optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF'].forEach(optKey => {
        const mappingKey = mapping[optKey as keyof HeaderMapping];
        if (mappingKey && row[mappingKey]) {
          question.options.push(row[mappingKey].toString());
        }
      });

      return question;
    })
    .filter(q => q.text && q.type && q.answer);
};

export const normalizeQuestionType = (type: string): Question['type'] => {
  if (!type) return '单选题';
  
  const normalizedType = type.trim().toLowerCase();
  
  // 单选题匹配模式
  if (normalizedType.includes('单选') || 
      normalizedType.includes('单选题') || 
      normalizedType.includes('single') ||
      normalizedType.includes('选择') ||
      normalizedType.includes('单项选择题') ||
      normalizedType.includes('选择题')) {
    return '单选题';
  }
  
  // 多选题匹配模式
  if (normalizedType.includes('多选') || 
      normalizedType.includes('多选题') || 
      normalizedType.includes('multiple') ||
      normalizedType.includes('多项选择') ||
      normalizedType.includes('多项')) {
    return '多选题';
  }
  
  // 判断题匹配模式
  if (normalizedType.includes('判断') || 
      normalizedType.includes('判断题') || 
      normalizedType.includes('judge') ||
      normalizedType.includes('对错') ||
      normalizedType.includes('是非')) {
    return '判断题';
  }
  
  // 填空题匹配模式
  if (normalizedType.includes('填空') || 
      normalizedType.includes('填空题') || 
      normalizedType.includes('fill') ||
      normalizedType.includes('填写') ||
      normalizedType.includes('补充') ||
      normalizedType.includes('完成') ) {
    return '填空题';
  }
  
  // 默认返回单选题
  return '单选题';
};

export const autoMapHeaders = (headers: string[]): Partial<HeaderMapping> => {
  const mapping: Partial<HeaderMapping> = {};
  
  headers.forEach(header => {
    const headerLower = header.toLowerCase();
    if (headerLower.includes('题干') || headerLower.includes('题目')) {
      mapping.question = header;
    } else if (headerLower.includes('题型') || headerLower.includes('类型')) {
      mapping.type = header;
    } else if (headerLower.includes('答案')) {
      mapping.answer = header;
    } else if (headerLower.includes('解析') || headerLower.includes('解释')) {
      mapping.explanation = header;
    } else if (headerLower.includes('选项a') || headerLower.includes('a选项')) {
      mapping.optionA = header;
    } else if (headerLower.includes('选项b') || headerLower.includes('b选项')) {
      mapping.optionB = header;
    } else if (headerLower.includes('选项c') || headerLower.includes('c选项')) {
      mapping.optionC = header;
    } else if (headerLower.includes('选项d') || headerLower.includes('d选项')) {
      mapping.optionD = header;
    } else if (headerLower.includes('选项e') || headerLower.includes('e选项')) {
      mapping.optionE = header;
    } else if (headerLower.includes('选项f') || headerLower.includes('f选项')) {
      mapping.optionF = header;
    }
  });
  
  return mapping;
}; 