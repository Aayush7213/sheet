import Header from './components/Header';
import { useSheetStore } from './store/sheetStore';
import { Cell } from './components/Cell';
import { Toolbar } from './components/Toolbar';
import { FormulaBar } from './components/FormulaBar';

function App() {
  const { rows, cols } = useSheetStore();

  const renderColumnHeaders = () => {
    return (
      <div className="flex sticky top-0 z-10">
        <div className="w-[50px] h-[30px] bg-gray-50 border-r border-b border-gray-300 flex items-center justify-center">
          <div className="w-3 h-3 bg-gray-300 rounded-sm"></div>
        </div>
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="min-w-[120px] h-[30px] bg-gray-50 border-r border-b border-gray-300 flex items-center justify-center font-medium text-gray-600 select-none hover:bg-gray-100 transition-colors"
          >
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>
    );
  };

  const renderRowHeaders = (rowIndex: number) => (
    <div className="w-[50px] h-[30px] bg-gray-50 border-r border-b border-gray-300 flex items-center justify-center font-medium text-gray-600 select-none sticky left-0 hover:bg-gray-100 transition-colors">
      {rowIndex + 1}
    </div>
  );

  return (
    
    <div className="h-screen flex flex-col bg-white">  
        <Header />
      <Toolbar />
      <FormulaBar />
      <div className="flex-1 overflow-auto relative">
        <div className="inline-block min-w-full">
          {renderColumnHeaders()}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="flex">
              {renderRowHeaders(rowIndex)}
              {Array.from({ length: cols }).map((_, colIndex) => (
                <Cell
                  key={`${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`}
                  id={`${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;