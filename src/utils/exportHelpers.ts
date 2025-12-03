import type { ExportOptions, ChartExportOptions, ExportJob } from '../types';

// ==================== CSV EXPORT HELPERS ====================
export const exportToCSV = (data: any[], filename: string, options?: ExportOptions): void => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const { includeHeaders = true, columns } = options || {};
    
    // Get headers from first object or use provided columns
    let headers = columns || Object.keys(data[0]);
    
    // Create CSV content
    const csvContent: string[] = [];
    
    // Add headers
    if (includeHeaders) {
      csvContent.push(headers.join(','));
    }
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Handle special characters and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvContent.push(values.join(','));
    });
    
    // Create and download file
    const blob = new Blob([csvContent.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`CSV export completed: ${filename}.csv`);
  } catch (error) {
    console.error('CSV export failed:', error);
    throw error;
  }
};

// ==================== EXCEL EXPORT HELPERS ====================
export const exportToExcel = async (data: any[], filename: string, options?: ExportOptions): Promise<void> => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // For now, we'll use CSV format for Excel as well
    // In a production environment, you might want to use libraries like SheetJS
    const { includeHeaders = true, columns } = options || {};
    
    let headers = columns || Object.keys(data[0]);
    
    // Create workbook content (simplified CSV format)
    const csvContent: string[] = [];
    
    if (includeHeaders) {
      csvContent.push(headers.join(','));
    }
    
    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvContent.push(values.join(','));
    });
    
    const blob = new Blob([csvContent.join('\n')], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.xls`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Excel export completed: ${filename}.xls`);
  } catch (error) {
    console.error('Excel export failed:', error);
    throw error;
  }
};

// ==================== PDF EXPORT HELPERS ====================
export const exportToPDF = async (data: any[], filename: string, options?: ExportOptions): Promise<void> => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // For now, create a simple HTML representation that can be printed as PDF
    const { includeHeaders = true, columns } = options || {};
    
    let headers = columns || Object.keys(data[0]);
    
    // Create HTML content
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .header { text-align: center; margin-bottom: 30px; }
          .export-date { text-align: right; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${filename}</h1>
          <div class="export-date">Exported on: ${new Date().toLocaleDateString()}</div>
        </div>
        <table>
    `;
    
    // Add headers
    if (includeHeaders) {
      html += '<tr>';
      headers.forEach(header => {
        html += `<th>${header}</th>`;
      });
      html += '</tr>';
    }
    
    // Add data rows
    data.forEach(row => {
      html += '<tr>';
      headers.forEach(header => {
        const value = row[header] || '';
        html += `<td>${value}</td>`;
      });
      html += '</tr>';
    });
    
    html += `
        </table>
      </body>
      </html>
    `;
    
    // Create blob and open in new window for printing
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    console.log(`PDF export prepared: ${filename}`);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
};

// ==================== CHART EXPORT HELPERS ====================
export const exportChart = async (
  chartElement: HTMLElement, 
  filename: string, 
  options?: ChartExportOptions
): Promise<void> => {
  try {
    if (!chartElement) {
      throw new Error('Chart element not found');
    }

    const { 
      format = 'png', 
      quality = 1.0, 
      width = 800, 
      height = 600 
    } = options || {};
    
    // For canvas-based charts, we can directly export
    const canvas = chartElement.querySelector('canvas') as HTMLCanvasElement;
    if (canvas) {
      await exportCanvasChart(canvas, filename, options);
    } else {
      // For SVG charts or other types, use html2canvas approach
      await exportSVGChart(chartElement, filename, options);
    }
  } catch (error) {
    console.error('Chart export failed:', error);
    throw error;
  }
};

const exportCanvasChart = async (
  canvas: HTMLCanvasElement, 
  filename: string, 
  options?: ChartExportOptions
): Promise<void> => {
  const { format = 'png', quality = 1.0 } = options || {};
  
  // Create temporary canvas with desired dimensions
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) {
    throw new Error('Could not get canvas context');
  }
  
  tempCanvas.width = options?.width || 800;
  tempCanvas.height = options?.height || 600;
  
  // Draw original canvas to temporary canvas
  tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
  
  // Export
  tempCanvas.toBlob((blob) => {
    if (blob) {
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.${format}`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }
  }, `image/${format}`, quality);
};

const exportSVGChart = async (
  element: HTMLElement, 
  filename: string, 
  options?: ChartExportOptions
): Promise<void> => {
  // For SVG charts, serialize the SVG
  const svg = element.querySelector('svg');
  if (svg) {
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    
    // Convert SVG to canvas for PNG/JPEG export
    if (options?.format === 'png' || options?.format === 'jpeg') {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = options?.width || 800;
      canvas.height = options?.height || 600;
      
      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          canvas.toBlob((blob) => {
            if (blob) {
              const link = document.createElement('a');
              const url = URL.createObjectURL(blob);
              
              link.setAttribute('href', url);
              link.setAttribute('download', `${filename}.${options?.format || 'png'}`);
              link.style.visibility = 'hidden';
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              URL.revokeObjectURL(url);
            }
          }, `image/${options?.format || 'png'}`, options?.quality || 1.0);
        }
      };
      
      img.src = URL.createObjectURL(svgBlob);
    } else {
      // For SVG format, download directly
      const link = document.createElement('a');
      const url = URL.createObjectURL(svgBlob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.svg`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    }
  }
};

// ==================== BULK EXPORT HELPERS ====================
export const createExportJob = (type: string, options: ExportOptions): ExportJob => {
  return {
    id: generateJobId(),
    type: type as 'table' | 'chart' | 'dashboard',
    options,
    status: 'pending',
    progress: 0,
    createdAt: new Date().toISOString()
  };
};

const generateJobId = (): string => {
  return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ==================== DATA FORMATTING HELPERS ====================
export const formatDataForExport = (data: any[], format: string): any[] => {
  switch (format.toLowerCase()) {
    case 'json':
      return data.map(item => JSON.stringify(item));
    case 'csv':
    case 'excel':
    case 'pdf':
      return data;
    default:
      return data;
  }
};

export const validateExportData = (data: any[]): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data) {
    errors.push('Data is required');
  }
  
  if (Array.isArray(data) && data.length === 0) {
    errors.push('Data array cannot be empty');
  }
  
  if (Array.isArray(data) && data.length > 50000) {
    errors.push('Data too large for export (maximum 50,000 rows)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ==================== DOWNLOAD HELPERS ====================
export const triggerDownload = (blob: Blob, filename: string): void => {
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the object URL after a short delay
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const downloadTextFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  triggerDownload(blob, filename);
};