/**
 * Utility functions for spreadsheet formula evaluation
 */

/**
 * Evaluates a formula string and returns the result
 * @param formula The formula to evaluate
 * @param getCellValue Function to retrieve cell values
 * @returns The evaluated result as a string
 */
export const evaluateFormula = (formula: string, getCellValue: (ref: string) => string): string => {
  if (!formula.startsWith('=')) return formula;

  const cleanFormula = formula.substring(1).toUpperCase();
  
  // Handle basic functions
  if (cleanFormula.startsWith('SUM(')) {
    const range = parseRange(cleanFormula.slice(4, -1));
    const values = range.map(getCellValue).filter(v => !isNaN(Number(v)));
    return values.reduce((sum, val) => sum + Number(val), 0).toString();
  }

  if (cleanFormula.startsWith('AVERAGE(')) {
    const range = parseRange(cleanFormula.slice(8, -1));
    const values = range.map(getCellValue).filter(v => !isNaN(Number(v)));
    return (values.reduce((sum, val) => sum + Number(val), 0) / values.length).toString();
  }

  if (cleanFormula.startsWith('MAX(')) {
    const range = parseRange(cleanFormula.slice(4, -1));
    const values = range.map(getCellValue).filter(v => !isNaN(Number(v)));
    return Math.max(...values.map(Number)).toString();
  }

  if (cleanFormula.startsWith('MIN(')) {
    const range = parseRange(cleanFormula.slice(4, -1));
    const values = range.map(getCellValue).filter(v => !isNaN(Number(v)));
    return Math.min(...values.map(Number)).toString();
  }

  if (cleanFormula.startsWith('COUNT(')) {
    const range = parseRange(cleanFormula.slice(6, -1));
    return range.map(getCellValue).filter(v => !isNaN(Number(v))).length.toString();
  }

  // Data quality functions
  if (cleanFormula.startsWith('TRIM(')) {
    const ref = cleanFormula.slice(5, -1);
    return getCellValue(ref).trim();
  }

  if (cleanFormula.startsWith('UPPER(')) {
    const ref = cleanFormula.slice(6, -1);
    return getCellValue(ref).toUpperCase();
  }

  if (cleanFormula.startsWith('LOWER(')) {
    const ref = cleanFormula.slice(6, -1);
    return getCellValue(ref).toLowerCase();
  }

  // Data manipulation functions
  if (cleanFormula.startsWith('REMOVE_DUPLICATES(')) {
    const range = parseRange(cleanFormula.slice(17, -1));
    const values = range.map(getCellValue);
    const uniqueValues = [...new Set(values)];
    return uniqueValues.join(', ');
  }

  if (cleanFormula.startsWith('FIND_AND_REPLACE(')) {
    try {
      // Split parameters while preserving quoted strings
      const params = splitParameters(cleanFormula.slice(16, -1));
      if (params.length !== 3) return '#ERROR: Expected 3 parameters (range, find_text, replace_text)';

      const [rangeStr, findText, replaceText] = params;
      
      // Remove quotes if present
      const cleanFindText = findText.replace(/^["']|["']$/g, '');
      const cleanReplaceText = replaceText.replace(/^["']|["']$/g, '');
      
      // Get range and values
      const range = parseRange(rangeStr);
      const values = range.map(getCellValue);
      
      // Perform replacement
      const replacedValues = values.map(value => {
        try {
          return value.replaceAll(cleanFindText, cleanReplaceText);
        } catch (e) {
          return value; // Return original value if replacement fails
        }
      });
      
      // Return a formatted preview of the changes
      return replacedValues.join(', ');
    } catch (e) {
      return '#ERROR: Invalid FIND_AND_REPLACE syntax';
    }
  }

  return formula;
};

/**
 * Parses a cell range string (e.g., "A1:B3") into an array of cell references
 * Supports absolute references (e.g., $A$1) which remain fixed when copied
 * @param range The range string to parse
 * @param currentCell Optional current cell for relative reference calculation
 * @returns Array of cell references
 */
export const parseRange = (range: string, currentCell?: string): string[] => {
  // Handle empty or invalid ranges
  if (!range || range.trim() === '') {
    return [];
  }

  try {
    const parts = range.split(':');
    const start = parts[0].trim();
    const end = parts.length > 1 ? parts[1].trim() : start;

    if (!end) return [normalizeReference(start, currentCell)];

    // Parse start and end references
    const startRef = parseReference(start);
    const endRef = parseReference(end);

    const cells: string[] = [];
    for (let col = startRef.colIndex; col <= endRef.colIndex; col++) {
      for (let row = startRef.row; row <= endRef.row; row++) {
        cells.push(`${String.fromCharCode(65 + col)}${row}`);
      }
    }
    return cells;
  } catch (error) {
    console.error("Error parsing range:", range, error);
    return [];
  }
};

/**
 * Parses a cell reference and returns its components
 * Handles both relative and absolute references
 * @param ref Cell reference (e.g., A1, $A1, A$1, $A$1)
 * @returns Parsed reference with column index and row
 */
export const parseReference = (ref: string): { 
  colIndex: number; 
  row: number;
  colAbsolute: boolean;
  rowAbsolute: boolean;
  original: string;
} => {
  if (!ref || typeof ref !== 'string') {
    throw new Error(`Invalid cell reference: ${ref}`);
  }

  const original = ref.trim();
  let workingRef = original;
  let colAbsolute = false;
  let rowAbsolute = false;
  
  // Check for absolute column reference ($A)
  if (workingRef.startsWith('$')) {
    colAbsolute = true;
    workingRef = workingRef.substring(1);
  }
  
  // Extract column letter - must be at the beginning of the reference
  const colMatch = workingRef.match(/^[A-Za-z]+/);
  if (!colMatch) {
    throw new Error(`Invalid cell reference: ${original}`);
  }
  
  const colLetter = colMatch[0].toUpperCase();
  
  // Remove column part from the working reference
  workingRef = workingRef.substring(colLetter.length);
  
  // Check for absolute row reference (A$1)
  if (workingRef.startsWith('$')) {
    rowAbsolute = true;
    workingRef = workingRef.substring(1);
  }
  
  // Extract row number - must be the rest of the reference
  const rowMatch = workingRef.match(/^\d+$/);
  if (!rowMatch) {
    throw new Error(`Invalid cell reference: ${original}`);
  }
  
  const row = parseInt(rowMatch[0], 10);
  
  // Calculate column index (A=0, B=1, etc.)
  let colIndex = 0;
  for (let i = 0; i < colLetter.length; i++) {
    colIndex = colIndex * 26 + (colLetter.charCodeAt(i) - 65);
  }
  
  return { colIndex, row, colAbsolute, rowAbsolute, original };
};

/**
 * Normalizes a cell reference, handling absolute references
 * @param ref Cell reference to normalize
 * @param currentCell Optional current cell for relative reference calculation
 * @returns Normalized cell reference
 */
export const normalizeReference = (ref: string, currentCell?: string): string => {
  // If no current cell or reference is already absolute, return as is
  if (!currentCell || ref.includes('$')) return ref.replace(/\$/g, '');
  
  // For relative references, just return the reference without modification
  return ref;
};

/**
 * Splits a parameter string into an array of parameters, preserving quoted strings
 * @param paramString The parameter string to split
 * @returns Array of parameters
 */
export const splitParameters = (paramString: string): string[] => {
  const params: string[] = [];
  let currentParam = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < paramString.length; i++) {
    const char = paramString[i];
    
    if ((char === '"' || char === "'") && (!inQuotes || quoteChar === char)) {
      inQuotes = !inQuotes;
      if (inQuotes) quoteChar = char;
      currentParam += char;
    } else if (char === ',' && !inQuotes) {
      params.push(currentParam.trim());
      currentParam = '';
    } else {
      currentParam += char;
    }
  }
  
  if (currentParam) {
    params.push(currentParam.trim());
  }

  return params;
};

/**
 * Performs find and replace operation on a range of cells and updates their values
 * @param range Array of cell references
 * @param findText Text to find
 * @param replaceText Text to replace with
 * @param getCellValue Function to get cell values
 * @param updateCell Function to update cell values
 * @returns Summary of changes made
 */
export const performFindAndReplace = (
  range: string[],
  findText: string,
  replaceText: string,
  getCellValue: (ref: string) => string,
  updateCell: (ref: string, value: string) => void
): string => {
  let changesCount = 0;
  
  // Clean the input parameters
  const cleanFindText = findText.replace(/^["']|["']$/g, '');
  const cleanReplaceText = replaceText.replace(/^["']|["']$/g, '');
  
  // Process each cell in the range
  range.forEach(cellRef => {
    const currentValue = getCellValue(cellRef);
    if (currentValue.includes(cleanFindText)) {
      const newValue = currentValue.replaceAll(cleanFindText, cleanReplaceText);
      updateCell(cellRef, newValue);
      changesCount++;
    }
  });
  
  return `Changed ${changesCount} cell${changesCount !== 1 ? 's' : ''}`;
};