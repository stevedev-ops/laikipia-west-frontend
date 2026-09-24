/**
 * Formats Kenyan mobile numbers into standard readable format (07XX XXX XXX or 01XX XXX XXX)
 * Supports Safaricom, Airtel, and Telkom 07 and 01 series numbers.
 * @param {string|number} phone - Raw phone number
 * @returns {string} Formatted readable phone number
 */
export function formatKenyanPhone(phone) {
  if (!phone) return "";
  let p = String(phone).trim().replace(/[\s\-\+\(\)]/g, "");
  
  if (p.startsWith("254")) {
    p = "0" + p.slice(3);
  } else if (p.length === 9 && (p.startsWith("7") || p.startsWith("1"))) {
    p = "0" + p;
  }
  
  if (p.length === 10 && (p.startsWith("07") || p.startsWith("01"))) {
    return `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}`;
  }
  return p;
}

/**
 * Converts an array of objects to a CSV string and triggers a browser download.
 * Ensures phone numbers (both 07 and 01 prefixes) and National IDs are formatted
 * as readable text strings so Excel and Google Sheets do not convert them to scientific notation.
 * @param {Array<Object>} dataArray - The data to export.
 * @param {string} filename - The desired filename (without .csv).
 */
export function exportToCSV(dataArray, filename) {
  if (!dataArray || !dataArray.length) {
    console.warn("No data to export.");
    return;
  }

  // Extract headers
  const headers = Object.keys(dataArray[0]);
  const csvRows = [];
  
  // Format Header Row
  csvRows.push(headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','));

  for (const row of dataArray) {
    const values = headers.map(header => {
      let val = row[header];
      if (val === null || val === undefined) {
        return '""';
      }

      const stringVal = String(val).trim();
      const lowerHeader = header.toLowerCase();
      const isPhoneOrId = /phone|mobile|contact|national_id|id_number|id\b/i.test(lowerHeader);

      // If it's already an explicit formula string, retain it
      if (stringVal.startsWith('="') && stringVal.endsWith('"')) {
        return stringVal;
      }

      const digitsOnly = stringVal.replace(/[\s\-\+\(\)]/g, '');

      // Check if this is a Kenyan phone number (07..., 01..., 2547..., 2541...)
      if (isPhoneOrId && (/^\+?254[17]\d{8}$/.test(digitsOnly) || /^0[17]\d{8}$/.test(digitsOnly) || /^[17]\d{8}$/.test(digitsOnly))) {
        const formattedPhone = formatKenyanPhone(digitsOnly);
        // Formula wrapper ="07XX XXX XXX" forces Excel/Sheets to display complete text with zero and spaces
        return `="` + formattedPhone.replace(/"/g, '""') + `"`;
      }

      // Check if this is a plain National ID (digits only 5 to 12 chars)
      if (isPhoneOrId && /^\d{5,12}$/.test(digitsOnly)) {
        return `="` + digitsOnly + `"`;
      }

      // Escape quotes and wrap in quotes if needed
      if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('\r') || stringVal.includes('"')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return `"${stringVal}"`;
    });
    csvRows.push(values.join(','));
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens with UTF-8 character encoding
  const csvString = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
