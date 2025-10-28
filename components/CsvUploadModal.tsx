import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { CloseIcon } from './icons/CloseIcon';
import { UploadIcon } from './icons/UploadIcon';

interface CsvUploadModalProps {
  onClose: () => void;
  onSave: (products: Product[]) => Promise<void>;
}

// A robust CSV row parser that correctly handles quoted fields containing commas.
const parseCsvRow = (rowString: string): string[] => {
    const fields = [];
    let currentField = '';
    let inQuotedField = false;

    for (let i = 0; i < rowString.length; i++) {
        const char = rowString[i];

        if (inQuotedField) {
            if (char === '"') {
                if (i + 1 < rowString.length && rowString[i + 1] === '"') {
                    currentField += '"';
                    i++; 
                } else {
                    inQuotedField = false;
                }
            } else {
                currentField += char;
            }
        } else { 
            if (char === '"' && currentField.length === 0) {
                inQuotedField = true;
            } else if (char === ',') {
                fields.push(currentField);
                currentField = '';
            } else {
                currentField += char;
            }
        }
    }

    fields.push(currentField);
    return fields;
};

const safeParseFloat = (val: string): number | null => {
    if (typeof val !== 'string' || !val.trim()) {
        return null; // Return null for empty or whitespace-only strings
    }

    let cleaned = val.trim().replace(/[^0-9.,-]/g, '');
    const dotCount = (cleaned.match(/\./g) || []).length;
    const commaCount = (cleaned.match(/,/g) || []).length;
    
    if (dotCount > 1 && commaCount <= 1) { // European style: 1.234,56
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
    else if (commaCount > 1 && dotCount <= 1) { // US style: 1,234.56
        cleaned = cleaned.replace(/,/g, '');
    }
    else if (dotCount === 1 && commaCount === 1) {
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) { // 1.234,56
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else { // 1,234.56
            cleaned = cleaned.replace(/,/g, '');
        }
    }
    else if (dotCount === 1 && commaCount === 0) {
        // Ambiguous: 1.234 - could be integer or decimal. Assume integer if 3 digits follow dot.
        if (cleaned.length - cleaned.indexOf('.') - 1 === 3) {
            cleaned = cleaned.replace('.', '');
        }
    }
    else if (commaCount === 1 && dotCount === 0) {
        // Ambiguous: 1,234 or 12,34. Assume integer if 3 digits follow comma.
        if (cleaned.length - cleaned.indexOf(',') - 1 === 3) {
            cleaned = cleaned.replace(',', '');
        } else {
            cleaned = cleaned.replace(',', '.');
        }
    }
    else if (commaCount > 0) {
      cleaned = cleaned.replace(',', '.');
    }

    return parseFloat(cleaned);
};


export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({ onClose, onSave }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let csvText = event.target?.result as string;
        if (!csvText) {
          throw new Error('File is empty or could not be read.');
        }
        
        if (csvText.charCodeAt(0) === 0xFEFF) {
            csvText = csvText.substring(1);
        }

        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length <= 1) {
            throw new Error('CSV file must contain a header row and at least one data row.');
        }
        
        const headersFromFile = parseCsvRow(lines[0]).map(h => h.trim().replace(/^"|"$/g, ''));
        const lowercasedHeadersFromFile = headersFromFile.map(h => h.toLowerCase());
        
        console.clear();
        console.log('--- CSV Upload Diagnostics ---');
        console.log('Detected Headers (lowercase):', lowercasedHeadersFromFile);
        
        const requiredHeaders = ['id', 'colorname', 'price_5_24', 'price_25_89', 'price_90_499', 'price_500_plus'];
        const missing = requiredHeaders.filter(h => !lowercasedHeadersFromFile.includes(h));

        if (missing.length > 0) {
            throw new Error(`CSV headers are incorrect or missing. Missing: [${missing.join(', ')}]. Headers found in file: [${headersFromFile.join(', ')}].`);
        }
        
        const newProducts: Product[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const shouldLog = i <= 5;

          if (shouldLog) console.group(`Processing Row ${i + 1}`);

          const values = parseCsvRow(lines[i]);
          const row = lowercasedHeadersFromFile.reduce((obj, header, index) => {
            obj[header] = values[index] || '';
            return obj;
          }, {} as Record<string, string>);

          if (shouldLog) {
            console.log('Raw Line:', `"${lines[i]}"`);
            console.log('Parsed Values:', values);
            console.log('Constructed Row Object:', row);
          }
          
          const id = row['id'];
          const colorName = row['colorname'];

          if (!id || !colorName) {
            if (shouldLog) console.warn('SKIPPING: Missing id or colorName.');
            if (shouldLog) console.groupEnd();
            continue;
          }
          
          const parsedPrices = {
              p5: safeParseFloat(row['price_5_24']),
              p25: safeParseFloat(row['price_25_89']),
              p90: safeParseFloat(row['price_90_499']),
              p500: safeParseFloat(row['price_500_plus']),
          };
           if (shouldLog) {
            console.log('Parsed Prices (pre-fill):', parsedPrices);
          }

          const parsedPriceValues = [parsedPrices.p5, parsedPrices.p25, parsedPrices.p90, parsedPrices.p500];
          const validPrices = parsedPriceValues.filter(p => typeof p === 'number' && !isNaN(p)) as number[];
          
          if (validPrices.length === 0) {
              if (shouldLog) console.warn('SKIPPING: No valid prices found in this row.');
              if (shouldLog) console.groupEnd();
              continue;
          }
          
          const finalPrices: (number | null)[] = [...parsedPriceValues];

          // Pass 1: Forward fill
          let lastValidPrice: number | null = null;
          for (let j = 0; j < finalPrices.length; j++) {
              if (finalPrices[j] !== null) {
                  lastValidPrice = finalPrices[j];
              } else if (lastValidPrice !== null) {
                  finalPrices[j] = lastValidPrice;
              }
          }
          if (shouldLog) console.log('Prices after forward-fill:', finalPrices);
      
          // Pass 2: Backward fill (for leading empty values)
          let nextValidPrice: number | null = null;
          for (let j = finalPrices.length - 1; j >= 0; j--) {
              if (finalPrices[j] !== null) {
                  nextValidPrice = finalPrices[j];
              } else if (nextValidPrice !== null) {
                  finalPrices[j] = nextValidPrice;
              }
          }
          if (shouldLog) console.log('Prices after backward-fill (final):', finalPrices);
          
          const priceTiers = [
            { pounds: 5, pricePerPound: finalPrices[0]! },
            { pounds: 25, pricePerPound: finalPrices[1]! },
            { pounds: 90, pricePerPound: finalPrices[2]! },
            { pounds: 500, pricePerPound: finalPrices[3]! },
          ];
          

          if (shouldLog) console.log('SUCCESS: Row is valid and will be added.');
          const newProduct: Product = {
            id: id,
            colorName: colorName,
            priceTiers: priceTiers,
          };
          newProducts.push(newProduct);
          if (shouldLog) console.groupEnd();
        }
        
        console.log(`--- End Diagnostics --- (Processed ${lines.length - 1} data rows in total)`);
        
        if (lines.length > 1 && newProducts.length === 0) {
            throw new Error("File processed, but no valid product rows were found. Please check the developer console (F12) for detailed processing logs and verify your file's content and formatting.");
        }
        
        await onSave(newProducts);
        setSuccess(`Successfully loaded ${newProducts.length} products from the file.`);

      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred while processing the file.');
      } finally {
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
        setError('Failed to read the file.');
        setIsProcessing(false);
    };

    reader.readAsText(file);
  };
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload CSV to Update Prices</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none" aria-label="Close modal">
            <CloseIcon />
          </button>
        </div>

        <div className="p-6 space-y-4">
            <div className="bg-blue-50 dark:bg-gray-700 border-l-4 border-blue-400 p-4 rounded-md text-left">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Instructions:</strong> This will <strong className="font-semibold">replace the entire price list</strong> with the contents of your CSV file.
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
                  <strong>Required headers:</strong> 
                  <code className="mx-1 font-mono bg-gray-200 dark:bg-gray-600 rounded px-1">id</code>, 
                  <code className="mx-1 font-mono bg-gray-200 dark:bg-gray-600 rounded px-1">colorName</code>, 
                  <code className="mx-1 font-mono bg-gray-200 dark:bg-gray-600 rounded px-1">price_5_24</code>, 
                  <code className="mx-1 font-mono bg-gray-200 dark:bg-gray-600 rounded px-1">price_25_89</code>, 
                  <code className="mx-1 font-mono bg-gray-200 dark:bg-gray-600 rounded px-1">price_90_499</code>, 
                  <code className="mx-1 font-mono bg-gray-200 dark:bg-gray-600 rounded px-1">price_500_plus</code>.
                </p>
                 <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">Headers are case-insensitive and can be in any order. Empty price cells will be automatically filled with the value from the last valid column in that row.</p>
            </div>
            
            <div>
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select CSV File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900 dark:file:text-blue-200 dark:hover:file:bg-blue-800"
              />
            </div>
            
            {error && <p className="text-sm text-red-500">{error}</p>}
            {success && <p className="text-sm text-green-500">{success}</p>}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none">
            {success ? 'Close' : 'Cancel'}
          </button>
          <button type="button" onClick={handleProcessFile} disabled={isProcessing || !file} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none disabled:bg-green-400 disabled:cursor-not-allowed flex items-center gap-2">
            {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Processing...
                </>
              ) : (
                <>
                  <UploadIcon />
                  Process File
                </>
              )}
          </button>
        </div>
      </div>
    </div>
  );
};