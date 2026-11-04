import { describe, it, expect } from 'vitest';
import { sanitizeForExcel, generateExcelWorkbook } from '../src/utils/excelExporter.js';

describe('Excel Exporter & Formula Injection Protection', () => {
  it('neutralizes malicious formula injection characters (=, +, -, @)', () => {
    expect(sanitizeForExcel('=1+2')).toBe("'=1+2");
    expect(sanitizeForExcel('+1+2')).toBe("'+1+2");
    expect(sanitizeForExcel('-5+2')).toBe("'-5+2");
    expect(sanitizeForExcel('@SUM(A1:A10)')).toBe("'@SUM(A1:A10)");
    expect(sanitizeForExcel('\tcmd|')).toBe("'\tcmd|");

    // Safe numbers and standard text remain unescaped
    expect(sanitizeForExcel(1500)).toBe(1500);
    expect(sanitizeForExcel('John Doe')).toBe('John Doe');
    expect(sanitizeForExcel('')).toBe('');
  });

  it('generates a valid excel workbook buffer with custom headers and data', async () => {
    const columns = [
      { header: 'Item Name', key: 'name', width: 20 },
      { header: 'Cost (Rs)', key: 'cost', width: 15 },
    ];
    const data = [
      { name: 'Diesel', cost: 1200 },
      { name: '=DangerousFormula', cost: 500 },
    ];

    const buffer = await generateExcelWorkbook({
      sheetName: 'TestSheet',
      columns,
      data,
    });

    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(100);
  });
});
