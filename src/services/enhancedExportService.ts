import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { ChartExportOptions } from '../types/enhanced';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export class EnhancedExportService {
  
  // Export to CSV
  exportToCSV(data: any[], filename: string, title?: string): void {
    try {
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        title ? `# ${title}` : '',
        headers.join(','),
        ...data.map(row => headers.map(header => {
          const value = row[header];
          // Handle quotes and commas in values
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(','))
      ].filter(line => line).join('\n');

      this.downloadFile(csvContent, `${filename}.csv`, 'text/csv');
    } catch (error) {
      console.error('CSV export error:', error);
      throw new Error('Failed to export CSV');
    }
  }

  // Export to PDF
  async exportToPDF(data: any[], filename: string, options: ChartExportOptions = { format: 'pdf', filename }): Promise<void> {
    try {
      const pdf = new jsPDF();
      
      // Add title
      if (options.title) {
        pdf.setFontSize(16);
        pdf.text(options.title, 14, 20);
      }

      // Add timestamp
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

      // Add table
      if (data.length > 0) {
        const headers = Object.keys(data[0]).map(key => key.toUpperCase());
        const tableData = data.map(row => Object.values(row));

        pdf.autoTable({
          head: [headers],
          body: tableData,
          startY: options.title ? 40 : 25,
          theme: 'grid',
          styles: { fontSize: 8, cellPadding: 3 },
          headStyles: { fillColor: [66, 139, 202] },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });
      }

      // Save the PDF
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error('Failed to export PDF');
    }
  }

  // Export Chart as Image
  async exportChartAsImage(chartElement: HTMLElement, filename: string, format: 'png' | 'jpeg' = 'png'): Promise<void> {
    try {
      // Using html2canvas for DOM to image conversion
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${filename}.${format}`;
          link.click();
          URL.revokeObjectURL(url);
        }
      }, `image/${format}`, 1.0);
    } catch (error) {
      console.error('Chart image export error:', error);
      throw new Error('Failed to export chart as image');
    }
  }

  // Export Combined Report (Multiple tables/charts)
  async exportCombinedReport(data: {
    title: string;
    tables: Array<{
      name: string;
      data: any[];
      chartElement?: HTMLElement;
    }>;
  }, filename: string): Promise<void> {
    try {
      const pdf = new jsPDF();

      // Title page
      pdf.setFontSize(20);
      pdf.text(data.title, 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 45);

      let yPosition = 60;

      // Add each table
      for (const table of data.tables) {
        if (table.data.length > 0) {
          // Add section title
          pdf.setFontSize(14);
          pdf.text(table.name, 20, yPosition);
          yPosition += 10;

          // Add table
          const headers = Object.keys(table.data[0]).map(key => key.toUpperCase());
          const tableData = table.data.map(row => Object.values(row));

          pdf.autoTable({
            head: [headers],
            body: tableData,
            startY: yPosition,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3 },
            headStyles: { fillColor: [66, 139, 202] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            didDrawPage: (data) => {
              yPosition = data.cursor?.y || yPosition;
            }
          });

          yPosition += 20;
        }

        // Add chart if provided
        if (table.chartElement) {
          try {
            const html2canvas = (await import('html2canvas')).default;
            const canvas = await html2canvas(table.chartElement, {
              backgroundColor: '#ffffff',
              scale: 1.5,
              logging: false
            });

            const imgData = canvas.toDataURL('image/png');
            pdf.addImage(imgData, 'PNG', 20, yPosition, 170, 100);
            yPosition += 110;
          } catch (chartError) {
            console.warn(`Failed to add chart for ${table.name}:`, chartError);
          }
        }

        // Add new page if needed
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 30;
        }
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Combined report export error:', error);
      throw new Error('Failed to export combined report');
    }
  }

  // Export Data Table
  exportDataTable(data: any[], filename: string, title?: string, options: {
    includeTimestamp?: boolean;
    format?: 'csv' | 'pdf';
  } = {}): Promise<void> {
    const { includeTimestamp = true, format = 'csv' } = options;

    if (format === 'csv') {
      this.exportToCSV(data, filename, title);
    } else {
      const exportOptions: ChartExportOptions = {
        format: 'pdf',
        filename,
        title: includeTimestamp ? `${title} - Generated ${new Date().toLocaleString()}` : title
      };
      return this.exportToPDF(data, filename, exportOptions);
    }
  }

  // Export Bulk Data (for large datasets)
  exportBulkData(data: any[], filename: string, batchSize: number = 1000): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (data.length <= batchSize) {
          this.exportToCSV(data, filename);
          resolve();
          return;
        }

        // For large datasets, create multiple files
        const batches = [];
        for (let i = 0; i < data.length; i += batchSize) {
          batches.push(data.slice(i, i + batchSize));
        }

        for (let i = 0; i < batches.length; i++) {
          const batchFilename = i === 0 ? filename : `${filename}_part_${i + 1}`;
          this.exportToCSV(batches[i], batchFilename);
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Utility method to download file
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Format data for export
  private formatDataForExport(data: any[], options: {
    dateFields?: string[];
    currencyFields?: string[];
    booleanFields?: string[];
  } = {}): any[] {
    const { dateFields = [], currencyFields = [], booleanFields = [] } = options;

    return data.map(row => {
      const formattedRow = { ...row };

      // Format date fields
      dateFields.forEach(field => {
        if (formattedRow[field]) {
          formattedRow[field] = new Date(formattedRow[field]).toLocaleDateString();
        }
      });

      // Format currency fields
      currencyFields.forEach(field => {
        if (formattedRow[field]) {
          formattedRow[field] = `₹${Number(formattedRow[field]).toFixed(2)}`;
        }
      });

      // Format boolean fields
      booleanFields.forEach(field => {
        if (formattedRow[field] !== undefined) {
          formattedRow[field] = formattedRow[field] ? 'Yes' : 'No';
        }
      });

      return formattedRow;
    });
  }

  // Export with formatted data
  exportFormattedData(
    data: any[],
    filename: string,
    format: 'csv' | 'pdf',
    formatOptions: {
      dateFields?: string[];
      currencyFields?: string[];
      booleanFields?: string[];
      title?: string;
    } = {}
  ): Promise<void> {
    const formattedData = this.formatDataForExport(data, formatOptions);
    
    if (format === 'csv') {
      this.exportToCSV(formattedData, filename, formatOptions.title);
    } else {
      return this.exportToPDF(formattedData, filename, {
        format: 'pdf',
        filename,
        title: formatOptions.title
      });
    }
  }

  // Get file size info
  getDataSizeInfo(data: any[]): { recordCount: number; estimatedSize: string } {
    const recordCount = data.length;
    const estimatedSize = JSON.stringify(data).length;
    
    let sizeDisplay = '';
    if (estimatedSize < 1024) {
      sizeDisplay = `${estimatedSize} bytes`;
    } else if (estimatedSize < 1024 * 1024) {
      sizeDisplay = `${(estimatedSize / 1024).toFixed(1)} KB`;
    } else {
      sizeDisplay = `${(estimatedSize / (1024 * 1024)).toFixed(1)} MB`;
    }

    return { recordCount, estimatedSize: sizeDisplay };
  }
}

export const exportService = new EnhancedExportService();