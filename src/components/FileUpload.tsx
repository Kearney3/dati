import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { parseExcelFile } from '../utils/excel';

interface FileUploadProps {
  onFileLoaded: (workbook: any) => void;
}

export const FileUpload = ({ onFileLoaded }: FileUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('请选择Excel文件 (.xlsx 或 .xls)');
      return;
    }

    try {
      setError('');
      setFileName(file.name);
      const workbook = await parseExcelFile(file);
      onFileLoaded(workbook);
    } catch (err) {
      setError('文件解析失败，请确保文件格式正确');
      console.error('File parsing error:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto min-w-[350px]">
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30">
              <Upload className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              上传Excel题库文件
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              点击或拖拽Excel文件到这里
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              支持 .xlsx 和 .xls 格式
            </p>
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center justify-center gap-2 text-sm text-green-700 dark:text-green-300">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>🔒 隐私保护：文件仅在本机处理，不会上传到服务器</span>
              </div>
            </div>
          </div>

          {fileName && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4" />
              <span>{fileName}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center space-x-2 text-sm text-danger-600 dark:text-danger-400">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 