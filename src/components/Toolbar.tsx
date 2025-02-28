import React from 'react';
import { Bold, Italic, Plus, Minus, Type, AlignLeft, AlignCenter, AlignRight, Download, Upload, Trash2, Copy, Clipboard, Undo, Redo } from 'lucide-react';
import { useSheetStore } from '../store/sheetStore';
import clsx from 'clsx';

export const Toolbar: React.FC = () => {
  const { 
    selectedCell, 
    cells, 
    updateCell, 
    addRow, 
    deleteRow, 
    addColumn, 
    deleteColumn, 
    exportToCSV, 
    importFromCSV,
    clearSpreadsheet,
    copySelectedCells,
    pasteCells,
    undo,
    redo
  } = useSheetStore();

  const toggleStyle = (style: 'bold' | 'italic') => {
    if (!selectedCell) return;
    const cell = cells[selectedCell];
    updateCell(selectedCell, {
      style: {
        ...cell?.style,
        [style]: !cell?.style[style]
      }
    });
  };

  const updateFontSize = (size: number) => {
    if (!selectedCell) return;
    const cell = cells[selectedCell];
    updateCell(selectedCell, {
      style: {
        ...cell?.style,
        fontSize: size
      }
    });
  };

  const updateTextColor = (color: string) => {
    if (!selectedCell) return;
    const cell = cells[selectedCell];
    updateCell(selectedCell, {
      style: {
        ...cell?.style,
        color: color
      }
    });
  };

  const handleCopy = () => {
    copySelectedCells();
  };

  const handlePaste = () => {
    if (selectedCell) {
      pasteCells(selectedCell);
    }
  };

  interface ToolbarButtonProps {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title?: string; // Added title prop to fix TypeScript error
  }

  const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, active = false, children, title }) => (
    <button
      onClick={onClick}
      className={clsx(
        'p-2 rounded-md transition-colors',
        active ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-600'
      )}
      title={title}
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => <div className="w-px h-6 bg-gray-300 mx-2" />;

  const handleImportClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        importFromCSV(target.files[0]);
      }
    };
    input.click();
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-300 bg-white shadow-sm">
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={() => undo()} title="Undo">
          <Undo size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => redo()} title="Redo">
          <Redo size={18} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={() => toggleStyle('bold')} active={selectedCell ? cells[selectedCell]?.style.bold : false} title="Bold">
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => toggleStyle('italic')} active={selectedCell ? cells[selectedCell]?.style.italic : false} title="Italic">
          <Italic size={18} />
        </ToolbarButton>
        <div className="flex items-center gap-2 px-2">
          <Type size={18} className="text-gray-600" />
          <input
            type="number"
            min="8"
            max="72"
            value={selectedCell ? cells[selectedCell]?.style.fontSize || 14 : 14}
            onChange={(e) => updateFontSize(Number(e.target.value))}
            className="w-16 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            title="Font Size"
          />
        </div>
        <input
          type="color"
          value={selectedCell ? cells[selectedCell]?.style.color || '#000000' : '#000000'}
          onChange={(e) => updateTextColor(e.target.value)}
          className="w-10 h-8 cursor-pointer"
          title="Text Color"
        />
      </div>

      <ToolbarDivider />

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={() => {}} title="Align Left">
          <AlignLeft size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => {}} title="Align Center">
          <AlignCenter size={18} />
        </ToolbarButton>
        <ToolbarButton onClick={() => {}} title="Align Right">
          <AlignRight size={18} />
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={addRow} title="Add Row">
          <div className="flex items-center gap-1">
            <Plus size={18} /> Row
          </div>
        </ToolbarButton>
        <ToolbarButton onClick={deleteRow} title="Delete Row">
          <div className="flex items-center gap-1">
            <Minus size={18} /> Row
          </div>
        </ToolbarButton>
        <ToolbarButton onClick={addColumn} title="Add Column">
          <div className="flex items-center gap-1">
            <Plus size={18} /> Col
          </div>
        </ToolbarButton>
        <ToolbarButton onClick={deleteColumn} title="Delete Column">
          <div className="flex items-center gap-1">
            <Minus size={18} /> Col
          </div>
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="flex items-center gap-1">
      <ToolbarButton onClick={handleCopy} title="Copy">
          <div className="flex items-center gap-1">
            <Copy size={18} /> Copy
          </div>
        </ToolbarButton>
        <ToolbarButton onClick={handlePaste} title="Paste">
          <div className="flex items-center gap-1">
            <Clipboard size={18} /> Paste
          </div>
        </ToolbarButton>
      </div>

      <ToolbarDivider />

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={exportToCSV} title="Export to CSV">
          <div className="flex items-center gap-1">
            <Download size={18} /> Export
          </div>
        </ToolbarButton>
        <ToolbarButton onClick={handleImportClick} title="Import from CSV">
          <div className="flex items-center gap-1">
            <Upload size={18} /> Import
          </div>
        </ToolbarButton>

        <ToolbarButton onClick={clearSpreadsheet} title="Clear Spreadsheet">
          <div className="flex items-center gap-1">
          <Trash2 size={18} /> Clear
          </div>
        </ToolbarButton>
      </div>
    </div>
  );
};