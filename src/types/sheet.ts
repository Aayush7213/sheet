export interface CellData {
  id?: string;
  value: string;
  formula: string;
  style: CellStyle;
}

export interface CellStyle {
  bold: boolean;
  italic: boolean;
  fontSize: number;
  color: string;
}

export interface ClipboardData {
  type?: 'copy' | 'cut';
  data?: Array<CellData & { id: string }>;
  cells: { [key: string]: CellData };
  topLeft: string;
  bottomRight: string;
}

// History state type
export interface HistoryState {
  cells: { [key: string]: CellData };
  rows: number;
  cols: number;
}

export interface SheetState {
  cells: { [key: string]: CellData };
  selectedCell: string | null;
  selectedCells: string[];
  rows: number;
  cols: number;
  isDragging: boolean;
  dragStart: string | null;
  dragStartCell: string | null;
  clipboard: ClipboardData | null;
  history: HistoryState[]; // History of states for undo/redo
  historyIndex: number; // Current position in history
  
  // History operations
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  
  // Basic sheet operations
  addRow: () => void;
  deleteRow: () => void;
  addColumn: () => void;
  deleteColumn: () => void;
  updateCell: (id: string, data: Partial<CellData>) => void;
  setSelectedCell: (id: string | null) => void;
  setSelectedCells: (cells: string[] | string) => void;
  
  // Drag operations
  startDrag: (cellId: string) => void;
  handleDrag: (cellId: string) => void;
  endDrag: () => void;
  
  // Original clipboard methods
  copySelectedCells: () => void;
  pasteCells: (targetCellId: string) => void;
  
  // Enhanced clipboard methods
  copySelection: () => void;
  cutSelection: () => void;
  pasteSelection: () => void;
  
  // Import/Export functionality
  exportToCSV: () => void;
  importFromCSV: (file: File) => void;
  clearSpreadsheet: () => void;
}
