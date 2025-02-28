import { create } from 'zustand';
import { CellData, SheetState } from '../types/sheet';
import { evaluateFormula } from '../utils/functions';

const DEFAULT_ROWS = 100;
const DEFAULT_COLS = 26;
const MAX_HISTORY = 50; // Maximum number of history states to keep

const createEmptyCell = (): CellData => ({
  value: '',
  formula: '',
  style: {
    bold: false,
    italic: false,
    fontSize: 14,
    color: '#000000',
  },
});

export const useSheetStore = create<SheetState>((set, get) => ({
  cells: {},
  selectedCell: null,
  selectedCells: [],
  rows: DEFAULT_ROWS,
  cols: DEFAULT_COLS,
  isDragging: false,
  dragStart: null,
  dragStartCell: null,
  clipboard: null,
  history: [], // Store history of states
  historyIndex: -1, // Current position in history

  // History management
  saveState: () => {
    const state = get();
    const currentState = {
      cells: { ...state.cells },
      rows: state.rows,
      cols: state.cols
    };

    // If we're not at the end of history, truncate future states
    const newHistory = state.historyIndex < state.history.length - 1
      ? state.history.slice(0, state.historyIndex + 1)
      : [...state.history];

    // Add current state to history
    newHistory.push(currentState);

    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    set({
      history: newHistory,
      historyIndex: newHistory.length - 1
    });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex <= 0) return; // Nothing to undo

    const newIndex = state.historyIndex - 1;
    const previousState = state.history[newIndex];

    set({
      cells: { ...previousState.cells },
      rows: previousState.rows,
      cols: previousState.cols,
      historyIndex: newIndex
    });
  },

  redo: () => {
    const state = get();
    if (state.historyIndex >= state.history.length - 1) return; // Nothing to redo

    const newIndex = state.historyIndex + 1;
    const nextState = state.history[newIndex];

    set({
      cells: { ...nextState.cells },
      rows: nextState.rows,
      cols: nextState.cols,
      historyIndex: newIndex
    });
  },

  addRow: () => {
    get().saveState();
    set((state) => ({ rows: state.rows + 1 }));
  },
  
  deleteRow: () => {
    get().saveState();
    set((state) => ({ rows: Math.max(1, state.rows - 1) }));
  },
  
  addColumn: () => {
    get().saveState();
    set((state) => ({ cols: state.cols + 1 }));
  },
  
  deleteColumn: () => {
    get().saveState();
    set((state) => ({ cols: Math.max(1, state.cols - 1) }));
  },

  updateCell: (id, data) => {
    get().saveState();
    set((state) => ({
      cells: {
        ...state.cells,
        [id]: {
          ...state.cells[id] || createEmptyCell(),
          ...data,
        },
      },
    }));
  },

  setSelectedCell: (id) => set({ selectedCell: id }),

  setSelectedCells: (ids) =>
    set({
      selectedCells: Array.isArray(ids) ? ids : [ids]
    }),

  // Drag functionality
  startDrag: (cellId) => 
    set({
      isDragging: true,
      dragStart: cellId,
      dragStartCell: cellId,
      selectedCells: [cellId]
    }),

  handleDrag: (cellId) => {
    const state = get();
    if (!state.isDragging || !state.dragStart) return;

    // Get all cells between dragStart and current cell
    const selection = getSelectionBetween(state.dragStart, cellId);
    set({ selectedCells: selection });
  },

  endDrag: () => set({ isDragging: false }),

  // Original clipboard operations
  copySelectedCells: () => {
    const state = get();
    if (state.selectedCells.length === 0) return;
    
    const cellsToCopy: { [key: string]: CellData } = {};
    state.selectedCells.forEach(cellId => {
      if (state.cells[cellId]) {
        cellsToCopy[cellId] = { ...state.cells[cellId] };
      }
    });
    
    set({ clipboard: { 
      cells: cellsToCopy, 
      topLeft: getTopLeftCell(state.selectedCells),
      bottomRight: getBottomRightCell(state.selectedCells)
    }});
    
    // Also copy to system clipboard for external pasting
    const text = formatCellsForClipboard(cellsToCopy, state.selectedCells);
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  },
  
  pasteCells: (targetCellId) => {
    get().saveState();
    const state = get();
    if (!state.clipboard) return;
    
    const { cells: copiedCells, topLeft } = state.clipboard;
    
    // Calculate offset from original selection
    const targetColLetter = targetCellId.match(/[A-Z]+/)?.[0] || '';
    const targetRow = parseInt(targetCellId.match(/\d+/)?.[0] || '0');
    
    const sourceColLetter = topLeft.match(/[A-Z]+/)?.[0] || '';
    const sourceRow = parseInt(topLeft.match(/\d+/)?.[0] || '0');
    
    const colOffset = columnLetterToIndex(targetColLetter) - columnLetterToIndex(sourceColLetter);
    const rowOffset = targetRow - sourceRow;
    
    // Apply paste with offset
    const newCells = { ...state.cells };
    Object.entries(copiedCells).forEach(([cellId, cellData]) => {
      const colLetter = cellId.match(/[A-Z]+/)?.[0] || '';
      const row = parseInt(cellId.match(/\d+/)?.[0] || '0');
      
      const newColIndex = columnLetterToIndex(colLetter) + colOffset;
      const newRow = row + rowOffset;
      
      // Skip if out of bounds
      if (newColIndex < 0 || newColIndex >= state.cols || newRow <= 0 || newRow > state.rows) {
        return;
      }
      
      const newCellId = `${indexToColumnLetter(newColIndex)}${newRow}`;
      newCells[newCellId] = { ...cellData };
      
      // Update formulas if needed
      if (cellData.formula) {
        // This is a simplified approach - a more robust solution would parse and adjust cell references
        newCells[newCellId] = { 
          ...cellData,
          formula: cellData.formula // In a real implementation, adjust formula references
        };
      }
    });
    
    set({ cells: newCells });
  },

  // Enhanced clipboard operations
  copySelection: () => {
    const state = get();
    if (state.selectedCells.length === 0) return;

    const clipboardData = state.selectedCells.map(cellId => ({
      id: cellId,
      ...state.cells[cellId] || createEmptyCell()
    }));

    set({ clipboard: { 
      type: 'copy', 
      data: clipboardData,
      cells: state.selectedCells.reduce((acc, cellId) => {
        acc[cellId] = { ...state.cells[cellId] || createEmptyCell() };
        return acc;
      }, {} as Record<string, CellData>),
      topLeft: getTopLeftCell(state.selectedCells),
      bottomRight: getBottomRightCell(state.selectedCells)
    }});

    // Also copy to system clipboard
    const text = formatCellsForClipboard(
      state.selectedCells.reduce((acc, cellId) => {
        acc[cellId] = { ...state.cells[cellId] || createEmptyCell() };
        return acc;
      }, {} as Record<string, CellData>), 
      state.selectedCells
    );
    navigator.clipboard.writeText(text).catch(err => {
      console.error('Failed to copy to clipboard:', err);
    });
  },

  cutSelection: () => {
    get().saveState();
    const state = get();
    if (state.selectedCells.length === 0) return;

    const clipboardData = state.selectedCells.map(cellId => ({
      id: cellId,
      ...state.cells[cellId] || createEmptyCell()
    }));

    // Clear the cut cells
    const newCells = { ...state.cells };
    state.selectedCells.forEach(cellId => {
      newCells[cellId] = createEmptyCell();
    });

    set({ 
      clipboard: { 
        type: 'cut', 
        data: clipboardData,
        cells: state.selectedCells.reduce((acc, cellId) => {
          acc[cellId] = { ...state.cells[cellId] || createEmptyCell() };
          return acc;
        }, {} as Record<string, CellData>),
        topLeft: getTopLeftCell(state.selectedCells),
        bottomRight: getBottomRightCell(state.selectedCells)
      },
      cells: newCells
    });
  },

  pasteSelection: () => {
    get().saveState();
    const state = get();
    if (!state.clipboard || !state.selectedCell) return;

    // Handle both clipboard formats
    if ('data' in state.clipboard && state.clipboard.data) {
      const { data } = state.clipboard;
      if (data.length === 0) return;

      // If we're pasting a single cell to multiple cells
      if (data.length === 1 && state.selectedCells.length > 1) {
        const sourceCell = data[0];
        const newCells = { ...state.cells };
        
        state.selectedCells.forEach(cellId => {
          newCells[cellId] = {
            ...createEmptyCell(),
            value: sourceCell.value,
            formula: sourceCell.formula,
            style: { ...sourceCell.style }
          };
        });
        
        set({ cells: newCells });
        return;
      }

      // If we're pasting multiple cells
      // Calculate the dimensions of the copied area
      const cellIds = data.map(cell => cell.id);
      const { rowOffset, colOffset } = calculatePasteOffset(cellIds, state.selectedCell);
      
      const newCells = { ...state.cells };
      data.forEach(cell => {
        const { row, col } = parseCellId(cell.id);
        const newCellId = createCellId(row + rowOffset, col + colOffset);
        
        newCells[newCellId] = {
          ...createEmptyCell(),
          value: cell.value,
          formula: cell.formula,
          style: { ...cell.style }
        };
      });
      
      set({ cells: newCells });
    } else if ('cells' in state.clipboard && state.clipboard.cells) {
      // Use the original paste implementation
      get().pasteCells(state.selectedCell);
    }
  },

  // Import/Export functionality
  exportToCSV: () => {
    const state = get();
    let csvContent = '';
    
    // Determine the maximum row and column
    let maxRow = 0;
    let maxCol = 0;
    
    Object.keys(state.cells).forEach(id => {
      const colChar = id.match(/[A-Z]+/)?.[0] || '';
      const rowNum = parseInt(id.match(/\d+/)?.[0] || '0');
      
      const colNum = columnLetterToIndex(colChar);
      
      if (colNum > maxCol) maxCol = colNum;
      if (rowNum > maxRow) maxRow = rowNum;
    });
    
    // Generate CSV content
    for (let row = 1; row <= maxRow; row++) {
      const rowValues = [];
      
      for (let col = 0; col <= maxCol; col++) {
        const colLabel = indexToColumnLetter(col);
        const id = `${colLabel}${row}`;
        const cellValue = state.cells[id]?.value || '';
        
        // Escape quotes and wrap in quotes if needed
        const formattedValue = cellValue.includes(',') || cellValue.includes('"') 
          ? `"${cellValue.replace(/"/g, '""')}"` 
          : cellValue;
          
        rowValues.push(formattedValue);
      }
      
      csvContent += rowValues.join(',') + '\n';
    }
    
    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'spreadsheet.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  importFromCSV: (file: File) => {
    get().saveState();
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');
      
      const newCells: Record<string, CellData> = {};
      let maxRow = 0;
      let maxCol = 0;
      
      lines.forEach((line, rowIndex) => {
        if (!line.trim()) return;
        
        // Parse CSV, handling quoted values with commas
        const values: string[] = [];
        let currentValue = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          
          if (char === '"') {
            if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
              // Handle escaped quotes
              currentValue += '"';
              i++;
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
            }
          } else if (char === ',' && !inQuotes) {
            // End of value
            values.push(currentValue);
            currentValue = '';
          } else {
            currentValue += char;
          }
        }
        
        // Add the last value
        values.push(currentValue);
        
        // Update cells
        values.forEach((value, colIndex) => {
          const colLabel = indexToColumnLetter(colIndex);
          const id = `${colLabel}${rowIndex + 1}`;
          
          newCells[id] = { 
            value: value.startsWith('=') ? '' : value, // Initial value
            formula: value.startsWith('=') ? value : '', // Store as formula to be evaluated
            style: createEmptyCell().style
          };
          
          if (colIndex > maxCol) maxCol = colIndex;
        });
        
        if (rowIndex > maxRow) maxRow = rowIndex;
      });
      
      // Update state
      set(state => ({
        cells: newCells,
        rows: Math.max(state.rows, maxRow + 1),
        cols: Math.max(state.cols, maxCol + 1)
      }));
      
      // Evaluate formulas after all cells are loaded
      setTimeout(() => {
        set(state => {
          const updatedCells = { ...state.cells };
          
          Object.keys(updatedCells).forEach(cellId => {
            const cell = updatedCells[cellId];
            if (cell.formula.startsWith('=')) {
              const getCellValue = (ref: string) => updatedCells[ref]?.value || '';
              cell.value = evaluateFormula(cell.formula, getCellValue);
            }
          });
          
          return { cells: updatedCells };
        });
      }, 0);
    };
    
    reader.readAsText(file);
  },

  clearSpreadsheet: () => {
    if (window.confirm('Are you sure you want to clear all data?')) {
      get().saveState();
      const state = get();
      const clearedCells: Record<string, CellData> = {};
      
      for (let col = 0; col < state.cols; col++) {
        for (let row = 1; row <= state.rows; row++) {
          const colLabel = indexToColumnLetter(col);
          const id = `${colLabel}${row}`;
          clearedCells[id] = { 
            value: '', 
            formula: '',
            style: createEmptyCell().style
          };
        }
      }
      
      set({ cells: clearedCells });
    }
  }
}));

// Helper functions for cell selection and manipulation

// Get all cells between two cells (inclusive)
function getSelectionBetween(start: string, end: string): string[] {
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
}

// Convert column letter to index (A=0, B=1, ...)
function columnLetterToIndex(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64);
  }
  return result - 1;
}

// Convert index to column letter
function indexToColumnLetter(index: number): string {
  let letter = '';
  index++;
  while (index > 0) {
    const remainder = (index - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    index = Math.floor((index - 1) / 26);
  }
  return letter;
}

// Get the top-left cell in a selection
function getTopLeftCell(cells: string[]): string {
  let minCol = Infinity;
  let minRow = Infinity;
  
  cells.forEach(cellId => {
    const colLetter = cellId.match(/[A-Z]+/)?.[0] || '';
    const row = parseInt(cellId.match(/\d+/)?.[0] || '0');
    
    const colIndex = columnLetterToIndex(colLetter);
    
    if (colIndex < minCol) minCol = colIndex;
    if (row < minRow) minRow = row;
  });
  
  return `${indexToColumnLetter(minCol)}${minRow}`;
}

// Get the bottom-right cell in a selection
function getBottomRightCell(cells: string[]): string {
  let maxCol = -1;
  let maxRow = -1;
  
  cells.forEach(cellId => {
    const colLetter = cellId.match(/[A-Z]+/)?.[0] || '';
    const row = parseInt(cellId.match(/\d+/)?.[0] || '0');
    
    const colIndex = columnLetterToIndex(colLetter);
    
    if (colIndex > maxCol) maxCol = colIndex;
    if (row > maxRow) maxRow = row;
  });
  
  return `${indexToColumnLetter(maxCol)}${maxRow}`;
}

// Format cells for clipboard
function formatCellsForClipboard(cells: { [key: string]: CellData }, selectedCells: string[]): string {
  // Get the bounds of the selection
  const topLeft = getTopLeftCell(selectedCells);
  const bottomRight = getBottomRightCell(selectedCells);
  
  const topLeftCol = columnLetterToIndex(topLeft.match(/[A-Z]+/)?.[0] || '');
  const topLeftRow = parseInt(topLeft.match(/\d+/)?.[0] || '0');
  
  const bottomRightCol = columnLetterToIndex(bottomRight.match(/[A-Z]+/)?.[0] || '');
  const bottomRightRow = parseInt(bottomRight.match(/\d+/)?.[0] || '0');
  
  // Create a 2D array to represent the grid
  const rows = bottomRightRow - topLeftRow + 1;
  const cols = bottomRightCol - topLeftCol + 1;
  
  const grid: string[][] = Array(rows).fill(null).map(() => Array(cols).fill(''));
  
  // Fill in the grid with cell values
  selectedCells.forEach(cellId => {
    const colLetter = cellId.match(/[A-Z]+/)?.[0] || '';
    const row = parseInt(cellId.match(/\d+/)?.[0] || '0');
    
    const colIndex = columnLetterToIndex(colLetter) - topLeftCol;
    const rowIndex = row - topLeftRow;
    
    if (cells[cellId]) {
      grid[rowIndex][colIndex] = cells[cellId].value;
    }
  });
  
  // Convert the grid to a tab-delimited string
  return grid.map(row => row.join('\t')).join('\n');
}

// Parse cell ID into row and column components
function parseCellId(cellId: string): { row: number, col: string } {
  const colMatch = cellId.match(/[A-Z]+/);
  const rowMatch = cellId.match(/\d+/);
  
  if (!colMatch || !rowMatch) {
    throw new Error(`Invalid cell ID: ${cellId}`);
  }
  
  return {
    col: colMatch[0],
    row: parseInt(rowMatch[0])
  };
}

// Create cell ID from row and column
function createCellId(row: number, col: string | number): string {
  const colStr = typeof col === 'number' ? indexToColumnLetter(col) : col;
  return `${colStr}${row}`;
}

// Calculate offset for pasting cells
function calculatePasteOffset(
  sourceCellIds: string[], 
  targetCellId: string
): { rowOffset: number, colOffset: number } {
  if (sourceCellIds.length === 0) {
    return { rowOffset: 0, colOffset: 0 };
  }
  
  // Find the top-left cell in the source selection
  const sourceRows = sourceCellIds.map(id => parseCellId(id).row);
  const sourceCols = sourceCellIds.map(id => columnLetterToIndex(parseCellId(id).col));
  
  const minSourceRow = Math.min(...sourceRows);
  const minSourceCol = Math.min(...sourceCols);
  
  // Parse the target cell
  const { row: targetRow, col: targetCol } = parseCellId(targetCellId);
  const targetColIndex = columnLetterToIndex(targetCol);
  
  // Calculate the offset
  return {
    rowOffset: targetRow - minSourceRow,
    colOffset: targetColIndex - minSourceCol
  };
}