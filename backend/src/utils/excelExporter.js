import ExcelJS from 'exceljs';

/**
 * Sanitize cell values to prevent CSV / Excel Formula Injection (CWE-1236)
 * @param {any} val
 * @returns {any}
 */
export const sanitizeForExcel = (val) => {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
};

/**
 * Generate Excel workbook buffer with custom styled header and rows
 * @param {Object} options
 * @param {string} options.sheetName
 * @param {Array<{ header: string, key: string, width?: number }>} options.columns
 * @param {Array<Object>} options.data
 * @returns {Promise<Buffer>}
 */
export const generateExcelWorkbook = async ({ sheetName = 'Report', columns, data }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DhaanTrack Harvester Management System';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }],
  });

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 18,
  }));

  // Style Header Row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF16A34A' }, // DhaanTrack Green
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.height = 26;

  // Add Data Rows
  data.forEach((item) => {
    const rowValues = {};
    columns.forEach((col) => {
      const rawVal = item[col.key];
      rowValues[col.key] = sanitizeForExcel(rawVal);
    });
    const row = worksheet.addRow(rowValues);
    row.height = 22;
    row.alignment = { vertical: 'middle' };
  });

  // Apply subtle borders
  worksheet.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };
    });
  });

  return await workbook.xlsx.writeBuffer();
};
