import React, { useState, useEffect, useRef } from 'react';
import { useSheetStore } from '../store/sheetStore';
import { evaluateFormula } from '../utils/functions';
import clsx from 'clsx';

interface CellProps {
  id: string;
}

export const Cell: React.FC<CellProps> = ({ id }) => {
  const { 
    cells, 
    selectedCell, 
    selectedCells, 
    updateCell, 
    setSelectedCell, 
    setSelectedCells,
    startDrag,
    endDrag,
    handleDrag,
    copySelectedCells,
    pasteCells
  } = useSheetStore();
  
  const [editing, setEditing] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);
  
  const cell = cells[id] || { 
    value: '', 
    formula: '', 
    style: { 
      bold: false, 
      italic: false, 
      fontSize: 14, 
      color: '#000000' 
    } 
  };

  const getCellValue = (ref: string) => cells[ref]?.value || '';

  // Calculate dynamic cell height based on font size
  const calculateCellHeight = () => {
    const baseFontSize = 14; // Default font size
    const baseHeight = 30; // Default height
    const scaleFactor = 1.5; // How much to scale per font size unit
    
    const fontSizeDiff = cell.style.fontSize - baseFontSize;
    const additionalHeight = fontSizeDiff * scaleFactor;
    
    return Math.max(baseHeight, baseHeight + additionalHeight);
  };

  // Calculate dynamic cell width based on font size
  const calculateCellWidth = () => {
    const baseFontSize = 14; // Default font size
    const baseWidth = 120; // Default width
    const scaleFactor = 3; // How much to scale per font size unit
    
    const fontSizeDiff = cell.style.fontSize - baseFontSize;
    const additionalWidth = fontSizeDiff * scaleFactor;
    
    return Math.max(baseWidth, baseWidth + additionalWidth);
  };

  const cellHeight = calculateCellHeight();
  const cellWidth = calculateCellWidth();

  useEffect(() => {
    if (cell.formula) {
      const value = evaluateFormula(cell.formula, getCellValue);
      if (value !== cell.value) {
        updateCell(id, { value });
      }
    }
  }, [cell.formula, cells, id, updateCell]);

  // Add keyboard event listener for copy/paste
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if this cell is selected
      if (!selectedCells.includes(id)) return;
      
      // Copy: Ctrl+C or Cmd+C
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        copySelectedCells();
        e.preventDefault();
      }
      
      // Paste: Ctrl+V or Cmd+V
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && selectedCell) {
        pasteCells(selectedCell);
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [id, selectedCell, selectedCells, copySelectedCells, pasteCells]);

  const handleDoubleClick = () => {
    setEditing(true);
  };

  const handleBlur = () => {
    setEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    updateCell(id, {
      value: newValue,
      formula: newValue.startsWith('=') ? newValue : ''
    });
  };

  // Context menu for copy/paste
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If right-clicking on a non-selected cell, select it first
    if (!selectedCells.includes(id)) {
      setSelectedCell(id);
      setSelectedCells([id]);
    }
    
    // In a real implementation, you would show a custom context menu here
    // For simplicity, we'll use the browser's built-in prompt
    const action = window.prompt('Choose an action: copy, paste');
    
    if (action === 'copy') {
      copySelectedCells();
    } else if (action === 'paste') {
      pasteCells(id);
    }
  };

  // Drag selection handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left mouse button
    
    // If shift key is pressed, extend the selection
    if (e.shiftKey && selectedCell) {
      const newSelection = getSelectionBetween(selectedCell, id);
      setSelectedCells(newSelection);
    } else {
      setSelectedCell(id);
      setSelectedCells([id]);
      startDrag(id);
    }
  };

  const handleMouseEnter = () => {
    handleDrag(id);
  };

  const handleMouseUp = () => {
    endDrag();
  };

  // Helper function to get all cells between two cells
  const getSelectionBetween = (start: string, end: string): string[] => {
    // Extract column letters and row numbers
    const startCol = start.match(/[A-Z]+/)?.[0] || '';
    const startRow = parseInt(start.match(/\d+/)?.[0] || '0');
    const endCol = end.match(/[A-Z]+/)?.[0] || '';
    const endRow = parseInt(end.match(/\d+/)?.[0] || '0');
    
    // Convert column letters to indices
    const startColIndex = columnLetterToIndex(startCol);
    const endColIndex = columnLetterToIndex(endCol);
    
    // Determine the range
    const minCol = Math.min(startColIndex, endColIndex);
    const maxCol = Math.max(startColIndex, endColIndex);
    const minRow = Math.min(startRow, endRow);
    const maxRow = Math.max(startRow, endRow);
    
    // Generate all cell IDs in the range
    const selection: string[] = [];
    for (let row = minRow; row <= maxRow; row++) {
      for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
        const colLetter = indexToColumnLetter(colIdx);
        selection.push(`${colLetter}${row}`);
      }
    }
    
    return selection;
  };

  // Helper function to convert column letter to index (A=0, B=1, ...)
  const columnLetterToIndex = (col: string): number => {
    let result = 0;
    for (let i = 0; i < col.length; i++) {
      result = result * 26 + (col.charCodeAt(i) - 64);
    }
    return result - 1;
  };

  // Helper function to convert index to column letter
  const indexToColumnLetter = (index: number): string => {
    let letter = '';
    index++;
    while (index > 0) {
      const remainder = (index - 1) % 26;
      letter = String.fromCharCode(65 + remainder) + letter;
      index = Math.floor((index - 1) / 26);
    }
    return letter;
  };

  return (
    <div
      ref={cellRef}
      className={clsx(
        'border-r border-b border-gray-300',
        'transition-all duration-100',
        selectedCells.includes(id) && 'ring-2 ring-blue-500 ring-inset z-10 bg-blue-50/30',
        !editing && 'hover:bg-gray-50',
        cell.formula && 'font-mono text-emerald-700'
      )}
      style={{
        fontWeight: cell.style.bold ? 'bold' : 'normal',
        fontStyle: cell.style.italic ? 'italic' : 'normal',
        fontSize: `${cell.style.fontSize}px`,
        color: cell.style.color,
        minWidth: `${cellWidth}px`,
        height: `${cellHeight}px`,
        display: 'flex',
        alignItems: 'center'
      }}
      onClick={() => setSelectedCell(id)}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={handleMouseEnter}
      onMouseUp={handleMouseUp}
      onContextMenu={handleContextMenu}
    >
      {editing ? (
        <input
          type="text"
          value={cell.formula || cell.value}
          onChange={handleChange}
          onBlur={handleBlur}
          className="w-full h-full outline-none px-2 bg-white"
          style={{ fontSize: `${cell.style.fontSize}px` }}
          autoFocus
        />
      ) : (
        <div className="px-2 truncate w-full">
          {cell.value}
        </div>
      )}
    </div>
  );
};