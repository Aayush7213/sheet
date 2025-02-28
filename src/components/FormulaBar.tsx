import React from 'react';
import { useSheetStore } from '../store/sheetStore';
import { FunctionSquare as Function } from 'lucide-react';

export const FormulaBar: React.FC = () => {
  const { selectedCell, cells, updateCell } = useSheetStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCell) return;
    const newValue = e.target.value;
    updateCell(selectedCell, {
      formula: newValue,
      value: newValue.startsWith('=') ? '' : newValue
    });
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-300 bg-white shadow-sm">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-md border border-gray-200">
        <Function size={16} className="text-gray-500" />
        <div className="font-mono text-sm text-gray-700">
          {selectedCell || ''}
        </div>
      </div>
      <input
        type="text"
        value={selectedCell ? (cells[selectedCell]?.formula || cells[selectedCell]?.value || '') : ''}
        onChange={handleChange}
        placeholder="Enter a value or formula (e.g., =SUM(A1:A5))"
        className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        disabled={!selectedCell}
      />
    </div>
  );
};