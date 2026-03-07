
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { generateReportPDF, generateReportPDFBase64 } from '../utils';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

interface Column {
  header: string;
  accessor: (item: any) => any;
  align?: 'left' | 'right' | 'center';
  width?: string;
}

interface SummaryItem {
  label: string;
  value: string;
}

interface PrintLayoutProps {
  title: string;
  subtitle?: string;
  columns: Column[];
  data: any[];
  summary?: SummaryItem[];
  onClose: () => void;
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ title, subtitle, columns, data, summary, onClose }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      if (Capacitor.isNativePlatform()) {
        // Request storage permissions before writing
        await Filesystem.requestPermissions();

        const base64Data = generateReportPDFBase64(title, subtitle || '', columns, data, summary);
        const fileName = `${title.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
        
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });
        
        await Share.share({
          title: title,
          files: [savedFile.uri],
          dialogTitle: 'Print or Save Report'
        });
      } else {
        const url = generateReportPDF(title, subtitle || '', columns, data, summary);
        if (url) {
          const link = document.createElement('a');
          link.href = url;
          link.download = `${title.replace(/ /g, '_')}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
      }
    } catch (e) {
      console.error("Print/Share failed", e);
      alert("Failed to generate PDF. Check storage permissions.");
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[99999] bg-slate-900/90 backdrop-blur-sm p-4 flex flex-col items-center justify-center"
      style={{ willChange: 'opacity' }}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl h-[85vh]"
        style={{ willChange: 'transform, opacity' }}
      >
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900">Report Preview</h3>
            <p className="text-xs text-slate-500 font-bold">Document Layout</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors border border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        {/* Document Preview Area (HTML approximation of PDF) */}
        <div className="flex-1 bg-slate-200/50 overflow-y-auto p-4 flex justify-center">
           <div className="bg-white shadow-lg w-full max-w-[210mm] min-h-[297mm] p-8 text-slate-900 box-border origin-top scale-95 sm:scale-100">
              
              {/* Document Header - Matched to utils.ts PDF generation */}
              <div className="mb-6">
                 <h1 className="text-xl font-bold text-slate-900 leading-tight">Nica.Lmk.Corp</h1>
                 <p className="text-[10px] text-slate-500 mt-1 font-medium">Enterprise Ledger Report</p>
              </div>

              {/* Report Title */}
              <div className="mb-4">
                 <h2 className="text-base font-bold text-slate-900">{title}</h2>
                 {subtitle && <p className="text-[10px] text-slate-500 italic mt-0.5">{subtitle}</p>}
              </div>

              {/* Data Table */}
              <div className="w-full mb-8">
                 <table className="w-full text-[8px] border-collapse font-sans table-fixed">
                    <thead>
                       <tr className="bg-[#1e293b] text-white">
                          {columns.map((col, i) => (
                             <th key={i} style={{ width: col.width }} className={`p-1.5 font-bold text-${col.align || 'left'} border border-slate-700`}>
                                {col.header}
                             </th>
                          ))}
                       </tr>
                    </thead>
                    <tbody>
                       {data.map((row, rowIndex) => {
                          if (row.isHeader) {
                             return (
                                <tr key={rowIndex} className="bg-slate-200">
                                   <td colSpan={columns.length} className="p-2 font-bold text-slate-900 border border-slate-300 text-center uppercase tracking-widest text-[9px] break-words whitespace-normal">
                                      {row.name}
                                   </td>
                                </tr>
                             );
                          }
                          return (
                             <tr key={rowIndex} className={`${rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                {columns.map((col, colIndex) => (
                                   <td key={colIndex} className={`p-1.5 border border-slate-200 text-${col.align || 'left'} text-slate-700 break-words whitespace-normal`}>
                                      {String(col.accessor(row))}
                                   </td>
                                ))}
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
                 {data.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-xs italic border border-t-0 border-slate-200">No records found.</div>
                 )}
              </div>

              {/* Summary Section */}
              {summary && summary.length > 0 && (
                 <div className="mt-4 break-inside-avoid">
                    <h3 className="text-xs font-bold mb-2">Summary</h3>
                    <div className="space-y-1">
                       {summary.map((item, i) => (
                          <div key={i} className="flex gap-4 items-center text-[10px]">
                             <span className="font-normal text-slate-600 min-w-[80px]">{item.label}:</span>
                             <span className="font-bold text-slate-900">{item.value}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              )}

              {/* Document Footer */}
              <div className="mt-16 pt-4 text-left">
                 <p className="text-[8px] text-slate-300">Page 1 of 1 - Generated by Nica.Lmk.Corp System</p>
              </div>
           </div>
        </div>

        {/* Action Button */}
        <div className="p-5 border-t border-slate-100 bg-white shrink-0">
           <button 
             onClick={handleDownload}
             disabled={isProcessing}
             className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-100 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-70 disabled:grayscale"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
             {isProcessing ? 'Generating...' : (Capacitor.isNativePlatform() ? 'Print / Save PDF' : 'Save / Print PDF')}
           </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
};

export default PrintLayout;
