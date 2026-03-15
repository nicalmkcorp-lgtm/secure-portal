import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Investor, DebtRecord, TabType } from './types';

/**
 * Returns today's date as a string in YYYY-MM-DD format based on local time.
 */
export const getTodayStr = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns the ordinal suffix for a number (e.g., 1st, 2nd, 3rd, 4th).
 */
export const getOrdinal = (n: number) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
};

/**
 * Schedules monthly repeating local notifications for investors.
 */
export const syncInvestorReminders = async (investors: Investor[]) => {
  try {
    const isGranted = await LocalNotifications.requestPermissions();
    if (isGranted.display !== 'granted') return;

    // Clear existing scheduled investor notifications to prevent duplicates
    const pending = await LocalNotifications.getPending();
    const investorNotificationIds = pending.notifications
      .filter(n => String(n.id).startsWith('99')) // Using 99 prefix for investor IDs
      .map(n => n.id);
    
    if (investorNotificationIds.length > 0) {
      await LocalNotifications.cancel({ notifications: investorNotificationIds.map(id => ({ id })) });
    }

    const notificationsToSchedule = investors.flatMap((inv, idx) => {
      const investDate = new Date(inv.dateInvested);
      if (isNaN(investDate.getTime())) return [];

      const now = new Date();
      const notifications = [];
      
      let monthsToAdd = 0;
      // Find the first occurrence that is in the future
      while (true) {
        const tempDate = new Date(investDate);
        tempDate.setHours(8, 0, 0, 0);
        tempDate.setMonth(tempDate.getMonth() + monthsToAdd);
        
        const beforeDate = new Date(tempDate);
        beforeDate.setDate(beforeDate.getDate() - 1);
        
        if (tempDate.getTime() > now.getTime() || beforeDate.getTime() > now.getTime()) {
          break;
        }
        monthsToAdd++;
      }

      // Schedule for the next 1 occurrence
      for (let i = 0; i < 1; i++) {
        const actualDate = new Date(investDate);
        actualDate.setHours(8, 0, 0, 0);
        actualDate.setMonth(actualDate.getMonth() + monthsToAdd + i);

        const beforeDate = new Date(actualDate);
        beforeDate.setDate(beforeDate.getDate() - 1);

        if (beforeDate.getTime() > now.getTime()) {
          notifications.push({
            title: 'Investor Payout Tomorrow',
            body: `Monthly return for ${inv.name} is due tomorrow: ${formatPHP(inv.amountPerMonth)}`,
            id: parseInt(`99${idx}1${i}`),
            schedule: { at: beforeDate, allowWhileIdle: true },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: { investorId: inv.id }
          });
        }

        if (actualDate.getTime() > now.getTime()) {
          notifications.push({
            title: 'Investor Payout Today',
            body: `Monthly return for ${inv.name} is due today: ${formatPHP(inv.amountPerMonth)}`,
            id: parseInt(`99${idx}2${i}`),
            schedule: { at: actualDate, allowWhileIdle: true },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: { investorId: inv.id }
          });
        }
      }
      return notifications;
    });

    if (notificationsToSchedule.length > 0) {
      // Sort by date and take the first 30 to avoid OS limits (iOS limit is 64 total per app)
      notificationsToSchedule.sort((a, b) => a.schedule.at.getTime() - b.schedule.at.getTime());
      const limitedNotifications = notificationsToSchedule.slice(0, 30);
      await LocalNotifications.schedule({
        notifications: limitedNotifications
      });
    }
  } catch (e) {
    console.error("Failed to sync reminders:", e);
  }
};

export const syncRentReminders = async (allRecords: Record<string, DebtRecord[]>, tabTypes: Record<string, TabType>) => {
  try {
    const isGranted = await LocalNotifications.requestPermissions();
    if (isGranted.display !== 'granted') return;

    const pending = await LocalNotifications.getPending();
    const rentNotificationIds = pending.notifications
      .filter(n => String(n.id).startsWith('88'))
      .map(n => n.id);
    
    if (rentNotificationIds.length > 0) {
      await LocalNotifications.cancel({ notifications: rentNotificationIds.map(id => ({ id })) });
    }

    const notificationsToSchedule: any[] = [];
    let idx = 0;

    Object.entries(allRecords).forEach(([tabName, records]) => {
      if (tabTypes[tabName] === 'rent') {
        records.forEach(record => {
          if (record.status !== 'finished' && record.status !== 'cancelled' && record.status !== 'deleted') {
            const startDate = new Date(record.date);
            if (!isNaN(startDate.getTime())) {
              const scheduleDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 9, 0, 0);
              
              if (scheduleDate.getTime() > Date.now()) {
                const id = parseInt(`88${idx++}`);
                notificationsToSchedule.push({
                  title: 'Rent Schedule Started',
                  body: `Rent schedule for ${record.name} starts today.`,
                  id: id,
                  schedule: {
                    at: scheduleDate,
                    allowWhileIdle: true
                  },
                  sound: 'default',
                  attachments: [],
                  actionTypeId: '',
                  extra: { recordId: record.id }
                });
              }
            }
          }
        });
      }
    });

    if (notificationsToSchedule.length > 0) {
      // Sort by date and take the first 30 to avoid OS limits
      notificationsToSchedule.sort((a, b) => a.schedule.at.getTime() - b.schedule.at.getTime());
      const limitedNotifications = notificationsToSchedule.slice(0, 30);
      await LocalNotifications.schedule({
        notifications: limitedNotifications
      });
    }
  } catch (e) {
    console.error("Failed to sync rent reminders:", e);
  }
};

/**
 * Formats a number into a specified currency format.
 */
export const formatCurrency = (amount: number, currencyCode: any = 'PHP'): string => {
  const cleanAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
  let validCode = 'PHP';
  if (typeof currencyCode === 'string' && currencyCode.length === 3) {
    validCode = currencyCode.toUpperCase();
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(cleanAmount);
  } catch (e) {
    return `P${cleanAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
};

export const formatPHP = (amount: number): string => {
  return formatCurrency(amount, 'PHP');
};

export const addDays = (dateStr: string, days: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return '';
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  try {
    // Handle YYYY-MM-DD
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const month = parseInt(parts[1]);
      const day = parts[2];
      if (!isNaN(month) && month >= 1 && month <= 12) {
        return `${String(day).padStart(2, '0')}-${months[month - 1]}-${parts[0]}`;
      }
    }
    // Handle other formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
       return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

export const formatDateDayMonth = (dateStr: string): string => {
  if (!dateStr) return '';
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const month = parseInt(parts[1]);
      const day = parts[2];
      if (!isNaN(month) && month >= 1 && month <= 12) {
        return `${String(day).padStart(2, '0')}-${months[month - 1]}`;
      }
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
       return `${String(date.getDate()).padStart(2, '0')}-${months[date.getMonth()]}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

export const formatDateMD = (dateStr: string): string => {
  if (!dateStr) return '';
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      if (!isNaN(month) && month >= 1 && month <= 12) {
        return `${months[month - 1]} ${day}`;
      }
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
       return `${months[date.getMonth()]} ${date.getDate()}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

export const formatDateMedium = (dateStr: string): string => {
  if (!dateStr) return '';
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      if (!isNaN(month) && month >= 1 && month <= 12) {
        return `${months[month - 1]} ${day} ${parts[0]}`;
      }
    }
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
       return `${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()}`;
    }
    return dateStr;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Creates the Report jsPDF object (internal helper)
 */
const createReportDoc = (title: string, subtitle: string, columns: any[], data: any[], summary: any[] = []) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Enterprise Ledger", 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Generated Report", 14, 26);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 36);
  
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    doc.text(subtitle, 14, 42);
    doc.setTextColor(0);
  }

  const tableHead = [columns.map(c => c.header)];
  const tableBody = data.map(row => {
    if (row.isHeader) {
      return [{ content: row.name, colSpan: columns.length, styles: { fontStyle: 'bold', fillColor: [226, 232, 240], textColor: [15, 23, 42] } }];
    }
    return columns.map(c => {
      const val = c.accessor(row);
      return typeof val === 'object' ? String(val) : val;
    });
  });

  autoTable(doc, {
    startY: subtitle ? 48 : 42,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell: function(data) {
      if (data.row.raw && (data.row.raw as any)[0] && (data.row.raw as any)[0].colSpan) {
         data.cell.styles.fontStyle = 'bold';
         data.cell.styles.fillColor = [226, 232, 240];
         data.cell.styles.textColor = [15, 23, 42];
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;
  if (summary && summary.length > 0) {
    let currentY = finalY;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Summary", 14, currentY);
    currentY += 6;
    summary.forEach(item => {
      doc.setFont("helvetica", "normal");
      doc.text(`${item.label}:`, 14, currentY);
      doc.setFont("helvetica", "bold");
      doc.text(item.value, 60, currentY);
      currentY += 6;
    });
  }

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
  }

  return doc;
};

/**
 * Generate a PDF Report using jsPDF (Web Blob URL)
 */
export const generateReportPDF = (title: string, subtitle: string, columns: any[], data: any[], summary: any[] = []): string => {
  const doc = createReportDoc(title, subtitle, columns, data, summary);
  return doc.output('bloburl').toString();
};

/**
 * Generate a PDF Report as Base64 string (Mobile Native)
 */
export const generateReportPDFBase64 = (title: string, subtitle: string, columns: any[], data: any[], summary: any[] = []): string => {
  const doc = createReportDoc(title, subtitle, columns, data, summary);
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1];
};

/**
 * Trims transparent/white pixels from around an image to minimize whitespace.
 */
const trimImage = (base64: string): Promise<string> => {
  if (!base64 || !base64.startsWith('data:image')) return Promise.resolve(base64);
  
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(base64);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const pixels = ctx.getImageData(0, 0, img.width, img.height);
        const l = pixels.data.length;
        let bound = {
          top: null as number | null,
          left: null as number | null,
          right: null as number | null,
          bottom: null as number | null
        };
        let x, y;

        for (let i = 0; i < l; i += 4) {
          const r = pixels.data[i];
          const g = pixels.data[i+1];
          const b = pixels.data[i+2];
          const a = pixels.data[i+3];
          
          // Check if pixel is not transparent AND not white
          const isTransparent = a < 10; // Allow slight transparency
          const isWhite = r > 250 && g > 250 && b > 250;
          
          if (!isTransparent && !isWhite) {
            x = (i / 4) % img.width;
            y = Math.floor((i / 4) / img.width);

            if (bound.top === null || y < bound.top) bound.top = y;
            if (bound.left === null || x < bound.left) bound.left = x;
            if (bound.right === null || x > bound.right) bound.right = x;
            if (bound.bottom === null || y > bound.bottom) bound.bottom = y;
          }
        }

        if (bound.top === null || bound.left === null || bound.right === null || bound.bottom === null) {
          resolve(base64);
          return;
        }

        // Add a small padding (5px) to avoid cutting off edges
        const padding = 5;
        const pTop = Math.max(0, bound.top - padding);
        const pLeft = Math.max(0, bound.left - padding);
        const pBottom = Math.min(img.height - 1, bound.bottom + padding);
        const pRight = Math.min(img.width - 1, bound.right + padding);
        
        const finalWidth = pRight - pLeft + 1;
        const finalHeight = pBottom - pTop + 1;

        const trimmed = ctx.getImageData(pLeft, pTop, finalWidth, finalHeight);

        canvas.width = finalWidth;
        canvas.height = finalHeight;
        ctx.putImageData(trimmed, 0, 0);

        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.error("Error trimming image:", e);
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
};

/**
 * Shared core logic for Contract PDF generation
 * Balanced margins - Symmetrical left and right.
 */
const buildContractDoc = async (title: string, content: string, signatureBase64: string | undefined, signerName: string, dateSigned: string | undefined, metaData: any[] = [], authorizedSigner: string = "", authorizedSignatureImage?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Symmetrical margins
  const margin = 25; 
  const maxLineWidth = pageWidth - (margin * 2);
  const wrapWidth = maxLineWidth; // Symmetrical wrapping
  
  let cursorY = 20; 
  
  doc.setLineHeightFactor(1.35);

  // 1. Header: OFFICIAL AGREEMENT
  doc.setFont("times", "normal");
  doc.setFontSize(8);
  doc.text("OFFICIAL AGREEMENT", pageWidth / 2, cursorY, { align: 'center' });
  cursorY += 2;
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // 2. Main Header: [TITLE] (Underlined)
  const displayTitle = (title || "").toUpperCase().trim();
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text(displayTitle, pageWidth / 2, cursorY, { align: 'center' });
  const titleWidth = doc.getTextWidth(displayTitle);
  doc.setLineWidth(1);
  doc.line(pageWidth / 2 - titleWidth / 2, cursorY + 2, pageWidth / 2 + titleWidth / 2, cursorY + 2);
  
  cursorY += 12;

  // 3. Intro Paragraph
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  
  const isRental = title.toLowerCase().includes('rent');
  const isInvestment = title.toLowerCase().includes('invest');
  
  let roleName = 'Borrower';
  let grantorRole = 'Lender';
  let lenderNameLabel = 'Lender';
  
  if (isRental) {
      roleName = 'Renter';
      grantorRole = 'Operator';
      lenderNameLabel = 'Operator';
  } else if (isInvestment) {
      roleName = 'Investor';
      grantorRole = 'Fund Holder';
      lenderNameLabel = 'Fund Holder';
  }

  const lenderObj = metaData.find(m => m.label.toLowerCase().includes(lenderNameLabel.toLowerCase()) || m.label.toLowerCase().includes('operator') || m.label.toLowerCase().includes('fund holder'));
  const lenderName = lenderObj ? lenderObj.value : (authorizedSigner || "Lmk Corp");

  let introText = "";
  if (isRental) {
      introText = `The undersigned (hereinafter referred to as the "${roleName}") hereby agrees to the terms and conditions for the rental of the vehicle from the ${grantorRole} for the total sum stated in the specifics below.`;
  } else if (isInvestment) {
      introText = `The undersigned (hereinafter referred to as the "${roleName}") hereby agrees to invest the sum stated in the particulars below with the ${grantorRole} under the terms herein.`;
  } else {
      introText = `The undersigned (hereinafter referred to as the "${roleName}") hereby acknowledges receipt of the sum stated in the specifics below from the ${grantorRole} as a financial loan.`;
  }
    
  const introLines = doc.splitTextToSize(introText, wrapWidth);
  doc.text(introLines, margin, cursorY);
  cursorY += (introLines.length * 5) + 4;

  // 4. Boxed Metadata Section
  let boxTitle = 'LOAN SPECIFICS';
  if (isRental) boxTitle = 'RENTAL SPECIFICS';
  else if (isInvestment) boxTitle = 'INVESTMENT PARTICULARS';

  const boxPadding = 5;
  const labelWidth = 50; 
  const valueWidth = maxLineWidth - labelWidth - (boxPadding * 2);
  const rowSpacing = 6; 

  let calculatedRowsHeight = 0;
  const processedRows = metaData.map(item => {
    const lines = doc.splitTextToSize(String(item.value), valueWidth);
    const rowH = Math.max(rowSpacing, lines.length * 5);
    calculatedRowsHeight += rowH;
    return { label: item.label, valueLines: lines, height: rowH };
  });

  const boxY = cursorY;
  const boxHeight = calculatedRowsHeight + boxPadding + 4;
  
  doc.setDrawColor(200);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, boxY, maxLineWidth, boxHeight, 3, 3, 'D');
  
  let boxCursorY = boxY + 7;
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text(boxTitle, margin + boxPadding, boxCursorY);
  boxCursorY += 6;

  processedRows.forEach((row) => {
    doc.setFont("times", "bold");
    doc.text(`${row.label}:`, margin + boxPadding, boxCursorY);
    doc.setFont("times", "normal");
    doc.text(row.valueLines, margin + boxPadding + labelWidth, boxCursorY, { align: 'left' });
    boxCursorY += row.height;
  });

  cursorY += boxHeight + 8; 

  // 5. Affirmation Paragraph
  let affirmation = "";
  if (isRental) {
      affirmation = `I promise to pay the full amount due to the ${grantorRole}. This rental agreement is acknowledged as valid and binding.`;
  } else if (isInvestment) {
      affirmation = `I confirm that I have read and understood the risks and terms. This investment agreement is acknowledged as valid and binding.`;
  } else {
      affirmation = `I promise to pay the full amount due to the ${grantorRole}. This debt is acknowledged as valid and binding.`;
  }
    
  doc.setFont("times", "normal");
  doc.setFontSize(10);
  const affLines = doc.splitTextToSize(affirmation, wrapWidth);
  doc.text(affLines, margin, cursorY);
  cursorY += (affLines.length * 5) + 8;

  // 6. Section Header
  doc.setFont("times", "bold");
  doc.setFontSize(11);
  doc.text("TERMS AND CONDITIONS", margin, cursorY);
  cursorY += 5;

  // 7. Content (Terms Text)
  const sigBlockHeight = 60; 
  const footerReserved = 15;
  const availableSpaceForTerms = pageHeight - cursorY - sigBlockHeight - footerReserved;
  
  doc.setFont("times", "normal");
  let termsFontSize = 9;
  doc.setFontSize(termsFontSize);
  
  const cleanContent = (content || "").replace(/\t/g, '    ');
  let termsLines = doc.splitTextToSize(cleanContent, wrapWidth);
  
  let lineHeightMm = 4.5; 
  let estimatedHeight = termsLines.length * lineHeightMm;
  
  if (estimatedHeight > availableSpaceForTerms) {
    termsFontSize = 8;
    doc.setFontSize(termsFontSize);
    lineHeightMm = 4;
    termsLines = doc.splitTextToSize(cleanContent, wrapWidth);
    estimatedHeight = termsLines.length * lineHeightMm;
    
    if (estimatedHeight > availableSpaceForTerms) {
      termsFontSize = 7;
      doc.setFontSize(termsFontSize);
      lineHeightMm = 3.5;
      termsLines = doc.splitTextToSize(cleanContent, wrapWidth);
      estimatedHeight = termsLines.length * lineHeightMm;
    }
  }

  // 8. Signatures - PRE-RENDER IMAGES (Z-INDEX FIX)
  // We render images first so text and lines can sit on top
  const sigBlockY = pageHeight - 50; 
  const colWidth = maxLineWidth / 2 - 5;
  const centerLeft = margin + (colWidth / 2);
  const centerRight = pageWidth - margin - (colWidth / 2);

  if (authorizedSignatureImage) {
    try { 
      const trimmedAuth = await trimImage(authorizedSignatureImage);
      const props = doc.getImageProperties(trimmedAuth);
      const ratio = props.width / props.height;
      
      let finalWidth = 40;
      let finalHeight = finalWidth / ratio;
      if (finalHeight > 20) {
        finalHeight = 20;
        finalWidth = finalHeight * ratio;
      }
      
      // Align bottom of image to 2mm above the line
      const yPos = (sigBlockY + 15) - finalHeight - 2;
      doc.addImage(trimmedAuth, 'PNG', centerLeft - (finalWidth / 2), yPos, finalWidth, finalHeight, undefined, 'FAST'); 
    } catch (e) {
      console.error("Error adding auth signature:", e);
    }
  }

  if (signatureBase64) {
    try { 
      const trimmedSig = await trimImage(signatureBase64);
      const props = doc.getImageProperties(trimmedSig);
      const ratio = props.width / props.height;
      
      let finalWidth = 40;
      let finalHeight = finalWidth / ratio;
      if (finalHeight > 20) {
        finalHeight = 20;
        finalWidth = finalHeight * ratio;
      }
      
      // Align bottom of image to 2mm above the line
      const yPos = (sigBlockY + 15) - finalHeight - 2;
      doc.addImage(trimmedSig, 'PNG', centerRight - (finalWidth / 2), yPos, finalWidth, finalHeight, undefined, 'FAST'); 
    } catch (e) {
      console.error("Error adding client signature:", e);
    }
  }

  // Now render the Terms Text (will be on top of images if they overlap)
  doc.setFontSize(termsFontSize);
  doc.setTextColor(0);
  doc.text(termsLines, margin, cursorY);
  cursorY += estimatedHeight + 10;

  // 9. Signature Lines and Labels (Topmost layer)
  doc.setDrawColor(0);
  doc.setLineWidth(0.6);

  // Left (Authorized)
  doc.line(margin, sigBlockY + 15, margin + colWidth, sigBlockY + 15);
  doc.setFont("times", "bold");
  doc.setFontSize(9);
  doc.text("AUTHORIZED SIGNATURE", centerLeft, sigBlockY + 20, { align: 'center' });
  doc.setFont("times", "normal");
  const authNameWrap = doc.splitTextToSize((lenderName || "Lmk.Corp").toUpperCase(), colWidth);
  doc.text(authNameWrap, centerLeft, sigBlockY + 25, { align: 'center' });

  // Right (Client/Investor)
  const clientSigLabel = `${roleName.toUpperCase()} SIGNATURE`;
  doc.line(pageWidth - margin - colWidth, sigBlockY + 15, pageWidth - margin, sigBlockY + 15);
  doc.setFont("times", "bold");
  doc.text(clientSigLabel, centerRight, sigBlockY + 20, { align: 'center' });
  doc.setFont("times", "normal");
  const signerNameWrap = doc.splitTextToSize(signerName.toUpperCase(), colWidth);
  doc.text(signerNameWrap, centerRight, sigBlockY + 25, { align: 'center' });
  
  if (dateSigned) {
      doc.setFontSize(6.5);
      doc.setFont("times", "italic");
      doc.text(`Signed: ${dateSigned}`, centerRight, sigBlockY + 34, { align: 'center' });
  }

  // 10. Footer
  doc.setFontSize(7);
  doc.setFont("times", "italic");
  doc.setTextColor(160);
  doc.text("Legally Binding Digital Document - Generated by Nica.Lmk.Corp System", pageWidth / 2, pageHeight - 10, { align: 'center' });

  return doc;
};

export const generateContractPDF = async (title: string, content: string, signatureBase64: string | undefined, signerName: string, dateSigned: string | undefined, metaData: any[] = [], authorizedSigner: string = "", authorizedSignatureImage?: string) => {
  const doc = await buildContractDoc(title, content, signatureBase64, signerName, dateSigned, metaData, authorizedSigner, authorizedSignatureImage);
  const pdfUrl = doc.output('bloburl');
  window.open(pdfUrl, '_blank');
};

/**
 * Returns raw Base64 data for Capacitor sharing
 */
export const generateContractPDFBase64 = async (title: string, content: string, signatureBase64: string | undefined, signerName: string, dateSigned: string | undefined, metaData: any[] = [], authorizedSigner: string = "", authorizedSignatureImage?: string): Promise<string> => {
  const doc = await buildContractDoc(title, content, signatureBase64, signerName, dateSigned, metaData, authorizedSigner, authorizedSignatureImage);
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1];
};

const getCleanFacebookId = (input: string): string | null => {
  if (!input) return null;
  let val = input.trim();
  if (val.includes('m.me/')) {
     const parts = val.split('m.me/');
     if (parts.length > 1) {
        return parts[1].split(/[?&]/)[0].replace(/\/$/, '').trim();
     }
  }
  if (val.includes('facebook.com') || val.includes('fb.com') || val.includes('messenger.com')) {
    const idMatch = val.match(/[?&]id=(\d+)/);
    if (idMatch) return idMatch[1];
    if (val.includes('/people/')) {
        const peopleMatch = val.match(/\/people\/[^/]+\/(\d+)/);
        if (peopleMatch) return peopleMatch[1];
    }
    if (val.includes('/messages/t/')) {
        const parts = val.split('/messages/t/');
        if (parts.length > 1) {
            return parts[1].split(/[?&]/)[0].replace(/\/$/, '').trim();
        }
    }
    let cleanPath = val.replace(/^(https?:\/\/)?([a-zA-Z0-9-]+\.)?(facebook\.com|fb\.com|messenger\.com)\//, '');
    cleanPath = cleanPath.split(/[?&]/)[0].replace(/\/$/, '');
    if (/^\d+$/.test(cleanPath)) return cleanPath;
    const invalidPaths = ['profile.php', 'messages', 'home', 'friends', 'groups', 'watch', 'marketplace', 'gaming', 'pages', 'media', 'people', 'search', 'events', 'bookmarks', 'notifications', 'settings', 'saved', 'stories', 'share', 'reel', 'reels', 'photo', 'video'];
    const firstSegment = cleanPath.split('/')[0].toLowerCase();
    if (firstSegment && !invalidPaths.includes(firstSegment)) {
        return cleanPath.split('/')[0]; 
    }
  }
  if (/^\d+$/.test(val)) return val;
  if (/^[a-zA-Z0-9.]+$/.test(val)) return val;
  return null;
};

export const openFacebook = (input: string) => {
  if (!input) return;
  const val = input.trim();
  if (val.includes('/share/') || val.includes('/reel/')) {
    window.open(val, '_system');
    return;
  }
  const id = getCleanFacebookId(val);
  if (id) {
    const isNumeric = /^\d+$/.test(id);
    const webUrl = isNumeric 
      ? `https://www.facebook.com/profile.php?id=${id}` 
      : `https://www.facebook.com/${id}`;
    window.open(webUrl, '_system');
    return;
  }
  const searchUrl = `https://www.facebook.com/search/top/?q=${encodeURIComponent(val)}`;
  window.open(searchUrl, '_system');
};

export const openMessenger = (input: string) => {
  if (!input) return;
  const id = getCleanFacebookId(input);
  if (id) {
    // Always use m.me for better compatibility across devices and browsers
    window.open(`https://m.me/${id}`, '_system');
  } else {
    window.open('https://m.me/', '_system');
  }
};

export const openSMS = (number: string) => {
  if (!number) return;
  const cleanNumber = number.toString().replace(/\D/g, '');
  window.open(`sms:${cleanNumber}`, '_system');
};