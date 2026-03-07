import React, { useState, useEffect, useMemo, useCallback, useRef, memo, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DebtRecord, AppSettings, TabType, DashboardStats, CurrencyConfig, AppUser, AppSession, HistorySnapshot, Investor, RentBannerSettings } from './types';
import Dashboard from './components/Dashboard';
import RecordForm from './components/RecordForm';
import RecordList from './components/RecordList';
import SettingsModal from './components/SettingsModal';
import TabManager from './components/TabManager';
import ConfirmModal from './components/ConfirmModal';
import TabSettingsModal from './components/TabSettingsModal';
import AddTabModal from './components/AddTabModal';
import HistoryModal from './components/HistoryModal';
import LoadingOverlay from './components/LoadingOverlay';
import SyncOverlay from './components/SyncOverlay';
import ErrorRetryModal from './components/ErrorRetryModal';
import AdjustEarningsModal from './components/AdjustEarningsModal';
import AdjustBankBalanceModal from './components/AdjustBankBalanceModal';
import GlobalCalculationModal from './components/GlobalCalculationModal';
import PasscodeModal from './components/PasscodeModal';
import FinalSummaryModal from './components/FinalSummaryModal';
import RentalSummaryModal from './components/RentalSummaryModal';
import TipsModal from './components/TipsModal';
import CurrencyModal from './components/CurrencyModal';
import UsersModal from './components/UsersModal';
import LoginScreen from './components/LoginScreen';
import UserMenu from './components/UserMenu';
import ChangePasswordModal from './components/ChangePasswordModal';
import AdjustQtyModal from './components/AdjustQtyModal';
import AuthGuard from './components/AuthGuard';
import DualConfirmModal from './components/DualConfirmModal';
import GlobalCopyModal from './components/GlobalCopyModal';
import ContractModal from './components/ContractModal';
import InvestorModal from './components/InvestorModal';
import InvestorContractModal from './components/InvestorContractModal';
import NotificationsModal from './components/NotificationsModal';
import { formatCurrency, addDays, formatDateMD, getTodayStr, formatPHP, syncInvestorReminders, syncRentReminders } from './utils';
import { Capacitor } from '@capacitor/core';

// Icons
const UndoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>;
const RedoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1-1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1-1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l-.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22.39a2 2 0 0 0 .73-2.73l-.15-.08a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>;
const AnimatedCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10.01 1 1-5.93-9.14" className="opacity-40" />
    <path d="M22 4 12 14.01 9 11.01" style={{ strokeDasharray: 24, strokeDashoffset: 24 }} className="animate-[drawCheck_0.6s_cubic-bezier(0.25,1,0.5,1)_forwards]" />
    <style>{`
      @keyframes drawCheck {
        to { stroke-dashoffset: 0; }
      }
    `}</style>
  </svg>
);
const SpinnerIcon = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);
const SuccessIconSolid = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-emerald-500">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
  </svg>
);
const ErrorIconSolid = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-rose-500">
    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75-4.365 9.75-9.75 9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0-1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" />
  </svg>
);
const BellIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>;
const ShieldIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const CloudOffIcon = ({ size = 14 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 2 20 20"/><path d="M6.39 6.39a5 5 0 0 0 7.07 7.07"/><path d="M11.77 6.17a5 5 0 0 1 7.27 4.2"/><path d="M21 16h-4.5"/><path d="M4.5 16H3a5 5 0 0 1 0-10h1.5"/></svg>;
const CloudIcon = ({ size = 14 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19c.1 0 .2 0 .3 0A6 6 10 1 0 12 8.1 5.5 5.5 0 1 0 5.5 19h12z"/></svg>;
const CalculatorIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
    <line x1="8" x2="16" y1="6" y2="6" />
    <line x1="16" x2="16" y1="14" y2="18" />
    <path d="M16 10h.01" />
    <path d="M12 10h.01" />
    <path d="M8 10h.01" />
    <path d="M12 14h.01" />
    <path d="M8 14h.01" />
    <path d="M12 18h.01" />
    <path d="M8 18h.01" />
  </svg>
);
const XCircleIcon = ({ size = 20, className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/>
  </svg>
);
const CopyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>;
const BriefcaseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;

const SYNC_ERROR_MESSAGE = "Syncing Failed!\nPlease check your internet connection\nor ensure your Script URL is correct.";
const createSyncErrorMessage = (action: string) => `       Sync failed!\n  Please check your\n Internet connection\nFailed: ${action}\n PLEASE TRY AGAIN.`;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TabPage = memo(({ 
  tab, tabType, records, spreadsheetUrl, scriptUrl, allRecords, onAdd, onHistory, onEdit, onDelete, onDeleteCycle, onRenew, onKeepReuse, onExtend,
  onUpdateRecord, onLocalCopy, onClearTab, highlightedId, animatingDeleteId,
  onAdjustEarnings, onAdjustBankBalance, addedRecordToCopy, onDismissCopy, formatCopyDetails, showToast, onOpenTips,
  cashFlowFilter, onSetCashFlowFilter, onBulkAdd, currencyConfig, onUpdateCurrencyConfig,
  onAdjustQty, appPin, isMaster, biometricEnabled, settings, session, onLogAction, onOpenContract, investors, pendingDraftIds,
  salesEntryTypeFilter, onSetSalesEntryTypeFilter, onEndSalesCycle, onSaveRentPhoto, rentBannerOpenTab, onRentBannerOpenChange,
  rentBannerSettings, onSaveRentBannerSettings
}: any) => {
  const safeRecords = Array.isArray(records) ? records : [];
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);

  const checkPerm = useCallback((actionId: string) => {
    if (session?.role === 'master') return true;
    const perms = session?.tabPermissions?.[tab];
    if (!perms) return true;
    return perms.includes(actionId);
  }, [session, tab]);

  const handleRestricted = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showToast("Restricted by administrator", "restricted");
  };

  const stats = useMemo(() => {
    const today = getTodayStr();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (tabType === 'business') {
      const sortedBusiness = [...safeRecords].sort((a, b) => {
        const dateDiff = a.date.localeCompare(b.date);
        if (dateDiff !== 0) return dateDiff;
        return (a.id || '').localeCompare(b.id || '');
      });
      const lastEarningIdx = [...sortedBusiness].reverse().findIndex((r: any) => r.businessEntryType === 'earning' && r.status !== 'cancelled');
      const currentCycleRecords = lastEarningIdx === -1 ? sortedBusiness : sortedBusiness.slice(sortedBusiness.length - lastEarningIdx);
      const capitalRecord = currentCycleRecords.find((r: any) => r.businessEntryType === 'capital' && r.status !== 'cancelled');
      const capital = currentCycleRecords.filter((r: any) => r.businessEntryType === 'capital' && r.status !== 'cancelled').reduce((s: number, r: any) => s + r.amount, 0);
      const expenses = currentCycleRecords.filter((r: any) => r.businessEntryType === 'expense' && r.status !== 'cancelled').reduce((s: number, r: any) => s + r.amount, 0);
      const netEarning = currentCycleRecords.filter((r: any) => r.businessEntryType === 'earning' && r.status !== 'cancelled').reduce((s: number, r: any) => s + r.amount, 0);
      const inCycle = currentCycleRecords.some((r: any) => r.businessEntryType === 'capital' && r.status !== 'cancelled');
      return { overdueCount: 0, totalDueAmount: 0, todayDueAmount: 0, tomorrowDueAmount: 0, businessCapital: capital, businessExpenses: expenses, businessNetEarning: netEarning, businessInCycle: inCycle, businessCycleDescription: capitalRecord?.name || (capitalRecord?.remarks === 'Cycle started' ? capitalRecord?.name : capitalRecord?.remarks) };
    } else if (tabType === 'salary') {
      const monthTotal = safeRecords.filter((r: any) => { const d = new Date(r.date); return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear; }).reduce((s: number, r: any) => s + r.amount, 0);
      const yearTotal = safeRecords.filter((r: any) => { const d = new Date(r.date); return d.getFullYear() === currentYear; }).reduce((s: number, r: any) => s + r.amount, 0);
      return { overdueCount: 0, totalDueAmount: 0, todayDueAmount: 0, tomorrowDueAmount: 0, salaryMonthlyTotal: monthTotal, salaryYearlyTotal: yearTotal };
    } else if (tabType === 'rent') {
      const monthRecords = safeRecords.filter((r: any) => { const parts = r.date.split('-'); return parseInt(parts[1]) === currentMonth && parseInt(parts[0]) === currentYear; });
      const yearRecords = safeRecords.filter((r: any) => { const parts = r.date.split('-'); return parseInt(parts[0]) === currentYear; });
      
      const history = Array.isArray(settings.deletedHistory) ? settings.deletedHistory : [];
      const currentYearStr = String(currentYear);
      
      const yearlyFinishedRecords = history.filter((r: any) => 
        r &&
        r.tab === tab && 
        r.status === 'finished' && 
        (r.date && String(r.date).startsWith(currentYearStr))
      );
      
      const calculatedRealized = yearlyFinishedRecords.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
      const yearAmount = calculatedRealized + (settings.earningsAdjustments?.year || 0);
      
      // Calculate monthly overlapping amount
      const monthAmount = monthRecords.reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);

      const yearlyCancelled = history.filter((r: any) => 
        r &&
        r.tab === tab && 
        r.status === 'cancelled' && 
        (r.date && String(r.date).startsWith(currentYearStr))
      ).length;
      
      const yearlyFinished = yearlyFinishedRecords.length;

      return { 
        overdueCount: 0, 
        totalDueAmount: 0, 
        todayDueAmount: 0, 
        tomorrowDueAmount: 0, 
        rentalMonthCount: monthRecords.length, 
        rentalYearCount: yearRecords.length, 
        rentalMonthAmount: monthAmount, 
        rentalYearAmount: yearAmount, 
        rentalYearCancelledCount: yearlyCancelled, 
        rentalYearFinishedCount: yearlyFinished 
      };
    } else if (tabType === 'sales') {
      // Sort records to ensure we find the true latest
      const sorted = [...safeRecords].sort((a, b) => {
         const dateDiff = a.date.localeCompare(b.date);
         if (dateDiff !== 0) return dateDiff;
         return (a.id || '').localeCompare(b.id || '');
      });

      // Find the last cycle start record
      let startRecord = null;
      let lastStartIdx = -1;
      for (let i = sorted.length - 1; i >= 0; i--) {
        const r = sorted[i];
        if (r.salesEntryType === 'cycle_start' || r.remarks === 'Cycle started') {
           startRecord = r;
           lastStartIdx = i;
           break;
        }
      }
      
      // Check if there is a cycle_end record AFTER this startRecord
      let hasEndAfterStart = false;
      if (lastStartIdx !== -1) {
         for (let i = sorted.length - 1; i > lastStartIdx; i--) {
            const r = sorted[i];
            if (r.salesEntryType === 'cycle_end' || r.remarks === 'Cycle ended') {
               hasEndAfterStart = true;
               break;
            }
         }
      }
      
      // Fallback for legacy: Find last 'capital' if no 'cycle_start' found
      if (!startRecord) {
         for (let i = sorted.length - 1; i >= 0; i--) {
            if (sorted[i].salesEntryType === 'capital') {
               startRecord = sorted[i];
               break;
            }
         }
      }

      const effectiveStartRecord = startRecord;

      // Determine if in cycle: record exists, is not finished, and no end record exists after it
      const inCycle = !!effectiveStartRecord && effectiveStartRecord.status !== 'finished' && !hasEndAfterStart;
      
      let currentCycleRecords: any[] = [];
      if (effectiveStartRecord) {
         // We need to find records that belong to this cycle.
         // Since we sorted, we can just take everything after the start record?
         // No, because 'sorted' is a local copy.
         // We should filter records that are >= startRecord.date (and ID > startRecord.id if same date)
         
         currentCycleRecords = safeRecords.filter((r: any) => {
            if (r.id === effectiveStartRecord.id) return true;
            const dateDiff = r.date.localeCompare(effectiveStartRecord.date);
            if (dateDiff > 0) return true;
            if (dateDiff === 0) return (r.id || '').localeCompare(effectiveStartRecord.id || '') > 0;
            return false;
         });
      }
      
      const totalCapital = currentCycleRecords.filter((r: any) => {
        const sType = r.salesEntryType || (r.remarks === 'Cycle started' ? 'cycle_start' : 'sale');
        return sType === 'capital' && r.status !== 'cancelled';
      }).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      
      const totalSales = currentCycleRecords.filter((r: any) => {
        const sType = r.salesEntryType || (r.remarks === 'Cycle started' ? 'cycle_start' : 'sale');
        return sType === 'sale' && r.status !== 'cancelled';
      }).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      
      const totalCancel = currentCycleRecords.filter((r: any) => {
        const sType = r.salesEntryType || (r.remarks === 'Cycle started' ? 'cycle_start' : 'sale');
        return sType === 'sale' && r.status === 'cancelled';
      }).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      
      const totalExpenses = currentCycleRecords.filter((r: any) => {
        const sType = r.salesEntryType || (r.remarks === 'Cycle started' ? 'cycle_start' : 'sale');
        return sType === 'expense' && r.status !== 'cancelled';
      }).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);

      const totalRevenue = totalSales - totalCapital - totalExpenses;
      
      const monthRecords = safeRecords.filter((r: any) => { const d = new Date(r.date); return d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear; });
      const monthlyCapital = monthRecords.filter((r: any) => {
        const sType = r.salesEntryType || (r.remarks === 'Cycle started' ? 'cycle_start' : 'sale');
        return sType === 'capital' && r.status !== 'cancelled';
      }).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      
      const monthlySales = monthRecords.filter((r: any) => {
        const sType = r.salesEntryType || (r.remarks === 'Cycle started' ? 'cycle_start' : 'sale');
        return sType === 'sale' && r.status !== 'cancelled';
      }).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      
      const monthlyCancel = monthRecords.filter((r: any) => {
        const sType = r.salesEntryType || (r.remarks === 'Cycle started' ? 'cycle_start' : 'sale');
        return sType === 'sale' && r.status === 'cancelled';
      }).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      
      const monthlyExpenses = monthRecords.filter((r: any) => {
        const sType = r.salesEntryType || (r.remarks === 'Cycle started' ? 'cycle_start' : 'sale');
        return sType === 'expense' && r.status !== 'cancelled';
      }).reduce((s: number, r: any) => s + (Number(r.amount) || 0), 0);
      
      const monthlyRevenue = monthlySales - monthlyCapital - monthlyExpenses;

      return { 
        overdueCount: 0, 
        totalDueAmount: 0, 
        todayDueAmount: 0, 
        tomorrowDueAmount: 0, 
        salesTotalCapital: totalCapital, 
        salesTotalSales: totalSales, 
        salesTotalCancel: totalCancel, 
        salesTotalRevenue: totalRevenue,
        salesInCycle: inCycle,
        salesCycleDescription: effectiveStartRecord?.name || (effectiveStartRecord?.remarks === 'Cycle started' ? effectiveStartRecord?.name : effectiveStartRecord?.remarks),
        salesMonthlyCapital: monthlyCapital,
        salesMonthlySales: monthlySales,
        salesMonthlyCancel: monthlyCancel,
        salesMonthlyRevenue: monthlyRevenue
      };
    } else if (tabType === 'cashflow') {
      const incoming = safeRecords.filter((r: any) => r.transactionType === 'income').reduce((s: number, r: any) => s + r.amount, 0);
      const outgoing = safeRecords.filter((r: any) => r.transactionType === 'expense').reduce((s: number, r: any) => s + r.amount, 0);
      const initialBalance = settings.cashflowInitialBalances?.[tab] || 0;
      return { overdueCount: 0, totalDueAmount: 0, todayDueAmount: 0, tomorrowDueAmount: 0, cashflowNetBalance: incoming - outgoing, cashflowIncoming: incoming, cashflowOutgoing: outgoing, cashflowInitialBalance: initialBalance, cashflowCurrentBankBalance: initialBalance + (incoming - outgoing) };
    } else if (tabType === 'savings') {
      const income = safeRecords.filter((r: any) => r.transactionType === 'income').reduce((s: number, r: any) => s + r.amount, 0);
      const expenses = safeRecords.filter((r: any) => r.transactionType === 'expense').reduce((s: number, r: any) => s + r.amount, 0);
      const markedExpenses = safeRecords.filter((r: any) => r.transactionType === 'expense' && r.status === 'finished').reduce((s: number, r: any) => s + (r.actualAmount ?? r.amount), 0);
      return { overdueCount: 0, totalDueAmount: 0, todayDueAmount: 0, tomorrowDueAmount: 0, savingsIncome: income, savingsTarget: income - expenses, savingsCurrent: income - markedExpenses, savingsTotalExpenses: expenses };
    } else if (tabType === 'supply' || tabType === 'product') {
      const totalMonetary = safeRecords.reduce((s: number, r: any) => s + (r.amount * (r.price || 0)), 0);
      const totalQuantity = safeRecords.reduce((s: number, r: any) => s + r.amount, 0);
      const underCount = safeRecords.filter((r: any) => r.minAmount !== undefined && r.amount < r.minAmount).length;
      const overCount = safeRecords.filter((r: any) => r.maxAmount !== undefined && r.amount > r.maxAmount).length;
      const base = { overdueCount: 0, totalDueAmount: 0, todayDueAmount: 0, tomorrowDueAmount: 0 };
      return tabType === 'supply' ? { ...base, supplyTotalValue: totalMonetary, supplyActiveCount: safeRecords.length, supplyTotalQuantity: totalQuantity, supplyUnderStockCount: underCount, supplyOverStockCount: overCount } : { ...base, productTotalValue: totalMonetary, productActiveCount: safeRecords.length, productTotalQuantity: totalQuantity, productUnderStockCount: underCount, productOverStockCount: overCount };
    } else {
      const overdue = safeRecords.filter((r: any) => r.date < today);
      const todayRecords = safeRecords.filter((r: any) => r.date === today);
      const tomorrowRecords = safeRecords.filter((r: any) => r.date === addDays(today, 1));
      
      const overdueSum = overdue.reduce((sum: number, r: any) => sum + r.amount, 0);
      const todaySum = todayRecords.reduce((sum: number, r: any) => sum + r.amount, 0);
      
      // User request: Total Due Balance = Overdue + Today
      const totalDueBalance = overdueSum + todaySum;
      
      return { 
        overdueCount: overdue.length + todayRecords.length, 
        totalDueAmount: totalDueBalance, 
        todayDueAmount: todaySum, 
        tomorrowDueAmount: tomorrowRecords.reduce((sum: number, r: any) => sum + r.amount, 0) 
      };
    }
  }, [records, tabType, tab, settings]);

  const formatLabel = useMemo(() => {
    switch (tabType) {
      case 'cashflow': return 'Cash Flow';
      case 'debt': return 'Debt';
      case 'rent': return 'Rent';
      case 'salary': return 'Salary';
      case 'business': return 'Business';
      case 'savings': return 'Savings';
      case 'supply': return 'Supply';
      case 'product': return 'Product';
      case 'sales': return 'Sales';
      default: return tabType ? tabType.charAt(0).toUpperCase() + tabType.slice(1) : '';
    }
  }, [tabType]);

  const accentColorClass = useMemo(() => {
    switch (tabType) {
      case 'business': return 'bg-violet-600';
      case 'savings': return 'bg-amber-50';
      case 'supply': return 'bg-cyan-500';
      case 'product': return 'bg-blue-600';
      case 'rent': return 'bg-indigo-600';
      case 'salary': return 'bg-amber-600';
      case 'cashflow': return 'bg-emerald-600';
      case 'sales': return 'bg-rose-600';
      default: return 'bg-blue-600';
    }
  }, [tabType]);

  return (
    <div className="w-full px-4 space-y-4 flex flex-col gpu-layer pb-40 min-h-full">
      <div className="pt-safe pt-4">
        <h2 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-0.5">Current Section - {formatLabel}</h2>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{tab}</h1>
        <div className={`h-1.5 w-12 rounded-full mt-2 shadow-sm ${accentColorClass}`}></div>
      </div>

      <Dashboard 
        stats={stats} 
        activeTab={tab} 
        records={records} 
        spreadsheetUrl={spreadsheetUrl} 
        activeTabType={tabType} 
        onCopyOverdue={() => onLocalCopy('overdue', tab)} 
        onCopyTomorrow={() => onLocalCopy('tomorrow', tab)} 
        onCopyAll={() => onLocalCopy('all', tab)} 
        onCopyUnderStock={() => onLocalCopy('under', tab)}
        onCopyOverStock={() => onLocalCopy('over', tab)}
        onCopyIncoming={() => onLocalCopy('income', tab)} 
        onCopyOutgoing={() => onLocalCopy('expense', tab)} 
        onAdjustEarnings={checkPerm('adjust_earnings') ? onAdjustEarnings : handleRestricted} 
        onAdjustBankBalance={checkPerm('adjust_bank') ? onAdjustBankBalance : handleRestricted} 
        onClearTab={checkPerm('clear') ? onClearTab : handleRestricted} 
        onOpenTips={onOpenTips}
        currencyConfig={currencyConfig}
        onOpenCurrencyModal={() => setIsCurrencyModalOpen(true)}
        session={session}
        rentTabPhoto={settings.rentTabPhotos?.[tab]}
        onSaveRentPhoto={onSaveRentPhoto}
        rentBannerOpenTab={rentBannerOpenTab}
        onRentBannerOpenChange={onRentBannerOpenChange}
        rentBannerSettings={rentBannerSettings}
        onSaveRentBannerSettings={onSaveRentBannerSettings}
        showToast={showToast}
      />
      
      <div className="flex gap-2">
        <button 
          onClick={() => onAdd(tabType === 'sales' ? { salesEntryType: 'sale' } : undefined)} 
          className={`flex-[2] text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all ${tabType === 'salary' ? 'bg-amber-600' : tabType === 'business' ? 'bg-violet-600' : tabType === 'sales' ? 'bg-rose-600' : tabType === 'savings' ? 'bg-amber-500' : (tabType === 'supply' || tabType === 'product') ? 'bg-cyan-600' : 'bg-blue-600'} ${!checkPerm('add') ? 'opacity-40 grayscale' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg> 
          <span className={`${tabType === 'salary' ? 'text-[13px]' : 'text-sm'} font-black uppercase tracking-tight whitespace-nowrap`}>
            {tabType === 'business' ? (stats.businessInCycle ? 'Add Entry' : 'Start new cycle') : tabType === 'sales' ? 'Add Entry' : tabType === 'cashflow' ? 'Add Transaction' : `Add New ${tabType === 'rent' ? 'Entry' : tabType === 'salary' ? 'Salary Period' : tabType === 'savings' ? 'Fund Item' : (tabType === 'supply' || tabType === 'product') ? 'Stock Item' : 'Record'}`}
          </span>
        </button>
        <button 
          onClick={() => onHistory()} 
          className={`flex-1 bg-white border-2 border-slate-200 text-slate-600 font-bold py-4 px-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all ${!checkPerm('history') ? 'opacity-40 grayscale' : ''}`}
        >
          History
        </button>
      </div>
      
      <section className="space-y-4">
        <RecordList 
          records={records} 
          activeTab={tab} 
          activeTabType={tabType} 
          onAdd={onAdd}
          onEdit={onEdit} 
          onDelete={onDelete} 
          onDeleteCycle={onDeleteCycle}
          animatingDeleteId={animatingDeleteId} 
          highlightedRecordId={highlightedId} 
          onRenew={onRenew} 
          onKeepReuse={onKeepReuse}
          onExtend={onExtend} 
          onUpdateRecord={onUpdateRecord} 
          onBulkAdd={onBulkAdd}
          addedRecordToCopy={addedRecordToCopy} 
          onDismissCopy={onDismissCopy} 
          formatCopyDetails={formatCopyDetails} 
          showToast={showToast}
          cashFlowFilterOverride={cashFlowFilter}
          onSetCashFlowFilter={onSetCashFlowFilter}
          currencyConfig={currencyConfig}
          scriptUrl={scriptUrl}
          allRecords={allRecords}
          onAdjustQty={onAdjustQty}
          appPin={appPin}
          isMaster={isMaster}
          biometricEnabled={biometricEnabled}
          session={session}
          onLogAction={onLogAction}
          onOpenContract={onOpenContract}
          investors={investors}
          history={settings.deletedHistory}
          pendingDraftIds={pendingDraftIds}
          salesEntryTypeFilter={salesEntryTypeFilter}
          onSetSalesEntryTypeFilter={onSetSalesEntryTypeFilter}
        />
      </section>

      <CurrencyModal 
        isOpen={isCurrencyModalOpen} 
        onClose={() => setIsCurrencyModalOpen(false)} 
        config={currencyConfig || { primary: 'PHP', secondary: 'USD', useSecondary: false, exchangeRate: 1 }}
        onUpdate={onUpdateCurrencyConfig}
        activeTabType={tabType}
      />
    </div>
  );
});

const App: React.FC = () => {
  const [session, setSession] = useState<AppSession | null>(() => {
    const savedSession = localStorage.getItem('app_session');
    return savedSession ? JSON.parse(savedSession) : null;
  });

  const isOfflineMode = session?.isOffline || false;
  const storageSuffix = isOfflineMode ? '_personal' : '_enterprise';

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(`app_settings${storageSuffix}`);
    const defaultSettings: AppSettings = { spreadsheetUrl: '', scriptUrl: '', personalScriptUrl: '', appPin: '', deletedHistory: [], tabTypes: { 'Cash loan': 'debt' }, earningsAdjustments: { month: 0, year: 0 }, cashflowInitialBalances: {}, realizedEarnings: 0, copyBullet: '🌸', copyFooter: 'Thank you - Lmk', loadingColor: '#db2777', biometricSensitiveEnabled: true, currencyConfigs: {}, restrictedTabMode: false, unrestrictedTabNames: [], authorizedSignature: '', fundHolderName: '', operatorName: '', lenderName: '', githubPagesUrl: '' };
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const settingsRef = useRef(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const [allRecords, setAllRecords] = useState<Record<string, DebtRecord[]>>(() => {
    const cached = localStorage.getItem(`app_cached_records${storageSuffix}`);
    return cached ? JSON.parse(cached) : {};
  });

  const allRecordsRef = useRef(allRecords);
  useEffect(() => {
    allRecordsRef.current = allRecords;
  }, [allRecords]);

  const [sessionPaidRecordIds, setSessionPaidRecordIds] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('app_session_paid_ids');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('app_session_paid_ids', JSON.stringify(sessionPaidRecordIds));
  }, [sessionPaidRecordIds]);

  const [tabs, setTabs] = useState<string[]>(() => {
    const cached = localStorage.getItem(`app_cached_tabs${storageSuffix}`);
    const parsed = cached ? JSON.parse(cached) : ['Cash loan'];
    return parsed.filter((t: string) => { 
      const low = t.toLowerCase().trim(); 
      return low !== 'history' && 
             low !== 'earnings' && 
             low !== 'users' && 
             low !== 'investors' && 
             low !== 'main ledger' && 
             !low.startsWith('_') && 
             !low.startsWith('report_') &&
             !low.endsWith('report_') &&
             !low.endsWith('report_') &&
             !low.endsWith(' history') &&
             !low.endsWith(' incoming') &&
             !low.endsWith(' outgoing');
    });
  });

  const [users, setUsers] = useState<AppUser[]>([]);
  const [investors, setInvestors] = useState<Investor[]>(() => {
    const cached = localStorage.getItem(`app_cached_investors${storageSuffix}`);
    return cached ? JSON.parse(cached) : [];
  });

  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [isInvestorModalOpen, setIsInvestorModalOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const isMaster = session?.role === 'master';

  // Sync Investor reminders whenever the investor list changes
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      syncInvestorReminders(investors);
    }
  }, [investors]);

  // Sync Rent reminders whenever records or settings change
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      syncRentReminders(allRecords, settings.tabTypes);
    }
  }, [allRecords, settings.tabTypes]);

  const checkTabPermission = useCallback((tab: string, actionId: string) => {
    if (isMaster) return true;
    const perms = session?.tabPermissions?.[tab];
    if (!perms) return true;
    return perms.includes(actionId);
  }, [isMaster, session]);

  const visibleTabs = useMemo(() => {
    if (session?.role === 'user' && session.allowedTabs) {
      const allowed = Array.isArray(session.allowedTabs) 
        ? session.allowedTabs.filter(t => typeof t === 'string' && t.trim().length > 0)
        : [];
      if (allowed.length === 0) return tabs;
      return tabs.filter(t => allowed.includes(t));
    }
    if (settings.restrictedTabMode && settings.unrestrictedTabNames && settings.unrestrictedTabNames.length > 0) {
      const allowed = tabs.filter(t => settings.unrestrictedTabNames?.includes(t));
      if (allowed.length > 0) return allowed;
    }
    return tabs;
  }, [tabs, settings.restrictedTabMode, settings.unrestrictedTabNames, session]);

  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(`app_active_tab${storageSuffix}`);
    const cachedTabs = tabs;
    return saved && cachedTabs.includes(saved) ? saved : (tabs[0] || 'Cash loan');
  });

  const containerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const slideContainerRef = useRef<HTMLDivElement>(null);
  
  const prevTabNameRef = useRef(activeTab);
  const activeTabRef = useRef(activeTab);
  
  useEffect(() => {
    if (prevTabNameRef.current !== activeTab) {
      const oldTab = prevTabNameRef.current;
      const timer = setTimeout(() => {
        const container = containerRefs.current[oldTab];
        if (container) {
          container.scrollTop = 0;
        }
      }, 450);
      prevTabNameRef.current = activeTab;
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [visibleTabs, activeTab]);

  const [isFormOpen, setIsFormOpen] = useState(() => localStorage.getItem('app_is_form_open') === 'true');
  const [editingRecord, setEditingRecord] = useState<DebtRecord | null>(() => {
    const saved = localStorage.getItem('app_editing_record');
    return saved ? JSON.parse(saved) : null;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isAdjustBankModalOpen, setIsAdjustBankModalOpen] = useState(false);
  const [isGlobalCalculationOpen, setIsGlobalCalculationOpen] = useState(false);
  const [isGlobalCopyModalOpen, setIsGlobalCopyModalOpen] = useState(false);
  const [contractRecord, setContractRecord] = useState<DebtRecord | null>(null);
  const [investorContractToView, setInvestorContractToView] = useState<Investor | null>(null);
  const [pendingDraftIds, setPendingDraftIds] = useState<string[]>([]);
  
  const [passcodeContext, setPasscodeContext] = useState<{ 
    action: 'clear' | 'deleteTab' | 'addRecord' | 'editRecord' | 'deleteRecord' | 'adjustQty' | 'toggleRestriction' | 'openUsers' | 'push' | 'pull' | 'setupPersonalCloud' | 'deleteCycle'; 
    targetTab?: string;
    data?: any;
    nextAction?: 'push' | 'pull';
  } | null>(null);
  const [isPasscodeModalOpen, setIsPasscodeModalOpen] = useState(false);
  
  const [finalSummaryData, setFinalSummaryData] = useState<{ name: string; historyRecords: DebtRecord[]; activeTab: string; scrubInfo?: { name: string; keepId: string; tab: string } } | null>(null);
  const [rentalSummaryData, setRentalSummaryData] = useState<{ tab: string; records: DebtRecord[]; total: number } | null>(null);
  const [isTipsOpen, setIsTipsOpen] = useState(false);

  const [adjustBankMode, setAdjustBankMode] = useState<'overwrite' | 'adjust'>('overwrite');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [deletingRecordData, setDeletingRecordData] = useState<{ id: string, status?: 'finished' | 'cancelled' | 'deleted' } | null>(null);
  const [deletingCycleData, setDeletingCycleData] = useState<{ cycleId: string, entryIds: string[] } | null>(null);
  const [extendingRecordData, setExtendingRecordData] = useState<DebtRecord | null>(null);
  const [animatingDeleteId, setAnimatingDeleteId] = useState<string | null>(null);
  const [highlightedRecordId, setHighlightedRecordId] = useState<string | null>(null);
  const [deletingTabName, setDeletingTabName] = useState<string | null>(null);
  const [clearingTabName, setClearingTabName] = useState<string | null>(null);
  const [tabToEdit, setTabToEdit] = useState<{name: string, type: TabType} | null>(null);
  const [isAddTabModalOpen, setIsAddTabModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingPasscode, setIsCheckingPasscode] = useState(false);
  const [refreshIsBlocking, setRefreshIsBlocking] = useState(true); 
  const [isInitialLoad, setIsInitialLoad] = useState(!!session);
  const [isPerformingUndo, setIsPerformingUndo] = useState(false);
  const lastUndoRedoTimestamp = useRef<number>(0);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  
  const [adjustingQtyRecord, setAdjustingQtyRecord] = useState<DebtRecord | null>(null);
  const [adjustQtyDualConfirmRecord, setAdjustQtyDualConfirmRecord] = useState<DebtRecord | null>(null);

  const [pendingSyncAction, setPendingSyncAction] = useState<(() => Promise<void>) | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState("");

  const [past, setPast] = useState<HistorySnapshot[]>([]);
  const [future, setFuture] = useState<HistorySnapshot[]>([]);
  const [historyScrubQueue, setHistoryScrubQueue] = useState<string[]>([]);
  
  const [lastDashboardInteraction, setLastDashboardInteraction] = useState(Date.now());

  const [toast, setToast] = useState<{ visible: boolean; leaving: boolean; message: string; type?: 'success' | 'error' | 'restricted' }>({ visible: false, leaving: false, message: '', type: 'success' });
  const [addedRecordToCopy, setAddedRecordToCopy] = useState<{name: string, tab: string, items: DebtRecord[], type: TabType} | null>(null);

  const [cashFlowFilter, setCashFlowFilter] = useState<'income' | 'expense'>('income');
  const [salesEntryTypeFilter, setSalesEntryTypeFilter] = useState<'sale' | 'capital'>('sale');
  const [rentBannerOpenTab, setRentBannerOpenTab] = useState<string | null>(null);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const gestureType = useRef<'none' | 'horizontal' | 'vertical' | 'scrolling' | 'refreshing' | 'bottom-stretch'>('none');
  const hasInitialSynced = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const toastTimerRef = useRef<number | null>(null);
  const toastExitRef = useRef<number | null>(null);

  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);

  // Pull to refresh state
  const [pullDistance, setPullDistance] = useState(0);
  const REFRESH_THRESHOLD = 80;

  const uiStateRef = useRef({
    isFormOpen, isSettingsOpen, isHistoryOpen, isExitConfirmOpen, editingRecord,
    isAdjustModalOpen, isAdjustBankModalOpen, isGlobalCalculationOpen, isPasscodeModalOpen,
    isUsersModalOpen, isTipsOpen, isAddTabModalOpen, finalSummaryData, rentalSummaryData,
    activeTab, visibleTabs, session, tabToEdit, isChangePasswordOpen, adjustingQtyRecord,
    extendingRecordData, adjustQtyDualConfirmRecord, isGlobalCopyModalOpen, contractRecord, 
    isInvestorModalOpen, isNotificationsOpen, investorContractToView
  });

  useEffect(() => {
    uiStateRef.current = {
      isFormOpen, isSettingsOpen, isHistoryOpen, isExitConfirmOpen, editingRecord,
      isAdjustModalOpen, isAdjustBankModalOpen, isGlobalCalculationOpen, isPasscodeModalOpen,
      isUsersModalOpen, isTipsOpen, isAddTabModalOpen, finalSummaryData, rentalSummaryData,
      activeTab, visibleTabs, session, tabToEdit, isChangePasswordOpen, adjustingQtyRecord,
      extendingRecordData, adjustQtyDualConfirmRecord, isGlobalCopyModalOpen, contractRecord, 
      isInvestorModalOpen, isNotificationsOpen, investorContractToView
    };
  }, [
    isFormOpen, isSettingsOpen, isHistoryOpen, isExitConfirmOpen, editingRecord,
    isAdjustModalOpen, isAdjustBankModalOpen, isGlobalCalculationOpen, isPasscodeModalOpen,
    isUsersModalOpen, isTipsOpen, isAddTabModalOpen, finalSummaryData, rentalSummaryData,
    activeTab, visibleTabs, session, tabToEdit, isChangePasswordOpen, adjustingQtyRecord,
    extendingRecordData, adjustQtyDualConfirmRecord, isGlobalCopyModalOpen, contractRecord, 
    isInvestorModalOpen, isNotificationsOpen, investorContractToView
  ]);

  useEffect(() => {
    let backListener: any = null;
    const setupBackButton = async () => {
      // Use Capacitor Core from imports
      if (!Capacitor.isNativePlatform()) return;

      const { App: CapApp } = await import('@capacitor/app');
      
      backListener = await CapApp.addListener('backButton', () => {
        const s = uiStateRef.current;
        if (s.isFormOpen) setIsFormOpen(false);
        else if (s.editingRecord) setEditingRecord(null);
        else if (s.isPasscodeModalOpen) setIsPasscodeModalOpen(false);
        else if (s.isGlobalCopyModalOpen) setIsGlobalCopyModalOpen(false);
        else if (s.isSettingsOpen) setIsSettingsOpen(false);
        else if (s.isHistoryOpen) setIsHistoryOpen(false);
        else if (s.isNotificationsOpen) setIsNotificationsOpen(false);
        else if (s.isAdjustModalOpen) setIsAdjustModalOpen(false);
        else if (s.isAdjustBankModalOpen) setIsAdjustBankModalOpen(false);
        else if (s.isGlobalCalculationOpen) setIsGlobalCalculationOpen(false);
        else if (s.isUsersModalOpen) setIsUsersModalOpen(false);
        else if (s.isInvestorModalOpen) setIsInvestorModalOpen(false);
        else if (s.isTipsOpen) setIsTipsOpen(false);
        else if (s.isAddTabModalOpen) setIsAddTabModalOpen(false);
        else if (s.tabToEdit) setTabToEdit(null);
        else if (s.isChangePasswordOpen) setIsChangePasswordOpen(false);
        else if (s.adjustingQtyRecord) setAdjustingQtyRecord(null);
        else if (s.adjustQtyDualConfirmRecord) setAdjustQtyDualConfirmRecord(null);
        else if (s.finalSummaryData) setFinalSummaryData(null);
        else if (s.rentalSummaryData) setRentalSummaryData(null);
        else if (s.extendingRecordData) setExtendingRecordData(null);
        else if (s.contractRecord) setContractRecord(null);
        else if (s.investorContractToView) setInvestorContractToView(null);
        else if (s.isExitConfirmOpen) setIsExitConfirmOpen(false);
        else if (s.activeTab === s.visibleTabs[0]) {
          setIsExitConfirmOpen(true);
        } else {
          setActiveTab(s.visibleTabs[0]);
        }
      });
    };

    setupBackButton();
    return () => { if (backListener) backListener.remove(); };
  }, []);

  useEffect(() => { localStorage.setItem(`app_active_tab${storageSuffix}`, activeTab); }, [activeTab, storageSuffix]);
  useEffect(() => { localStorage.setItem('app_is_form_open', String(isFormOpen)); }, [isFormOpen]);
  useEffect(() => { localStorage.setItem('app_editing_record', JSON.stringify(editingRecord)); }, [editingRecord]);
  useEffect(() => { localStorage.setItem(`app_cached_records${storageSuffix}`, JSON.stringify(allRecords)); }, [allRecords, storageSuffix]);
  useEffect(() => { localStorage.setItem(`app_cached_tabs${storageSuffix}`, JSON.stringify(tabs)); }, [tabs, storageSuffix]);
  useEffect(() => { localStorage.setItem(`app_settings${storageSuffix}`, JSON.stringify(settings)); }, [settings, storageSuffix]);
  useEffect(() => { localStorage.setItem(`app_cached_investors${storageSuffix}`, JSON.stringify(investors)); }, [investors, storageSuffix]);

  useEffect(() => { setHighlightedRecordId(null); }, [activeTab]);

  const allSignedRecords = useMemo(() => {
    const signed: DebtRecord[] = [];
    Object.entries(allRecords).forEach(([tabName, tabRecords]) => {
      if (!tabRecords || !Array.isArray(tabRecords)) return;
      tabRecords.forEach(r => {
        if (r && r.signature) {
           signed.push({ ...r, tab: r.tab || tabName });
        }
      });
    });

    // Add investors who have signed - ONLY IF MASTER USER (Online)
    if (session?.role === 'master') {
      investors.forEach(inv => {
        if (inv.signature) {
          signed.push({
            id: inv.id,
            name: inv.name,
            amount: inv.amount,
            date: inv.dateInvested, 
            remarks: 'Investment Contract',
            tab: 'Investment', 
            signature: inv.signature,
            signatureDate: inv.signatureDate,
            status: 'active'
          } as DebtRecord);
        }
      });
    }

    return signed.sort((a, b) => (b.signatureDate || b.date || '').localeCompare(a.signatureDate || a.date || ''));
  }, [allRecords, investors, session]);

  const filteredGlobalHistory = useCallback((incomingHistory: DebtRecord[]) => {
    let filtered = incomingHistory;
    if (historyScrubQueue.length > 0) {
      const queueNames = historyScrubQueue.map(n => n.toLowerCase().trim());
      filtered = filtered.filter(r => !queueNames.includes(r.name?.toLowerCase().trim()));
    }
    filtered = filtered.filter(r => {
      const type = settings.tabTypes[r.tab || ''] || 'debt';
      return type === 'debt' || type === 'rent';
    });
    return filtered;
  }, [historyScrubQueue, settings.tabTypes]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'restricted' = 'success') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (toastExitRef.current) window.clearTimeout(toastExitRef.current);
    setToast({ visible: true, leaving: false, message, type });
    toastExitRef.current = window.setTimeout(() => {
      setToast(prev => ({ ...prev, leaving: true }));
      toastTimerRef.current = window.setTimeout(() => {
        setToast({ visible: false, leaving: false, message: '', type: 'success' });
      }, 300);
    }, 3000);
  }, []);

  const syncGlobalMetricsInBackground = useCallback(async () => {
    const currentSettings = settingsRef.current;
    const activeUrl = isOfflineMode ? currentSettings.personalScriptUrl : currentSettings.scriptUrl;
    if (!activeUrl) return;
    const currentRecords = allRecordsRef.current;
    const todayStr = getTodayStr();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const currentYearStr = String(currentYear);
    const rentTabs = tabs.filter(t => (currentSettings.tabTypes[t] || 'debt') === 'rent');
    const historyList = Array.isArray(currentSettings.deletedHistory) ? currentSettings.deletedHistory : [];
    const calculatedRentEarnings = historyList.reduce((acc: number, r: DebtRecord) => {
        if (r.status === 'finished' && r.date && r.date.startsWith(currentYearStr)) {
             if (rentTabs.includes(r.tab || '')) {
                 return acc + (Number(r.amount) || 0);
             }
        }
        return acc;
    }, 0);
    let globalDebt = { overdue: 0, today: 0, total: 0 };
    let globalRent = { 
        monthSchedule: 0, 
        yearSchedule: 0, 
        yearEarnings: calculatedRentEarnings + (currentSettings.earningsAdjustments?.year || 0) 
    };
    let globalFlow = { incoming: 0, outgoing: 0, net: 0, current: 0 };
    let globalBusiness = { tabs: 0, capital: 0, expenses: 0, lossCount: 0, lossAmount: 0, profitAmount: 0, net: 0 };
    let globalSales = { capital: 0, sales: 0, cancel: 0, expenses: 0, revenue: 0 };
    tabs.forEach(tabName => {
      const type = currentSettings.tabTypes[tabName] || 'debt';
      const records = currentRecords[tabName] || [];
      if (type === 'debt') {
        records.forEach(r => { 
            const amt = Number(r.amount) || 0;
            globalDebt.total += amt; 
            if (r.date < todayStr) globalDebt.overdue += amt; 
            else if (r.date === todayStr) globalDebt.today += amt; 
        });
      } else if (type === 'rent') {
        records.forEach(r => { 
            if (!r.date) return;
            const parts = r.date.split('-');
            if (parts.length >= 2) {
                const rYear = parseInt(parts[0]);
                const rMonth = parseInt(parts[1]);
                if (rYear === currentYear) globalRent.yearSchedule++; 
                if (rMonth === currentMonth && rYear === currentYear) globalRent.monthSchedule++; 
            }
        });
      } else if (type === 'cashflow') {
        const initial = currentSettings.cashflowInitialBalances?.[tabName] || 0;
        let tin = 0, tout = 0;
        records.forEach(r => { 
            const amt = Number(r.amount) || 0;
            if (r.transactionType === 'income') tin += amt; 
            else if (r.transactionType === 'expense') tout += amt; 
        });
        globalFlow.incoming += tin; globalFlow.outgoing += tout; globalFlow.net += (tin - tout); globalFlow.current += (initial + tin - tout);
      } else if (type === 'business') {
        globalBusiness.tabs++;
        records.forEach(r => {
          const amt = Number(r.amount) || 0;
          if (r.businessEntryType === 'capital') globalBusiness.capital += amt;
          else if (r.businessEntryType === 'expense') globalBusiness.expenses += amt;
          else if (r.businessEntryType === 'earning') {
            if (amt < 0) {
              globalBusiness.lossCount++;
              globalBusiness.lossAmount += Math.abs(amt);
            } else {
              globalBusiness.profitAmount += amt;
            }
            globalBusiness.net += amt;
          }
        });
      } else if (type === 'sales') {
        records.forEach(r => {
          const sType = r.salesEntryType || (r.transactionType === 'expense' ? 'expense' : (r.remarks === 'Cycle started' ? 'cycle_start' : (r.name.toLowerCase().includes('capital') ? 'capital' : 'sale')));
          const amt = Number(r.amount) || 0;
          if (sType === 'capital') {
            if (r.status !== 'cancelled') globalSales.capital += amt;
          } else if (sType === 'sale') {
            if (r.status === 'finished') globalSales.sales += amt;
            else if (r.status === 'cancelled') globalSales.cancel += amt;
          } else if (sType === 'expense' || r.transactionType === 'expense') {
            if (r.status !== 'cancelled') globalSales.expenses += amt;
          }
        });
      }
    });
    globalSales.revenue = globalSales.sales - globalSales.capital - globalSales.expenses;
    try {
      await fetch(activeUrl, {
        method: 'POST',
        body: JSON.stringify({ 
          action: 'saveGlobalMetrics', 
          metrics: { debt: globalDebt, rent: globalRent, flow: globalFlow, business: globalBusiness, sales: globalSales } 
        })
      });
    } catch (e) { console.warn("Background metric sync failed", e); }
  }, [tabs, isOfflineMode]);

  const handleDeleteInvestor = async (id: string) => {
    setInvestors(prev => prev.filter(inv => inv.id !== id));
    const activeUrl = isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl;
    if (!activeUrl) {
        showToast("Investor Removed (Local)");
        return;
    }
    
    setIsRefreshing(true); 
    setRefreshIsBlocking(false);
    
    try {
      await fetch(activeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteRecord', tab: 'Investors', id: id })
      });
      showToast("Investor Removed");
    } catch (e: any) {
      // Rollback
      setInvestors(prev => [...prev, investors.find(inv => inv.id === id)].filter(Boolean) as Investor[]);
      showToast("Sync Error: " + e.message, "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleUpdateContractDetails = useCallback(async (id: string, details: { term: string, period: string, amountPerDue: string }) => {
    const tabName = activeTabRef.current;
    
    // 1. Update local state immediately
    setAllRecords(prev => {
        const tabRecs = prev[tabName] || [];
        const updated = tabRecs.map(r => r.id === id ? { 
            ...r, 
            contractTerm: Number(details.term), 
            contractPeriod: details.period as any, 
            contractAmountPerDue: Number(details.amountPerDue) 
        } : r);
        return { ...prev, [tabName]: updated };
    });

    const activeUrl = isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl;
    if (!activeUrl) {
        showToast("Contract Details Saved (Local)");
        return;
    }

    // 2. Sync to cloud
    setIsRefreshing(true);
    setRefreshIsBlocking(true);
    try {
        await fetch(activeUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'updateSignatureDetails',
                id: id,
                term: details.term,
                period: details.period,
                amountPerDue: details.amountPerDue
            })
        });
        showToast("Contract Details Synced");
    } catch (e: any) {
        showToast("Failed to sync details: " + e.message, "error");
    } finally {
        setIsRefreshing(false);
    }
  }, [isOfflineMode, settings.scriptUrl, settings.personalScriptUrl, showToast]);

  const handleCleanupHistory = useCallback(async (name: string, exceptId: string, tab: string) => {
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;
    
    // Update local history: scrub all entries for this person in this tab, keep exactly one as 'legacy'
    setSettings(prev => {
        const targetName = name.toLowerCase().trim();
        // Remove ALL records for this person in this tab
        const others = prev.deletedHistory.filter(r => 
            !(r.name?.toLowerCase().trim() === targetName && r.tab === tab)
        );
        // Find the record we intend to use for reuse
        const source = prev.deletedHistory.find(r => r.id === exceptId);
        const legacyKept = source ? [{ ...source, status: 'legacy' as const, tab }] : [];
        return {
            ...prev,
            deletedHistory: [...others, ...legacyKept]
        };
    });

    if (!activeUrl) return;
    const targetName = name.toLowerCase().trim();
    setHistoryScrubQueue(prev => [...prev, targetName]);
    try {
        // Step 1: Tell cloud to scrub others. 
        await fetch(activeUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'scrubPersonFromHistory', name: name, tab: tab, exceptId: exceptId })
        });
        
        // Step 2: Update the remaining record in cloud to have 'legacy' status
        const sourceRecord = settings.deletedHistory.find(r => r.id === exceptId);
        if (sourceRecord) {
            const legacyRecord = { ...sourceRecord, status: 'legacy' as const, tab };
            await fetch(activeUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'updateRecord',
                    tab: 'history',
                    record: legacyRecord
                })
            });
        }
        
        showToast("Settled cycle moved to archive");
    } catch (e) { 
        console.error("Cloud history cleanup failed", e); 
    } finally { 
        setTimeout(() => { setHistoryScrubQueue(prev => prev.filter(n => n !== targetName)); }, 3000); 
  }
  }, [isOfflineMode, settings.scriptUrl, settings.deletedHistory, showToast]);

  const handleManualHistoryDelete = useCallback(async (record: DebtRecord, scrubPerson: boolean) => {
    const name = record.name;
    const personNameLower = name.toLowerCase().trim();
    setSettings(prev => ({
        ...prev,
        deletedHistory: prev.deletedHistory.filter(r => r.name?.toLowerCase().trim() !== personNameLower)
    }));
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;
    if (!activeUrl) { showToast(`History cleared for ${name}`); return; }
    if (scrubPerson) {
        try {
            await fetch(activeUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'scrubPersonFromHistory', name: name, tab: "", exceptId: '' })
            });
            showToast(`History cleared for ${name}`);
            if (!isOfflineMode) setTimeout(syncGlobalMetricsInBackground, 1000);
        } catch (e) { showToast("Failed to delete history", "error"); }
    }
  }, [settings.scriptUrl, showToast, isOfflineMode, syncGlobalMetricsInBackground]);

  const handleLogAction = useCallback((log: DebtRecord, action: 'update' | 'delete', tabName: string) => {
    setAllRecords(prev => {
      const list = prev[tabName] || [];
      const newList = action === 'delete' ? list.filter(r => r.id !== log.id) : list.map(r => r.id === log.id ? log : r);
      return { ...prev, [tabName]: newList };
    });
    showToast(action === 'delete' ? "Log Entry Removed" : "Log Entry Updated");
  }, [showToast]);

  const handleAddInvestor = async (investor: Investor) => {
    const activeUrl = isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl;
    
    // Optimistic Update
    setInvestors(prev => [...prev, investor]);
    
    if (!activeUrl) { showToast("Investor Added (Local Only)"); return; }
    
    setIsRefreshing(true); 
    setRefreshIsBlocking(false); 
    
    try {
        const response = await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'addInvestor', investor }) });
        const data = await response.json();
        if (data.status === 'success') {
            if (data.investors) setInvestors(data.investors);
            showToast("Investor Added & Synced");
        } else { throw new Error(data.message); }
    } catch (e: any) { 
        // Rollback
        setInvestors(prev => prev.filter(inv => inv.id !== investor.id));
        showToast("Failed to add investor: " + e.message, "error"); 
    } 
    finally { setIsRefreshing(false); }
  };

  const handleUpdateInvestor = async (investor: Investor) => {
    const activeUrl = isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl;
    // Optimistic Update
    const previousInvestors = [...investors];
    setInvestors(prev => prev.map(inv => inv.id === investor.id ? investor : inv));
    
    if (!activeUrl) {
      showToast("Investor Updated (Local Only)");
      return;
    }

    setIsRefreshing(true); 
    setRefreshIsBlocking(false);
    
    try {
      const response = await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'updateInvestor', investor }) });
      const data = await response.json();
      if (data.status === 'success') {
          showToast("Investor Updated & Synced");
      } else { 
          throw new Error(data.message || "Failed to update cloud"); 
      }
    } catch (e: any) { 
        // Rollback
        setInvestors(previousInvestors);
        showToast("Update Failed: " + e.message, "error"); 
    } finally {
        setIsRefreshing(false);
    }
  };

  const handleDeleteSignature = useCallback(async (id: string, type: 'record' | 'investor', tabName?: string) => {
    setIsRefreshing(true);
    setRefreshIsBlocking(true);
    
    try {
      // 1. Local Update
      if (type === 'record' && tabName) {
        setAllRecords(prev => {
          const tabRecs = prev[tabName] || [];
          return {
            ...prev,
            [tabName]: tabRecs.map(r => r.id === id ? { 
                ...r, 
                signature: undefined, 
                signatureDate: undefined, 
                signerName: undefined, 
                signerAddress: undefined,
                contractTerm: undefined,
                contractPeriod: undefined,
                contractAmountPerDue: undefined
            } : r)
          };
        });
      } else if (type === 'investor') {
        setInvestors(prev => prev.map(inv => inv.id === id ? { ...inv, signature: undefined, signatureDate: undefined } : inv));
      }

      // 2. Cloud Update
      const activeUrl = isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl;
      if (activeUrl) {
        const response = await fetch(activeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteRecord', tab: 'Signatures', id: id })
        });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message);
      }
      
      showToast("Digital Signature Removed");
    } catch (e: any) {
      showToast("Sync Error: " + e.message, "error");
    } finally {
      setIsRefreshing(false);
    }
  }, [isOfflineMode, settings.scriptUrl, settings.personalScriptUrl, showToast]);

  const fetchAllData = useCallback(async (silent = false, fullSync = false, targetTabOverride?: string, customScriptUrl?: string) => {
    const endpoint = customScriptUrl || (isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl);
    if (isOfflineMode && !endpoint) {
      if (!hasInitialSynced.current) { setIsRefreshing(true); setRefreshIsBlocking(true); await new Promise(r => setTimeout(r, 3000)); setIsInitialLoad(false); }
      if (!silent) setIsRefreshing(false);
      return null;
    }
    if (!silent) {
      setIsRefreshing(true); setRefreshIsBlocking(true);
      setToast({ visible: true, leaving: false, message: isOfflineMode ? "Connecting Personal Cloud..." : "Syncing Ledger...", type: 'success' });
    }
    if (isPerformingUndo || (Date.now() - lastUndoRedoTimestamp.current < 5000)) { if (!silent) setIsRefreshing(false); return; } 
    if (!endpoint || !endpoint.startsWith('http')) { setIsInitialLoad(false); if (!silent) setIsRefreshing(false); return; }
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const currentTab = targetTabOverride || activeTabRef.current;
    try {
      const urlParams = new URLSearchParams();
      if (currentTab) urlParams.append('tab', currentTab);
      if (fullSync) urlParams.append('full', 'true');
      
      const response = await fetch(`${endpoint}?${urlParams.toString()}`, { signal: abortControllerRef.current.signal, cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
      const data = await response.json();
      if (data.status === 'error') throw new Error(data.message || "Cloud Engine Error");
      if (data.tabs) {
        setTabs(data.tabs.filter((t: string) => { 
          const low = t.toLowerCase().trim(); 
          return low !== 'history' && low !== 'earnings' && low !== 'users' && low !== 'investors' && low !== 'main ledger' && !low.startsWith('_') && !low.startsWith('report_') && !low.endsWith('report_') && !low.endsWith('report_') && !low.endsWith(' history') && !low.endsWith(' incoming') && !low.endsWith(' outgoing');
        }));
      }
      if (data.tabTypes) setSettings(prev => ({...prev, tabTypes: { ...prev.tabTypes, ...data.tabTypes }}));
      if (data.earningsAdjustments) setSettings(prev => ({ ...prev, earningsAdjustments: data.earningsAdjustments }));
      if (data.realizedEarnings !== undefined) setSettings(prev => ({ ...prev, realizedEarnings: data.realizedEarnings }));
      if (data.globalHistory) setSettings(prev => ({ ...prev, deletedHistory: filteredGlobalHistory(data.globalHistory) }));
      if (data.cashflowInitialBalances) setSettings(prev => ({ ...prev, cashflowInitialBalances: data.cashflowInitialBalances }));
      if (data.currencyConfigs) setSettings(prev => ({ ...prev, currencyConfigs: data.currencyConfigs }));
      if (data.rentTabPhotos) setSettings(prev => ({ ...prev, rentTabPhotos: data.rentTabPhotos }));
      if (data.rentBannerSettings) setSettings(prev => ({ ...prev, rentBannerSettings: data.rentBannerSettings }));
      if (data.appPin) setSettings(prev => ({ ...prev, appPin: data.appPin }));
      if (data.authorizedSignature !== undefined) setSettings(prev => ({ ...prev, authorizedSignature: data.authorizedSignature }));
      if (data.fundHolderName !== undefined) setSettings(prev => ({ ...prev, fundHolderName: data.fundHolderName }));
      if (data.operatorName !== undefined) setSettings(prev => ({ ...prev, operatorName: data.operatorName }));
      if (data.lenderName !== undefined) setSettings(prev => ({ ...prev, lenderName: data.lenderName }));
      if (data.githubPagesUrl !== undefined) setSettings(prev => ({ ...prev, githubPagesUrl: data.githubPagesUrl }));
      if (data.pendingDraftIds) setPendingDraftIds(data.pendingDraftIds);
      if (!isOfflineMode && data.users) setUsers(data.users);
      
      let incomingInvestors = data.investors || [];
      let incomingRecords = data.allRecords || data.data; // Support data.data fallback

      // Handle double-encoded JSON
      if (typeof incomingRecords === 'string') {
        try { incomingRecords = JSON.parse(incomingRecords); } catch (e) { console.warn("Failed to parse allRecords string", e); }
      }

      if (!incomingRecords) {
        if (data.records) {
           // If records is an object and not an array, treat it as allRecords map
           if (!Array.isArray(data.records) && typeof data.records === 'object') {
             incomingRecords = data.records;
           } else {
             incomingRecords = {[currentTab]: data.records};
           }
        } else {
           incomingRecords = {};
        }
      }

      // Normalize records: Ensure all values are arrays of DebtRecord objects
      Object.keys(incomingRecords).forEach(key => {
        let recs = incomingRecords[key];
        
        // Handle object map { id: record }
        if (!Array.isArray(recs) && typeof recs === 'object' && recs !== null) {
          recs = Object.values(recs);
        } else if (!Array.isArray(recs)) {
          recs = [];
        }

        // Handle Array of Arrays (Spreadsheet Rows)
        if (recs.length > 0 && Array.isArray(recs[0])) {
           const rows = recs as any[][];
           // Check for header row
           const firstRow = rows[0];
           const isHeader = firstRow.every((c: any) => typeof c === 'string');
           
           if (isHeader && (firstRow.includes('id') || firstRow.includes('ID') || firstRow.includes('name') || firstRow.includes('Name') || firstRow.includes('Reference') || firstRow.includes('log Id') || firstRow.includes('Product'))) {
              const headers = firstRow.map((h: any) => String(h).toLowerCase());
              recs = rows.slice(1).map(row => {
                 const r: any = {};
                 headers.forEach((h, i) => {
                    let key = h;
                    // Map user-friendly column names back to DebtRecord keys
                    if (h === 'type (income or expense)') key = 'transactionType';
                    else if (h === 'tab (tab name)') key = 'tab';
                    else if (h === 'reference') key = 'facebookId';
                    else if (h === 'id' || h === 'log id') key = 'id';
                    else if (h === 'amount') key = 'amount';
                    else if (h === 'quantity') key = 'amount';
                    else if (h === 'code') key = 'itemCode';
                    else if (h === 'date') key = 'date';
                    else if (h === 'remarks') key = 'remarks';
                    else if (h === 'transactiontype') key = 'transactionType';
                    else if (h === 'facebookid') key = 'facebookId';
                    else if (h === 'actualamount') key = 'actualAmount';
                    else if (h === 'minamount') key = 'minAmount';
                    else if (h === 'maxamount') key = 'maxAmount';
                    else if (h === 'contactnumber') key = 'contactNumber';
                    else if (h === 'itemcode') key = 'itemCode';
                    else if (h === 'supplysource' || h === 'trans type') key = 'supplySource';
                    else if (h === 'product') key = 'name';
                    else if (h === 'businessentrytype') key = 'businessEntryType';
                    else if (h === 'salesentrytype') key = 'salesEntryType';

                    if (key === 'amount' || key === 'price' || key === 'actualAmount' || key === 'minAmount' || key === 'maxAmount') {
                       r[key] = Number(row[i]) || 0;
                    } else {
                       r[key] = row[i];
                    }
                 });
                 return r;
              });
           } else {
              // Heuristic Mapping (Fallback)
              const type = (data.tabTypes && data.tabTypes[key]) || settings.tabTypes[key] || 'debt';
              
              recs = rows.map(row => {
                 const id = row.find((c: any) => typeof c === 'string' && c.startsWith('rec-')) || `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                 
                 // Collect all numbers and dates
                 const numbers = row.filter((c: any) => typeof c === 'number');
                 const dates = row.filter((c: any) => typeof c === 'string' && (c.includes('GMT') || c.match(/\d{4}-\d{2}-\d{2}/)));
                 const strings = row.filter((c: any) => typeof c === 'string' && c !== id && !dates.includes(c));
                 
                 const date = dates[0] || new Date().toISOString();
                 const amount = numbers[0] || 0;
                 const name = strings[0] || 'Unknown';
                 const remarks = strings[1] || '';

                 const r: any = {
                    id,
                    name,
                    amount,
                    date,
                    remarks,
                    status: 'active'
                 };

                 // Specific logic for special tab types
                 if (key.endsWith(' Incoming') || key.endsWith(' Outgoing')) {
                    const sourceKeywords = ['sales', 'giveaway', 'disposal', 'production', 'delivery', 'return', 'manual', 'correction', 'purchase'];
                    const foundSource = strings.find(s => sourceKeywords.includes(s.toLowerCase()));
                    if (foundSource) {
                        r.supplySource = foundSource.toLowerCase();
                        if (remarks === foundSource) {
                            r.remarks = strings[2] || '';
                        }
                    } else {
                        // Default fallback if source not found
                        r.supplySource = key.endsWith(' Incoming') ? 'delivery' : 'sales';
                    }
                 }

                 if (type === 'cashflow') {
                    const typeCandidate = strings.find(s => s.toLowerCase() === 'income' || s.toLowerCase() === 'expense');
                    if (typeCandidate) r.transactionType = typeCandidate.toLowerCase();
                    else r.transactionType = amount >= 0 ? 'income' : 'expense';
                 } else if (type === 'product' || type === 'supply') {
                    // Product/Supply usually has Price, Min, Max
                    // Assuming order: Amount (Qty), Price, Min, Max OR Price, Amount...
                    // If we have multiple numbers, try to assign them
                    if (numbers.length > 1) r.price = numbers[1];
                    if (numbers.length > 2) r.minAmount = numbers[2];
                    if (numbers.length > 3) r.maxAmount = numbers[3];
                    
                    // Look for item code
                    const codeCandidate = strings.find(s => s.length < 20 && /^[A-Z0-9-]+$/.test(s) && s !== name);
                    if (codeCandidate) r.itemCode = codeCandidate;
                 }

                 return r as DebtRecord;
              });
           }
        }
        
        incomingRecords[key] = recs;
      });
      
      if (data.signatures) {
        const sigMap = data.signatures;
        const knownSigs = JSON.parse(localStorage.getItem('known_signatures') || '[]');
        const currentSigIds = Object.keys(sigMap);
        const newSigIds = currentSigIds.filter(id => !knownSigs.includes(id));
        let newSigCount = 0;
        
        // Map to Ledger Records
        Object.keys(incomingRecords).forEach(t => {
           if (Array.isArray(incomingRecords[t])) {
             incomingRecords[t] = incomingRecords[t].map((r: DebtRecord) => {
                const sigData = sigMap[r.id];
                if (sigData) {
                    if (newSigCount > 0) { if (newSigIds.includes(r.id)) newSigCount++; } 
                    if (typeof sigData === 'string') {
                        return { ...r, signature: sigData, signatureDate: r.signatureDate || new Date().toISOString() };
                    } else {
                        return { 
                            ...r, 
                            signature: sigData.signature, 
                            signatureDate: sigData.signatureDate || r.signatureDate || new Date().toISOString(),
                            signerAddress: sigData.signerAddress,
                            signerName: sigData.signerName,
                            contractTerm: sigData.term,
                            contractPeriod: sigData.period,
                            contractAmountPerDue: sigData.amountPerDue
                        };
                    }
                }
                return r;
             });
           }
        });

        // Map to Investors
        incomingInvestors = incomingInvestors.map((inv: Investor) => {
          const sigData = sigMap[inv.id];
          if (sigData) {
              if (newSigCount > 0) { if (newSigIds.includes(inv.id)) newSigCount++; }
              if (typeof sigData === 'string') {
                  return { ...inv, signature: sigData, signatureDate: inv.signatureDate || new Date().toISOString() };
              } else {
                  return {
                      ...inv,
                      signature: sigData.signature,
                      signatureDate: sigData.signatureDate || inv.signatureDate || new Date().toISOString()
                  };
              }
          }
          return inv;
        });

        if (newSigCount > 0) { showToast(`Contract Signed! (${newSigCount} new)`, 'success'); if (window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]); }
        localStorage.setItem('known_signatures', JSON.stringify(currentSigIds));
      } else {
         // Fix: If signatures are missing (partial sync), merge existing local signatures AND details
         const currentLocal = allRecordsRef.current;
         Object.keys(incomingRecords).forEach(t => {
             const existingTabRecords = currentLocal[t] || [];
             const sigMap = new Map();
             existingTabRecords.forEach(r => { if (r.signature) sigMap.set(r.id, r); });
             
             if (Array.isArray(incomingRecords[t])) {
               incomingRecords[t] = incomingRecords[t].map((r: DebtRecord) => {
                   const s = sigMap.get(r.id);
                   if (s) {
                       return { 
                           ...r, 
                           signature: s.signature, 
                           signatureDate: s.signatureDate, 
                           signerName: s.signerName, 
                           signerAddress: s.signerAddress,
                           contractTerm: s.contractTerm,
                           contractPeriod: s.contractPeriod,
                           contractAmountPerDue: s.contractAmountPerDue
                       };
                   }
                   return r;
               });
             }
         });
      }
      
      setInvestors(incomingInvestors);
      if (fullSync) { setAllRecords(incomingRecords); } 
      else if (data.records) { setAllRecords(prev => ({ ...prev, [currentTab]: incomingRecords[currentTab] })); }
      
      if (!silent) showToast(isOfflineMode ? "Personal Cloud Restored" : "Synchronized");
      return data.records;
    } catch (error: any) {
      if (error.name === 'AbortError') return null;
      if (isInitialLoad || !silent) { 
        setSyncErrorMessage(error.message === "Failed to fetch" ? SYNC_ERROR_MESSAGE : `Sync Failed: ${error.message}`); 
        setPendingSyncAction(() => () => fetchAllData(silent, fullSync, targetTabOverride, endpoint)); 
      }
      return null;
    } finally { if (!silent) setIsRefreshing(false); if (fullSync || isInitialLoad) setIsInitialLoad(false); }
  }, [settings.scriptUrl, settings.personalScriptUrl, isInitialLoad, showToast, isPerformingUndo, filteredGlobalHistory, isOfflineMode]);

  useEffect(() => {
    if (session && !hasInitialSynced.current) {
      hasInitialSynced.current = true;
      if (!isOfflineMode && settings.scriptUrl) { fetchAllData(false, true, activeTab); } 
      else if (isOfflineMode && settings.personalScriptUrl) { 
        setTimeout(() => {
          setIsInitialLoad(false); 
          setIsRefreshing(false); 
          showToast("Personal Ledger Ready"); 
        }, 3000);
      } 
      else { const simulateLoad = async () => { setIsRefreshing(true); setRefreshIsBlocking(true); await new Promise(r => setTimeout(r, 3000)); setIsInitialLoad(false); setIsRefreshing(false); showToast("Personal Ledger Enabled"); }; simulateLoad(); }
    } else if (!session) { setIsInitialLoad(false); }
  }, [session, settings.scriptUrl, settings.personalScriptUrl, fetchAllData, activeTab, isOfflineMode]);

  const lastVerifiedPersonalUrl = useRef<string | undefined>(settings.personalScriptUrl);
  useEffect(() => {
    if (isOfflineMode && settings.personalScriptUrl && settings.personalScriptUrl !== lastVerifiedPersonalUrl.current) {
      lastVerifiedPersonalUrl.current = settings.personalScriptUrl;
      const verifyPersonalCloudConfig = async () => {
        setIsRefreshing(true); setRefreshIsBlocking(true); setToast({ visible: true, leaving: false, message: "Validating Personal Cloud...", type: 'success' });
        try {
          const res = await fetch(`${settings.personalScriptUrl}?tab=_TabConfigs_`);
          const data = await res.json();
          if (data.status === 'error') throw new Error(data.message);
          if (!data.appPin) { 
            setPasscodeContext({ action: 'setupPersonalCloud' }); 
            setIsPasscodeModalOpen(true); 
            showToast("Private sheet found. Set a PIN to secure it.", "success"); 
          } else { 
            showToast("Personal Cloud Connected. Ready to Restore.", "success"); 
          }
        } catch (e: any) { showToast("Failed to connect to Personal Script URL", "error"); } 
        finally { setIsRefreshing(false); }
      };
      verifyPersonalCloudConfig();
    }
  }, [isOfflineMode, settings.personalScriptUrl, fetchAllData, showToast]);

  const handleUserAction = async (user: AppUser, action: 'addUser' | 'updateUser' | 'deleteUser') => {
    if (!settings.scriptUrl || isOfflineMode) {
      if (action === 'addUser') setUsers(prev => [...prev, user]);
      else if (action === 'updateUser') setUsers(prev => prev.map(u => u.id === user.id ? user : u));
      else if (action === 'deleteUser') setUsers(prev => prev.filter(u => u.id !== user.id));
      showToast(action === 'deleteUser' ? "User Removed (Local Only)" : "User Saved (Local Only)");
      return;
    }
    const performAction = async () => {
        setIsRefreshing(true); setRefreshIsBlocking(true);
        try {
          const payload = { action, user: action === 'deleteUser' ? undefined : { ...user }, id: action === 'deleteUser' ? user.id : undefined };
          const response = await fetch(settings.scriptUrl, { method: 'POST', body: JSON.stringify(payload) });
          const data = await response.json();
          if (data.status === 'success') {
            if (action === 'addUser') setUsers(prev => [...prev, user]);
            else if (action === 'updateUser') setUsers(prev => prev.map(u => u.id === user.id ? user : u));
            else if (action === 'deleteUser') setUsers(prev => prev.filter(u => u.id !== user.id));
            showToast(action === 'deleteUser' ? "User Removed" : "User Saved");
          } else { throw new Error(data.message || "Cloud Action Failed"); }
        } catch (e: any) { setSyncErrorMessage(createSyncErrorMessage(action === 'deleteUser' ? "deleting user" : `saving user ${user.username}`)); setPendingSyncAction(() => performAction); } 
        finally { setIsRefreshing(false); }
    };
    performAction();
  };

  const handleLogin = (sess: AppSession, scriptUrl: string) => {
    const targetSuffix = sess.isOffline ? '_personal' : '_enterprise';
    const savedSettingsStr = localStorage.getItem(`app_settings${targetSuffix}`);
    let settingsToSet: AppSettings;
    if (savedSettingsStr) { settingsToSet = JSON.parse(savedSettingsStr); if (!sess.isOffline && scriptUrl) { settingsToSet.scriptUrl = scriptUrl; } } 
    else { settingsToSet = { spreadsheetUrl: '', scriptUrl: sess.isOffline ? '' : scriptUrl, personalScriptUrl: '', appPin: '', deletedHistory: [], tabTypes: { 'Cash loan': 'debt' }, earningsAdjustments: { month: 0, year: 0 }, cashflowInitialBalances: {}, realizedEarnings: 0, copyBullet: '🌸', copyFooter: 'Thank you - Lmk', loadingColor: '#db2777', biometricSensitiveEnabled: true, currencyConfigs: {}, restrictedTabMode: false, unrestrictedTabNames: [], authorizedSignature: '', fundHolderName: '', operatorName: '', lenderName: '', githubPagesUrl: '', rentBannerSettings: {} }; }
    
    const savedRecordsStr = localStorage.getItem(`app_cached_records${targetSuffix}`);
    const recordsToSet = savedRecordsStr ? JSON.parse(savedRecordsStr) : {};
    
    const savedTabsStr = localStorage.getItem(`app_cached_tabs${targetSuffix}`);
    const tabsToSet = savedTabsStr ? JSON.parse(savedTabsStr).filter((t: string) => { 
      const low = t.toLowerCase().trim(); 
      return low !== 'history' && 
             low !== 'earnings' && 
             low !== 'users' && 
             low !== 'investors' && 
             low !== 'main ledger' && 
             !low.startsWith('_') && 
             !low.startsWith('report_') &&
             !low.endsWith('report_') &&
             !low.endsWith('report_') &&
             !low.endsWith(' history') &&
             !low.endsWith(' incoming') &&
             !low.endsWith(' outgoing');
    }) : ['Cash loan'];

    const savedInvestorsStr = localStorage.getItem(`app_cached_investors${targetSuffix}`);
    const investorsToSet = savedInvestorsStr ? JSON.parse(savedInvestorsStr) : [];

    setAllRecords(recordsToSet); 
    setTabs(tabsToSet); 
    setSettings(settingsToSet); 
    setInvestors(investorsToSet);
    setActiveTab(tabsToSet[0] || 'Cash loan'); 
    setSession(sess);
    localStorage.setItem('app_session', JSON.stringify(sess));

    if (!sess.isOffline) { setIsInitialLoad(true); hasInitialSynced.current = true; fetchAllData(false, true, tabsToSet[0] || 'Cash loan', scriptUrl); } 
    else { setIsInitialLoad(true); setIsRefreshing(true); setRefreshIsBlocking(true); setTimeout(() => { setIsInitialLoad(false); setIsRefreshing(false); showToast("Personal Ledger Enabled"); }, 3000); }
  };

  const handleLogout = useCallback(() => { 
    localStorage.removeItem('app_session'); 
    setSession(null); 
    setAllRecords({}); 
    setTabs(['Cash loan']); 
    setInvestors([]);
    setPast([]); 
    setFuture([]); 
    hasInitialSynced.current = false; 
    const savedEnterprise = localStorage.getItem('app_settings_enterprise'); 
    if (savedEnterprise) { setSettings(JSON.parse(savedEnterprise)); } 
    showToast("Logged Out Successfully"); 
  }, [showToast]);

  const onOpenTips = useCallback(() => setIsTipsOpen(true), []);

  const handleChangePassword = async (oldPw: string, nPw: string) => {
    if (!session || (!settings.scriptUrl && !isOfflineMode)) return;
    if (oldPw !== session.password) throw new Error("Old password is incorrect.");
    if (isOfflineMode) { const updatedSession = { ...session, password: nPw }; setSession(updatedSession); localStorage.setItem('app_session', JSON.stringify(updatedSession)); showToast("Local Password Updated"); setIsChangePasswordOpen(false); return; }
    const response = await fetch(settings.scriptUrl, { method: 'POST', body: JSON.stringify({ action: 'updateUserPassword', username: session.username, newPassword: nPw }) });
    const data = await response.json();
    if (data.status === 'success') { showToast("Password updated. Please log in again."); handleLogout(); setIsChangePasswordOpen(false); } 
    else throw new Error("Cloud update failed.");
  };

  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  const activeIndex = useMemo(() => { const idx = visibleTabs.indexOf(activeTab); return idx === -1 ? 0 : idx; }, [visibleTabs, activeTab]);

  const handleSaveRentPhoto = useCallback(async (tabName: string, photo: string) => {
    setSettings(prev => ({
      ...prev,
      rentTabPhotos: {
        ...prev.rentTabPhotos,
        [tabName]: photo
      }
    }));
    
    const activeUrl = isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl;
    
    if (!activeUrl) {
      showToast("Photo saved locally. Cloud not configured.", "restricted");
      return;
    }

    if (photo.length > 50000) {
      showToast("Photo too large for cloud sync (>50k chars). Saved locally only.", "error");
      return;
    }

    try {
      showToast("Uploading photo...", "success");
      // Add a small delay to ensure the user sees the "Uploading" toast
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await fetch(activeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveRentTabPhoto', tab: tabName, photo: photo })
      });
      showToast("Upload complete", "success");
    } catch (e) {
      console.warn("Failed to sync rent photo", e);
      showToast("Failed to save photo to cloud", "error");
    }
  }, [isOfflineMode, settings.scriptUrl, settings.personalScriptUrl, showToast]);

  const handleSaveRentBannerSettings = useCallback(async (tabName: string, bannerSettings: RentBannerSettings) => {
    setSettings(prev => ({
      ...prev,
      rentBannerSettings: {
        ...prev.rentBannerSettings,
        [tabName]: bannerSettings
      }
    }));
    
    const activeUrl = isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl;
    if (activeUrl) {
      try {
        if (bannerSettings.qrCode1 && bannerSettings.qrCode1.length > 50000) {
           showToast("QR Code 1 is too large for cloud sync (>50k chars). Saved locally only.", "error");
           throw new Error("QR1 too large");
        }
        if (bannerSettings.qrCode2 && bannerSettings.qrCode2.length > 50000) {
           showToast("QR Code 2 is too large for cloud sync (>50k chars). Saved locally only.", "error");
           throw new Error("QR2 too large");
        }
        const payload = JSON.stringify({ action: 'saveRentBannerSettings', tab: tabName, settings: bannerSettings });
        if (payload.length > 100000) {
           showToast("Settings payload too large for cloud sync. Saved locally only.", "error");
           throw new Error("Payload too large");
        }
        const response = await fetch(activeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: payload
        });
        if (!response.ok) throw new Error("Network response was not ok");
      } catch (e) {
        console.warn("Failed to sync rent banner settings", e);
        throw e;
      }
    }
  }, [isOfflineMode, settings.personalScriptUrl, settings.scriptUrl, showToast]);

  const handleUpdateCurrencyConfig = useCallback(async (tabName: string, config: Partial<CurrencyConfig>) => {
    const current = settings.currencyConfigs?.[tabName] || { primary: 'PHP', secondary: 'USD', useSecondary: false, exchangeRate: 1 };
    const updated = { ...current, ...config };
    const currenciesChanged = config.primary !== undefined || config.secondary !== undefined;
    const shouldFetch = (config.useSecondary === true) || (updated.useSecondary && currenciesChanged);
    if (updated.primary === updated.secondary) updated.exchangeRate = 1;
    else if (shouldFetch) {
      if (!navigator.onLine) showToast("No internet connection. Rate might be outdated.", "error");
      else {
        setIsRefreshing(true); setToast({ visible: true, leaving: false, message: `Fetching live ${updated.secondary} rate...`, type: 'success' });
        try {
          const res = await fetch(`https://open.er-api.com/v6/latest/${updated.primary}`);
          const data = await res.json();
          if (data.rates && data.rates[updated.secondary]) { 
            updated.exchangeRate = data.rates[updated.secondary] || 1; 
            updated.lastUpdated = Date.now(); 
            showToast(`Rate: 1 ${updated.primary} = ${updated.exchangeRate.toFixed(4)} ${updated.secondary}`); 
          } 
          else { showToast("Currency rate not found", "error"); updated.exchangeRate = 1; updated.useSecondary = false; }
        } catch (e) { showToast("Failed to fetch rates. Check your connection.", "error"); updated.exchangeRate = updated.exchangeRate || 1; updated.useSecondary = false; } 
        finally { setIsRefreshing(false); }
      }
    }
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;
    if (activeUrl) {
        const performConfigUpdate = async () => {
          setIsRefreshing(true); setRefreshIsBlocking(true);
          try {
            await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'saveCurrencyConfig', tab: tabName, config: updated }) });
            setSettings(prev => ({ ...prev, currencyConfigs: { ...(prev.currencyConfigs || {}), [tabName]: updated } }));
          } catch (e) { setSyncErrorMessage(createSyncErrorMessage(`updating currency for ${tabName}`)); setPendingSyncAction(() => performConfigUpdate); } 
          finally { setIsRefreshing(false); }
        };
        performConfigUpdate();
    } else { setSettings(prev => ({ ...prev, currencyConfigs: { ...(prev.currencyConfigs || {}), [tabName]: updated } })); }
  }, [settings.currencyConfigs, settings.scriptUrl, showToast, isOfflineMode]);

  const handleUpdateInitialBalance = async (newBal: number) => {
    const currentTab = activeTabRef.current;
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;
    if (activeUrl) {
      const performUpdate = async () => {
          setIsRefreshing(true); setRefreshIsBlocking(true);
          try {
            const response = await fetch(activeUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveInitialBalance', tab: currentTab, balance: newBal }) });
            const data = await response.json();
            if (data.status === 'success') { setSettings(prev => ({ ...prev, cashflowInitialBalances: { ...(prev.cashflowInitialBalances || {}), [currentTab]: newBal } })); showToast("Bank Balance Synced to A2"); if (!isOfflineMode) setTimeout(syncGlobalMetricsInBackground, 500); } 
            else throw new Error();
          } catch (e) { setSyncErrorMessage(createSyncErrorMessage(`updating bank balance in ${currentTab}`)); setPendingSyncAction(() => performUpdate); } 
          finally { setIsRefreshing(false); }
      };
      performUpdate();
    } else { setSettings(prev => ({ ...prev, cashflowInitialBalances: { ...(prev.cashflowInitialBalances || {}), [currentTab]: newBal } })); showToast("Bank Balance Updated Locally"); }
  };

  const saveHistorySnapshot = useCallback((deletedId?: string) => { 
    const current: HistorySnapshot = { allRecords: JSON.parse(JSON.stringify(allRecords)), tabs: [...tabs], tabTypes: { ...settings.tabTypes }, deletedHistory: [...settings.deletedHistory], earningsAdjustments: settings.earningsAdjustments ? { ...settings.earningsAdjustments } : undefined, cashflowInitialBalances: settings.cashflowInitialBalances ? { ...settings.cashflowInitialBalances } : undefined, copyBullet: settings.copyBullet, copyFooter: settings.copyFooter, lastDeletedId: deletedId };
    setPast(prev => [current, ...prev].slice(0, 25)); setFuture([]); 
  }, [allRecords, tabs, settings]);

  const pushRestoredTabToCloud = async (tabName: string, records: DebtRecord[], blocking = true, idToScrub?: string) => {
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;
    if (!activeUrl) return;
    setIsRefreshing(true); setRefreshIsBlocking(blocking); 
    try {
      if (idToScrub) await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'deleteHistoryById', tab: tabName, id: idToScrub }) });
      const response = await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'bulkReplaceRecords', tab: tabName, records: records }) });
      const data = await response.json();
      if (data.realizedEarnings !== undefined) setSettings(prev => ({ ...prev, realizedEarnings: data.realizedEarnings }));
      if (data.globalHistory) setSettings(prev => ({ ...prev, deletedHistory: filteredGlobalHistory(data.globalHistory) }));
      if (!isOfflineMode) setTimeout(syncGlobalMetricsInBackground, 500);
    } catch (e) { console.error("Cloud restore failed", e); } 
    finally { setIsRefreshing(false); }
  };

  const handleUndo = useCallback(async () => { 
    if (past.length === 0 || isRefreshing) return; 
    setIsPerformingUndo(true); lastUndoRedoTimestamp.current = Date.now();
    const previous = past[0];
    const current: HistorySnapshot = { allRecords: JSON.parse(JSON.stringify(allRecords)), tabs: [...tabs], tabTypes: { ...settings.tabTypes }, deletedHistory: [...settings.deletedHistory], earningsAdjustments: settings.earningsAdjustments ? { ...settings.earningsAdjustments } : undefined, cashflowInitialBalances: settings.cashflowInitialBalances ? { ...settings.cashflowInitialBalances } : undefined, copyBullet: settings.copyBullet, copyFooter: settings.copyFooter };
    setFuture(prev => [current, ...prev]); setPast(prev => prev.slice(1));
    setAllRecords(previous.allRecords); setTabs(previous.tabs); 
    setSettings(prev => ({ ...prev, tabTypes: previous.tabTypes, deletedHistory: previous.deletedHistory, earningsAdjustments: previous.earningsAdjustments, cashflowInitialBalances: previous.earningsAdjustments, copyBullet: previous.copyBullet, copyFooter: previous.copyFooter })); 
    pushRestoredTabToCloud(activeTabRef.current, previous.allRecords[activeTabRef.current] || [], true, previous.lastDeletedId);
    showToast("Undo Successful"); setTimeout(() => setIsPerformingUndo(false), 1500);
  }, [past, allRecords, tabs, settings, showToast, isRefreshing, pushRestoredTabToCloud]);

  const handleRedo = useCallback(async () => {
    if (future.length === 0 || isRefreshing) return;
    setIsPerformingUndo(true); lastUndoRedoTimestamp.current = Date.now();
    const next = future[0];
    const current: HistorySnapshot = { allRecords: JSON.parse(JSON.stringify(allRecords)), tabs: [...tabs], tabTypes: { ...settings.tabTypes }, deletedHistory: next.deletedHistory, earningsAdjustments: next.earningsAdjustments, cashflowInitialBalances: next.cashflowInitialBalances, copyBullet: next.copyBullet, copyFooter: next.copyFooter };
    setPast(prev => [current, ...prev]); setFuture(prev => prev.slice(1));
    setAllRecords(next.allRecords); setTabs(next.tabs);
    setSettings(prev => ({ ...prev, tabTypes: next.tabTypes, deletedHistory: next.deletedHistory, earningsAdjustments: next.earningsAdjustments, cashflowInitialBalances: next.cashflowInitialBalances, copyBullet: next.copyBullet, copyFooter: next.copyFooter }));
    pushRestoredTabToCloud(activeTabRef.current, next.allRecords[activeTabRef.current] || [], true);
    showToast("Redo Successful"); setTimeout(() => setIsPerformingUndo(false), 1500);
  }, [future, allRecords, tabs, settings, showToast, isRefreshing, pushRestoredTabToCloud]);

  const handleUpdateRecordInline = async (record: DebtRecord) => {
    const tabName = record.tab || activeTabRef.current;
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;
    if (activeUrl) {
      // Optimistic Update
      const previousRecords = allRecords[tabName] || [];
      setAllRecords(prev => ({ ...prev, [tabName]: (prev[tabName] || []).map(r => r.id === record.id ? record : r) }));

      const performInlineUpdate = async () => {
          setIsRefreshing(true); 
          setRefreshIsBlocking(false);
          try {
            const response = await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'updateRecord', tab: tabName, record }) });
            const data = await response.json();
            if (data.status === 'success') { 
              if (data.records) {
                setAllRecords(prev => {
                  const existing = prev[tabName] || [];
                  const sigMap = new Map();
                  existing.forEach(r => { if (r.signature) sigMap.set(r.id, r); });
                  const merged = data.records.map((r: DebtRecord) => {
                    const s = sigMap.get(r.id);
                    return s ? { ...r, signature: s.signature, signatureDate: s.signatureDate, signerName: s.signerName, signerAddress: s.signerAddress, contractTerm: s.contractTerm, contractPeriod: s.contractPeriod, contractAmountPerDue: s.contractAmountPerDue } : r;
                  });
                  return { ...prev, [tabName]: merged };
                });
              }
              if (!isOfflineMode) setTimeout(syncGlobalMetricsInBackground, 500); 
            } else throw new Error(data.message);
          } catch (e) { 
            // Rollback
            setAllRecords(prev => ({ ...prev, [tabName]: previousRecords }));
            setSyncErrorMessage(createSyncErrorMessage(`updating ${record.name} in ${tabName}`)); 
            setPendingSyncAction(() => performInlineUpdate); 
          } 
          finally { setIsRefreshing(false); }
      };
      await performInlineUpdate();
    } else { setAllRecords(prev => ({ ...prev, [tabName]: (prev[tabName] || []).map(r => r.id === record.id ? record : r) })); showToast("Updated Locally"); }
  };

  const handleConfirmExtend = (record: DebtRecord) => { const updated = { ...record, status: 'active' as const, date: getTodayStr(), id: `rec-${Date.now()}` }; handleRecordSubmit(updated, false); setIsHistoryOpen(false); };

  const handleEndSalesCycle = async (startId: string) => {
    const tabName = activeTabRef.current;
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;
    const records = allRecords[tabName] || [];
    const startRecord = records.find(r => r.id === startId);
    if (!startRecord) return;

    const today = getTodayStr();
    const updatedStart = { ...startRecord, status: 'finished' as const, endDate: today };
    const endRecord = {
      id: `rec-${Date.now()}-end`,
      name: 'Cycle Ended',
      date: today,
      amount: 0,
      salesEntryType: 'cycle_end' as const,
      remarks: 'Cycle ended',
      status: 'finished' as const,
      tab: tabName
    };

    setIsRefreshing(true); setRefreshIsBlocking(true);
    try {
      if (activeUrl) {
        await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'updateRecord', tab: tabName, record: updatedStart }) });
        await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'addRecords', tab: tabName, records: [endRecord] }) });
        await fetchAllData(true, false, tabName);
      } else {
        setAllRecords(prev => ({
          ...prev,
          [tabName]: (prev[tabName] || []).map(r => r.id === startId ? updatedStart : r).concat(endRecord as any)
        }));
      }
      showToast("Cycle Ended Successfully");
    } catch (e) {
      showToast("Sync Issue", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRecordSubmit = async (recordData: DebtRecord | DebtRecord[], isEdit: boolean, sideEffectRecord?: any) => {
    const tabName = activeTabRef.current;
    const items = Array.isArray(recordData) ? recordData : [recordData];
    const enrichedItems = items.map(r => ({ ...r, id: r.id || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`, tab: tabName }));
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;

    // Close form immediately for better UX
    setIsFormOpen(false);
    setEditingRecord(null);

    if (!activeUrl) {
      saveHistorySnapshot();
      const tabType = settings.tabTypes[tabName];
      const isInventory = tabType === 'supply' || tabType === 'product';
      if (!isEdit && isInventory && enrichedItems[0].isSupplyTransaction) {
         const trans = enrichedItems[0];
         const currentMainRecords = allRecords[tabName] || [];
         const targetIdx = currentMainRecords.findIndex(r => r.name.toLowerCase().trim() === trans.name.toLowerCase().trim());
         if (targetIdx !== -1) {
           const updatedMainRecords = [...currentMainRecords];
           const original = updatedMainRecords[targetIdx];
           const nQty = trans.transactionType === 'income' ? original.amount + trans.amount : original.amount - trans.amount;
           updatedMainRecords[targetIdx] = { ...original, amount: nQty, date: trans.date };
           const subTabName = tabName + (trans.transactionType === 'income' ? " Incoming" : " Outgoing");
           const logEntry = { id: `log-${Date.now()}`, supplySource: trans.supplySource || 'general', name: trans.name, amount: trans.amount, date: trans.date, remarks: trans.remarks || '' };
           setAllRecords((prev: any) => ({ ...prev, [tabName]: updatedMainRecords, [subTabName]: [...(prev[subTabName] || []), logEntry] }));
           setHighlightedRecordId(original.id); showToast(`Stock ${trans.transactionType === 'income' ? 'Received' : 'Issued'} Locally`, 'success'); return;
         } else { showToast("Item not found in main list", "error"); return; }
      }
      if (isEdit) {
        const editIds = new Set(enrichedItems.map(r => r.id));
        setAllRecords(prev => ({ 
          ...prev, 
          [tabName]: (prev[tabName] || []).map(r => editIds.has(r.id) ? (enrichedItems.find(ei => ei.id === r.id) || r) : r) 
        }));
      } 
      else {
        setAllRecords(prev => ({ ...prev, [tabName]: [...(prev[tabName] || []), ...enrichedItems] }));
        if (settings.tabTypes[tabName] === 'cashflow') { const submittedType = enrichedItems[0].transactionType; if (submittedType) setCashFlowFilter(submittedType); } 
        else { const type = settings.tabTypes[tabName] || 'debt'; if (['debt', 'rent'].includes(type)) { const personName = enrichedItems[0].name.toLowerCase().trim(); const allPersonRecords = [...(allRecords[tabName] || []), ...enrichedItems].filter((r: DebtRecord) => r.name?.toLowerCase().trim() === personName); setAddedRecordToCopy({ name: enrichedItems[0].name, tab: tabName, items: allPersonRecords, type: type }); } }
      }
      setHighlightedRecordId(enrichedItems[0].id); showToast(isEdit ? "Updated Locally" : "Added Locally", 'success'); return;
    }

    // Optimistic Update for Online Mode
    const previousRecords = allRecords[tabName] || [];
    setAllRecords(prev => {
      if (isEdit) {
        const editIds = new Set(enrichedItems.map(r => r.id));
        return { 
          ...prev, 
          [tabName]: (prev[tabName] || []).map(r => editIds.has(r.id) ? (enrichedItems.find(ei => ei.id === r.id) || r) : r) 
        };
      } else {
        return { ...prev, [tabName]: [...(prev[tabName] || []), ...enrichedItems] };
      }
    });

    const performSubmit = async () => {
        setIsRefreshing(true); 
        // Don't block UI for simple record additions if we have optimistic updates
        setRefreshIsBlocking(false); 
        try {
          let payload: any;
          const tabType = settings.tabTypes[tabName];
          const isInventory = tabType === 'supply' || tabType === 'product';
          if (!isEdit && isInventory && enrichedItems[0].isSupplyTransaction) {
             const trans = enrichedItems[0];
             const original = (allRecords[tabName] || []).find(r => r.id === trans.id || r.name.trim().toLowerCase() === trans.name.trim().toLowerCase());
             if (!original) throw new Error(`${tabType === 'product' ? 'Product' : 'Supply'} item "${trans.name}" not found.`);
             const newAmount = original.amount + (trans.transactionType === 'income' ? trans.amount : -trans.amount);
             payload = { action: 'addSupplyTransaction', tab: tabName, transaction: trans, updatedRecord: { ...original, amount: newAmount, date: trans.date } };
          } else { 
            if (isEdit) {
               payload = { action: 'updateRecord', tab: tabName, record: enrichedItems[0] };
            } else {
               // Default add action
               payload = { action: 'addRecords', tab: tabName, records: enrichedItems };
               
               // Special handling for Sales tab to maintain chronological order
               if (settings.tabTypes[tabName] === 'sales') {
                  const currentRecords = allRecords[tabName] || [];
                  const newRecordDate = enrichedItems[0].date;
                  
                  // Sort current records by date to find the correct insertion point
                  const sorted = [...currentRecords].sort((a, b) => a.date.localeCompare(b.date));
                  
                  let foundIndex = -1;
                  for (let i = 0; i < sorted.length; i++) {
                     if (sorted[i].date > newRecordDate) {
                        foundIndex = i;
                        break;
                     }
                  }
                  
                  if (foundIndex !== -1) {
                     if (foundIndex > 0) {
                        // Insert after the record that is immediately before the found index
                        // This places the new record chronologically correct
                        payload.insertAfter = sorted[foundIndex - 1].id;
                     } else {
                        // The new record is earlier than all existing records
                        payload.insertAtStart = true;
                     }
                  }
                  // If foundIndex is -1, it means the new record is later than all existing records,
                  // so we just append (default behavior), no extra flags needed.
               }
            }
          }
          
          const response = await fetch(activeUrl, { method: 'POST', body: JSON.stringify(payload) });
          const data = await response.json();
          
          if (data.status === 'success') {
            if (Array.isArray(data.records)) {
              setAllRecords(prev => {
                const existing = prev[tabName] || [];
                const sigMap = new Map();
                existing.forEach(r => { 
                  if (r.signature) sigMap.set(r.id, { 
                    signature: r.signature, 
                    signatureDate: r.signatureDate, 
                    signerName: r.signerName, 
                    signerAddress: r.signerAddress,
                    contractTerm: r.contractTerm,
                    contractPeriod: r.contractPeriod,
                    contractAmountPerDue: r.contractAmountPerDue
                  }); 
                });
                
                const merged = data.records.map((r: DebtRecord) => {
                  const s = sigMap.get(r.id);
                  return s ? { ...r, ...s } : r;
                });
                
                let finalMerged = merged;
                if (sideEffectRecord) {
                   finalMerged = finalMerged.map((r: DebtRecord) => r.id === sideEffectRecord.id ? { ...r, ...sideEffectRecord } : r);
                }

                return { ...prev, [tabName]: finalMerged };
              });
            }
            saveHistorySnapshot(); 
            showToast(isEdit ? "Updated Successfully" : "Added Successfully", 'success');
            if (!isOfflineMode) setTimeout(syncGlobalMetricsInBackground, 500);
            if (!isEdit) {
              if (settings.tabTypes[tabName] === 'cashflow') { const submittedType = enrichedItems[0].transactionType; if (submittedType) setCashFlowFilter(submittedType); } 
              else { const type = settings.tabTypes[tabName] || 'debt'; if (['debt', 'rent'].includes(type)) { const personName = enrichedItems[0].name.toLowerCase().trim(); const allPersonRecords = (data.records || enrichedItems).filter((r: DebtRecord) => r.name?.toLowerCase().trim() === personName); setAddedRecordToCopy({ name: enrichedItems[0].name, tab: tabName, items: allPersonRecords, type: type }); } }
              setHighlightedRecordId(enrichedItems[enrichedItems.length - 1].id);
            } else { setHighlightedRecordId(enrichedItems[0].id); }
          } else throw new Error(data.message);
        } catch (e: any) { 
          // Rollback on error
          setAllRecords(prev => ({ ...prev, [tabName]: previousRecords }));
          setSyncErrorMessage(createSyncErrorMessage(e.message || "Action Failed")); 
          setPendingSyncAction(() => performSubmit); 
        } 
        finally { setIsRefreshing(false); }
    };
    await performSubmit();
  };

  const handleDismissCopy = useCallback(() => { setAddedRecordToCopy(null); }, []);

  const formatCopyDetails = useCallback((data: { name: string, tab: string, items: DebtRecord[], type: TabType }) => {
    const { name, tab, items, type } = data;
    const bullet = settings.copyBullet || '🌸';
    const footer = settings.copyFooter || 'Thank you - Lmk'; 
    const sortedItems = [...items].sort((a, b) => a.date.localeCompare(b.date));
    let text = "";
    if (type === 'product' || type === 'supply') { text = `${type === 'product' ? 'Product' : 'Supply'} Summary:\n\n✨${tab.toUpperCase()}✨\n\n`; sortedItems.forEach((item) => { const totalVal = (item.amount || 0) * (item.price || 0); text += `${bullet}Item name: ${item.name}\n`; if (item.itemCode && type === 'product') text += `Item code: ${item.itemCode}\n`; text += `Quantity: ${item.amount}\n`; text += `Min: ${item.minAmount ?? 0}\n`; text += `Max: ${item.maxAmount ?? 0}\n`; if (type === 'product') { text += `Price: ${formatPHP(item.price || 0)}\n`; text += `Total value: ${formatPHP(totalVal)}\n`; } text += `\n`; }); } 
    else if (type === 'rent') { const recordYear = items.length > 0 ? items[0].date.split('-')[0] : new Date().getFullYear(); text = `New Rental for ${recordYear}\n\n✨${tab.toUpperCase()}✨\n\n`; sortedItems.forEach(item => { text += `${bullet} ${item.name}: \n      (${formatDateMD(item.date)} to ${formatDateMD(item.endDate || item.date)})\n`; if (item.remarks && item.remarks.trim()) { text += `      ${item.remarks.trim()}\n`; } }); } 
    else if (type === 'debt') { text = `Loan Details:\n"${tab.toUpperCase()}"\n\n"${name}"\n\n`; sortedItems.forEach(r => { const remarkStr = r.remarks && r.remarks.trim() ? `\n      ${r.remarks.trim()}` : ''; text += `${bullet} ${formatDateMD(r.date)} - ${formatPHP(r.amount)}${remarkStr}\n`; }); text += `\nTotal: ${formatPHP(sortedItems.reduce((s, r) => s + r.amount, 0))}\n\n`; } 
    else if (type === 'cashflow') { text = `Cash Flow Transaction\nRef: ${name}\n\n`; sortedItems.forEach(r => { text += `${bullet} ${r.transactionType === 'income' ? 'Income' : 'Expense'}: ${formatPHP(r.amount)}\nDate: ${formatDateMD(r.date)}\n`; if (r.remarks) text += `Note: ${r.remarks}\n`; }); } 
    else { text = `Details for ${name}\n\n`; sortedItems.forEach(r => { text += `${bullet} ${formatDateMD(r.date)}: ${formatPHP(r.amount)} ${r.remarks ? `(${r.remarks})` : ''}\n`; }); }
    text += `\n${footer}`; return text;
  }, [settings.copyBullet, settings.copyFooter]);

  const handleLocalTabCopy = useCallback((filter: string, tabName: string) => {
    const tabRecords = allRecords[tabName] || [];
    const tabType = settings.tabTypes[tabName] || 'debt';
    const today = getTodayStr();
    const todayObj = new Date();
    const tomorrowStr = addDays(today, 1);
    const bullet = settings.copyBullet || '🌸';
    let filtered = [...tabRecords];
    let title = "ALL ENTRIES";
    if (filter === 'overdue') { filtered = tabRecords.filter(r => r.date <= today); title = "LATE & TODAY"; } 
    else if (filter === 'tomorrow') { filtered = tabRecords.filter(r => r.date === tomorrowStr); title = "DUE TOMORROW"; } 
    else if (filter === 'under') { filtered = tabRecords.filter(r => r.minAmount !== undefined && r.amount < r.minAmount); title = "LOW STOCK"; } 
    else if (filter === 'over') { filtered = tabRecords.filter(r => r.maxAmount !== undefined && r.amount > r.maxAmount); title = "OVERSTOCK"; } 
    else if (filter === 'income') { filtered = tabRecords.filter(r => r.transactionType === 'income'); title = "INCOMING"; } 
    else if (filter === 'expense') { filtered = tabRecords.filter(r => r.transactionType === 'expense'); title = "OUTGOING"; }
    if (filtered.length === 0 && filter !== 'all') { showToast(`No matching entries found in ${tabName}`, "error"); return; }
    let text = "";
    if (tabType === 'salary' && filter === 'all') {
      const todayDate = new Date(); 
      const asOf = todayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      text = `[(SALARY) ${tabName.toUpperCase()}] \nAs of ${asOf}\n\n SALARY RECORDS \n\n`;
      const groupedByMonth: Record<string, DebtRecord[]> = {}; 
      filtered.forEach(r => { 
        const d = new Date(r.date); 
        const mLabel = MONTHS[d.getMonth()]; 
        if (!groupedByMonth[mLabel]) groupedByMonth[mLabel] = []; 
        groupedByMonth[mLabel].push(r); 
      });
      const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
      let grandTotal = 0; 
      sortedMonths.forEach(mLabel => { 
        text += `📅 ${mLabel}\n`; 
        let monthTotal = 0; 
        groupedByMonth[mLabel].sort((a, b) => a.date.localeCompare(b.date)).forEach(r => { 
          text += `${bullet} ${formatPHP(r.amount)} (${formatDateMD(r.date)} to ${formatDateMD(r.endDate || r.date)})\n`; 
          monthTotal += r.amount; 
        }); 
        text += `\nTOTAL: ${formatPHP(monthTotal)}\n\n`; 
        grandTotal += monthTotal; 
      });
      text += `[ Over all total - ${formatPHP(grandTotal)} ]\n\nLmk - thank you.`;
    } else if (tabType === 'savings' && filter === 'all') {
      text = `Yearly Savings Summary\n\n✨${tabName.toUpperCase()}✨\n\n`;
      const groupedByMonth: Record<string, DebtRecord[]> = {}; filtered.forEach(r => { const d = new Date(r.date); const mLabel = MONTHS[d.getMonth()]; if (!groupedByMonth[mLabel]) groupedByMonth[mLabel] = []; groupedByMonth[mLabel].push(r); });
      const sortedMonths = Object.keys(groupedByMonth).sort((a, b) => MONTHS.indexOf(a) - MONTHS.indexOf(b));
      sortedMonths.forEach(mLabel => {
        text += `🗓️📌 ${mLabel}\n\n`; const monthRecs = groupedByMonth[mLabel];
        const income = monthRecs.filter(r => r.transactionType === 'income').reduce((s, r) => s + r.amount, 0);
        const expectedExpenses = monthRecs.filter(r => r.transactionType === 'expense').reduce((s, r) => s + r.amount, 0);
        const actualExpenses = monthRecs.filter(r => r.transactionType === 'expense' && r.status === 'finished').reduce((s, r) => s + (r.actualAmount ?? r.amount), 0);
        const allFinished = monthRecs.filter(r => r.transactionType === 'expense').every(r => r.status === 'finished');
        text += `Total income: ${formatPHP(income)}\nTotal expected expenses: ${formatPHP(expectedExpenses)}\nTotal actual expenses: ${formatPHP(actualExpenses)}\n\n${actualExpenses > expectedExpenses ? `Over expenses of : ${formatPHP(actualExpenses - expectedExpenses)}` : `Good expenses of: ${formatPHP(expectedExpenses - actualExpenses)}`}\nTotal savings: ${income - actualExpenses < 0 ? `(${formatPHP(Math.abs(income - actualExpenses))})` : formatPHP(income - actualExpenses)}\n\n${!allFinished && monthRecs.some(r => r.transactionType === 'expense') ? `On going, unfinished month.\n\n` : ''}`;
      });
      text += `Lmk - thank you.`;
    } else if (tabType === 'product' && filter === 'all') {
      text = `All Product Summary:\n\n✨${tabName.toUpperCase()}✨\n\n`;
      filtered.forEach(r => { const totalVal = (r.amount || 0) * (r.price || 0); text += `${bullet}Item name: ${r.name}\n${r.itemCode ? `Item code: ${r.itemCode}\n` : ''}Quantity: ${r.amount}\nMin: ${r.minAmount ?? 0}\nMax: ${r.maxAmount ?? 0}\nPrice: ${formatPHP(r.price || 0)}\nTotal value: ${formatPHP(totalVal)}\n\n`; });
      text += `Thank you - Lmk`;
    } else if (tabType === 'supply' && filter === 'all') {
      text = `All Supply Item Summary:\n\n✨${tabName.toUpperCase()}✨\n\n`;
      filtered.forEach(r => { text += `${bullet}Item name: ${r.name}\nQuantity: ${r.amount}\nMin: ${r.minAmount ?? 0}\nMax: ${r.maxAmount ?? 0}\n\n`; });
      text += `Thank you - Lmk`;
    } else if (tabType === 'cashflow' && (filter === 'income' || filter === 'expense')) {
      const todayDate = new Date(); const fullDate = todayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      text = `[${tabName.toUpperCase()}] \nAs of ${fullDate}\n\n All ${filter === 'income' ? 'INCOMMING' : 'OUTGOING'} FUNDS \n LEDGER\n\n`;
      const groupedByDate: Record<string, DebtRecord[]> = {}; filtered.forEach(r => { if (!groupedByDate[r.date]) groupedByDate[r.date] = []; groupedByDate[r.date].push(r); });
      const sortedDates = Object.keys(groupedByDate).sort();
      sortedDates.forEach(date => { text += `(${formatDateMD(date)})\n`; groupedByDate[date].forEach(item => { text += `• ${formatPHP(item.amount)} - ${item.facebookId || "No Reference"}\n${item.remarks && item.remarks.trim() ? `   ${item.remarks.trim()}\n` : ''}`; }); });
      text += `\nTOTAL: ${formatPHP(filtered.reduce((s, r) => s + r.amount, 0))}\n\nLmk - thank you.`;
    } else if (tabType === 'debt' && (filter === 'all' || filter === 'overdue' || filter === 'tomorrow')) {
      const asOf = todayObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (filter === 'overdue') {
        const overdueItems = filtered.filter(r => r.date < today); 
        const todayItems = filtered.filter(r => r.date === today);
        text = `Over due and\n    Due today Records \n\nAs of: ${asOf}\n\n✨${tabName.toUpperCase()}✨\n\n`;
        if (overdueItems.length > 0) {
          text += `Over Due Section:\n\n`; 
          const groupedByDate: Record<string, DebtRecord[]> = {}; 
          overdueItems.forEach(r => { if (!groupedByDate[r.date]) groupedByDate[r.date] = []; groupedByDate[r.date].push(r); });
          const sortedDates = Object.keys(groupedByDate).sort();
          sortedDates.forEach(date => { 
            const [ry, rm, rd] = date.split('-').map(Number);
            const rDate = new Date(ry, rm - 1, rd);
            const diffTime = todayObj.setHours(0,0,0,0) - rDate.setHours(0,0,0,0); 
            const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24))); 
            text += `📌'${formatDateMD(date)} Over due ${diffDays}d\n`; 
            groupedByDate[date].sort((a, b) => a.name.localeCompare(b.name)).forEach(item => { 
                text += `${bullet} ${item.name}: ${formatPHP(item.amount)}\n`; 
                if (item.remarks && item.remarks.trim()) {
                    text += `      ${item.remarks.trim()}\n`;
                }
            }); 
            text += `\n`; 
          });
        }
        if (todayItems.length > 0) { 
          text += `Due Today Section:\n\n`;
          text += `📌'${formatDateMD(today).toUpperCase()} Due Today\n`; 
          todayItems.sort((a, b) => a.name.localeCompare(b.name)).forEach(item => { 
            text += `${bullet} ${item.name}: ${formatPHP(item.amount)}\n`; 
            if (item.remarks && item.remarks.trim()) {
              text += `      ${item.remarks.trim()}\n`;
            }
          }); 
          text += `\n`; 
        }
      } else if (filter === 'tomorrow') {
        text = `(Due for tommorow)\nSummary for\n\n✨${tabName.toUpperCase()}✨ \n\nAs of: ${asOf}\n\n📌'DUE TOMMORROW: ${formatDateMD(tomorrowStr).toUpperCase()}\n\n`;
        filtered.sort((a, b) => a.name.localeCompare(b.name)).forEach(item => {
           text += `${bullet} ${item.name}: ${formatPHP(item.amount)}\n`;
           if (item.remarks && item.remarks.trim()) {
             text += `      ${item.remarks.trim()}\n`;
           }
        });
        text += `\n`;
      } else {
        text = `As of: ${asOf}\nAll Loan records: for\n\n✨${tabName.toUpperCase()}✨\n\n`;
        const groupedByDate: Record<string, DebtRecord[]> = {}; filtered.forEach(r => { if (!groupedByDate[r.date]) groupedByDate[r.date] = []; groupedByDate[r.date].push(r); });
        const sortedDates = Object.keys(groupedByDate).sort();
        sortedDates.forEach(date => { 
            let dateHeader = `📌'${formatDateMD(date)}`; 
            if (date < today) { 
                const d1 = new Date(date);
                const d2 = new Date(today);
                const diffTime = d2.getTime() - d1.getTime(); 
                const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24))); 
                dateHeader += ` Over due ${diffDays}d`; 
            } else if (date === today) { 
                dateHeader += ` Due Today`; 
            } else if (date === tomorrowStr) { 
                dateHeader += ` Due Tomorrow`; 
            } else {
                dateHeader += `'`;
            }
            text += `${dateHeader}\n`; 
            groupedByDate[date].sort((a, b) => a.name.localeCompare(b.name)).forEach(item => { 
                text += `${bullet} ${item.name}: ${formatPHP(item.amount)}\n`; 
                if (item.remarks && item.remarks.trim()) {
                    text += `      ${item.remarks.trim()}\n`;
                }
            }); 
            text += `\n`; 
        });
      }
      text += `${settings.copyFooter || 'Thank you - Lmk'}`;
    } else {
      text = `${title} SUMMARY\nSection: ${tabName.toUpperCase()}\n\n`;
      if (tabType === 'debt' || tabType === 'rent') {
         const grouped: Record<string, DebtRecord[]> = {}; filtered.forEach(r => { if (!grouped[r.name]) grouped[r.name] = []; grouped[r.name].push(r); });
         Object.entries(grouped).forEach(([name, items]) => { text += `👤 ${name}\n`; items.sort((a, b) => a.date.localeCompare(b.date)).forEach(item => { text += `  ${bullet} ${formatDateMD(item.date)} - ${formatPHP(item.amount)}${item.remarks ? ` (${item.remarks})` : ''}\n`; }); text += `  Total: ${formatPHP(items.reduce((s, r) => s + r.amount, 0))}\n\n`; });
      } else { filtered.sort((a, b) => a.date.localeCompare(b.date)).forEach(item => { text += `${bullet} ${item.name || item.remarks || 'Entry'}: ${formatPHP(item.amount)}\n  Date: ${formatDateMD(item.date)}\n\n`; }); }
      text += `GRAND TOTAL: ${formatPHP(filtered.reduce((s, r) => s + r.amount, 0))}\n\n${settings.copyFooter || 'Thank you - Lmk'}`;
    }
    navigator.clipboard.writeText(text); showToast(`${title} Copied!`);
  }, [allRecords, settings, showToast]);

  const handleGlobalCopy = useCallback((type: string) => {
    const bullet = settings.copyBullet || '🌸'; 
    const footer = settings.copyFooter || 'Thank you - Lmk';
    let combinedText = ""; 
    let foundAny = false;
    const todayStr = getTodayStr();
    const tomorrowStr = addDays(todayStr, 1);
    
    if (type === 'debt') {
      const today = new Date(); 
      const headerDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      combinedText = `All LOAN SUMMARY \nAs of ${headerDate}\n\n`;
      tabs.forEach(tabName => {
        if ((settings.tabTypes[tabName] || 'debt') === 'debt') {
          const records = allRecords[tabName] || [];
          if (records.length > 0) {
            foundAny = true; 
            combinedText += `✨${tabName.toUpperCase()}✨\n\n`;
            const grouped: Record<string, DebtRecord[]> = {}; 
            records.forEach(r => { if (!grouped[r.date]) grouped[r.date] = []; grouped[r.date].push(r); });
            const sortedDates = Object.keys(grouped).sort();
            sortedDates.forEach(date => {
                let dateHeader = `📌'${formatDateMD(date)}`; 
                if (date < todayStr) { 
                    const d1 = new Date(date);
                    const d2 = new Date(todayStr);
                    const diffTime = d2.getTime() - d1.getTime(); 
                    const diffDays = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24))); 
                    dateHeader += ` Over due ${diffDays}d`; 
                } else if (date === todayStr) { 
                    dateHeader += ` Due Today`; 
                } else if (date === tomorrowStr) { 
                    dateHeader += ` Due Tomorrow`; 
                } else {
                    combinedText += `'`;
                }
                combinedText += `${dateHeader}\n`; 
                grouped[date].sort((a, b) => a.name.localeCompare(b.name)).forEach(r => { 
                    combinedText += `${bullet} ${r.name}: ${formatPHP(r.amount)}\n`; 
                    if (r.remarks && r.remarks.trim()) combinedText += `      ${r.remarks.trim()}\n`;
                }); 
                combinedText += `\n`;
            });
          }
        }
      });
    } else if (type === 'rent') {
      combinedText = `Rental Summary\n\n`;
      tabs.forEach(tabName => {
        if ((settings.tabTypes[tabName] || 'debt') === 'rent') {
          const records = (allRecords[tabName] || []).filter(r => r.status !== 'cancelled' && r.status !== 'legacy');
          if (records.length > 0) {
            foundAny = true;
            combinedText += `✨${tabName.toUpperCase()}✨\n\n`;
            records.sort((a, b) => a.date.localeCompare(b.date)).forEach(r => {
              combinedText += `${bullet} ${r.name}: \n`;
              combinedText += `      (${formatDateMD(r.date)} to ${formatDateMD(r.endDate || r.date)})\n`;
              if (r.remarks && r.remarks.trim()) {
                combinedText += `      (${r.remarks.trim()})\n`;
              }
            });
            combinedText += `\n`;
          }
        }
      });
    } else if (type === 'cashflow') {
      combinedText = `Cash Flow Summary\n\n`;
      tabs.forEach(tabName => {
        if ((settings.tabTypes[tabName] || 'debt') === 'cashflow') {
          const records = allRecords[tabName] || []; let tin = 0, tout = 0; records.forEach(r => { if (r.transactionType === 'income') tin += r.amount; else if (r.transactionType === 'expense') tout += r.amount; });
          foundAny = true; combinedText += `✨${tabName}✨\n\n📈 Total Incoming: ${formatPHP(tin)} \n📉 Total Outgoing: ${formatPHP(tout)} \n      Current Net Balance: ${formatPHP(tin - tout)} \n\n`;
        }
      });
    } else if (type === 'product') {
      combinedText = `Global Product Summary:\n\n`;
      tabs.forEach(tabName => {
        if ((settings.tabTypes[tabName] || 'debt') === 'product') {
          const records = allRecords[tabName] || [];
          if (records.length > 0) {
            foundAny = true; combinedText += `✨${tabName.toUpperCase()}✨\n\n`;
            records.forEach(r => { const totalVal = (r.amount || 0) * (r.price || 0); combinedText += `${bullet}Item name: ${r.name}\n${r.itemCode ? `Item code: ${r.itemCode}\n` : ''}Quantity: ${r.amount}\n${r.minAmount !== undefined ? `Min: ${r.minAmount}\n` : ''}${r.maxAmount !== undefined ? `Max: ${r.maxAmount}\n` : ''}Price: ${formatPHP(r.price || 0)}\n${totalVal > 0 ? `Total value: ${formatPHP(totalVal)}\n\n` : '\n'}`; });
          }
        }
      });
      combinedText += `Thank you - Lmk`;
    } else {
      combinedText = `GLOBAL ${type.toUpperCase()} SUMMARY\nGenerated: ${new Date().toLocaleString()}\n\n`;
      let globalTotal = 0;
      tabs.forEach(tabName => {
        if ((settings.tabTypes[tabName] || 'debt') === type) {
          const records = allRecords[tabName] || [];
          if (records.length > 0) {
            foundAny = true; combinedText += `✨ SECTION: ${tabName.toUpperCase()} ✨\n`;
            records.sort((a, b) => a.date.localeCompare(b.date)).forEach(r => { combinedText += `${bullet} ${r.name || r.remarks || 'Entry'}: ${formatPHP(r.amount)} (${formatDateMD(r.date)})\n`; globalTotal += r.amount; });
            combinedText += `Sub-total: ${formatPHP(records.reduce((s, r) => s + r.amount, 0))}\n\n`;
          }
        }
      });
      if (foundAny) combinedText += `OVERALL TOTAL: ${formatPHP(globalTotal)}\n\n`;
    }
    if (!foundAny) { showToast(`No records found for type: ${type}`, "error"); return; }
    navigator.clipboard.writeText(combinedText + footer); showToast(`Global ${type} Summary Copied!`);
  }, [tabs, allRecords, settings, showToast]);

  const handleCopyAlerts = useCallback(() => {
    const todayStr = getTodayStr();
    const tomorrowStr = addDays(todayStr, 1);
    const bullet = settings.copyBullet || '🌸';
    const footer = settings.copyFooter || 'Thank you - Lmk';
    const now = new Date();
    const asOf = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    let alertText = `(Due Today & Tomorrow)\nAs of: ${asOf}\n\n`;
    let foundAny = false;

    const debtTabs = tabs.filter(t => (settings.tabTypes[t] || 'debt') === 'debt');

    debtTabs.forEach(tabName => {
      const records = (allRecords[tabName] || []).filter(r => r.status !== 'finished' && r.status !== 'cancelled' && r.status !== 'legacy');
      const overdue = records.filter(r => r.date < todayStr);
      const tRecs = records.filter(r => r.date === todayStr);
      const tmRecs = records.filter(r => r.date === tomorrowStr);

      if (overdue.length > 0 || tRecs.length > 0 || tmRecs.length > 0) {
        foundAny = true;
        alertText += `✨${tabName.toUpperCase()}✨ \n\n`;
        
        if (overdue.length > 0) {
          alertText += `📌'OVER DUE SECTION:\n\n`;
          overdue.sort((a, b) => a.date.localeCompare(b.date)).forEach(r => {
            const d1 = new Date(r.date);
            const d2 = new Date(todayStr);
            const diffDays = Math.max(1, Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)));
            alertText += `${bullet} ${r.name}: ${formatDateMD(r.date)}\n`;
            alertText += `      ${formatPHP(r.amount)} (Overdue ${diffDays}d)\n`;
            if (r.remarks && r.remarks.trim()) alertText += `       ${r.remarks.trim()}\n`;
          });
          alertText += `\n`;
        }

        if (tRecs.length > 0) {
          alertText += `📌'DUE TODAY SECTION: \n     ${formatDateMD(todayStr).toUpperCase()}\n\n`;
          tRecs.sort((a, b) => a.name.localeCompare(b.name)).forEach(r => {
            alertText += `${bullet} ${r.name}: ${formatPHP(r.amount)}\n`;
            if (r.remarks && r.remarks.trim()) alertText += `      ${r.remarks.trim()}\n`;
          });
          alertText += `\n`;
        }

        if (tmRecs.length > 0) {
          alertText += `📌'DUE TOMORROW SECTION:\n      ${formatDateMD(tomorrowStr).toUpperCase()}\n\n`;
          tmRecs.sort((a, b) => a.name.localeCompare(b.name)).forEach(r => {
            alertText += `${bullet} ${r.name}: ${formatPHP(r.amount)}\n`;
            if (r.remarks && r.remarks.trim()) alertText += `      ${r.remarks.trim()}\n`;
          });
          alertText += `\n`;
        }
      }
    });

    if (!foundAny) {
      showToast("No urgent dues found", "success");
      return;
    }

    navigator.clipboard.writeText(alertText + footer);
    showToast("Alerts Copied!");
  }, [tabs, allRecords, settings, showToast]);

  const handleDeleteTab = async (name: string) => {
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl; 
    setIsRefreshing(true); 
    setRefreshIsBlocking(true);
    try { 
      if (activeUrl) {
        await fetch(activeUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteTab', tab: name }) 
        });
        await fetch(activeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'deleteRentTabPhoto', tab: name })
        }).catch(e => console.warn("Failed to delete rent photo", e));
      } 
      setTabs(prev => prev.filter(t => t !== name)); 
      setAllRecords(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
      setSettings(prev => {
        const nextTypes = { ...prev.tabTypes };
        delete nextTypes[name];
        const nextRentTabPhotos = { ...prev.rentTabPhotos };
        if (nextRentTabPhotos[name]) delete nextRentTabPhotos[name];
        const nextRentBannerSettings = { ...prev.rentBannerSettings };
        if (nextRentBannerSettings[name]) delete nextRentBannerSettings[name];
        return { ...prev, tabTypes: nextTypes, rentTabPhotos: nextRentTabPhotos, rentBannerSettings: nextRentBannerSettings };
      });
      setDeletingTabName(null); 
      if (activeTab === name) setActiveTab(tabs.filter(t => t !== name)[0] || 'Cash loan'); 
      showToast("Section Deleted"); 
    } 
    catch (e) {
      showToast("Failed to delete section", "error");
    }
    finally { setIsRefreshing(false); }
  };

  const handleRearrangeTabs = useCallback(async (newOrder: string[]) => { 
    setTabs(newOrder); 
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl; 
    if (!activeUrl) return; 
    try { 
      await fetch(activeUrl, { 
        method: 'POST', 
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'reorderTabs', tabs: newOrder }) 
      }); 
    } catch (e) { 
      showToast("Failed to save new tab order to cloud", "error"); 
    } 
  }, [isOfflineMode, settings.scriptUrl, showToast]);
  const handleAddTrigger = useCallback((initialData?: any) => { 
    if (checkTabPermission(activeTab, 'add')) {
      setEditingRecord(initialData || null);
      setIsFormOpen(true); 
    } else showToast("Restricted by administrator", "restricted"); 
  }, [activeTab, checkTabPermission, showToast]);
  const handleEditTrigger = useCallback((record: DebtRecord) => { if (checkTabPermission(activeTab, 'edit')) { setEditingRecord(record); setIsFormOpen(true); } else showToast("Restricted by administrator", "restricted"); }, [activeTab, checkTabPermission, showToast]);
  const handleDeleteTrigger = useCallback((id: string, status: any = 'deleted') => { const actionId = status === 'finished' ? 'finish' : (status === 'cancelled' ? 'cancel' : 'delete'); if (checkTabPermission(activeTab, actionId)) setDeletingRecordData({ id, status }); else showToast("Restricted by administrator", "restricted"); }, [activeTab, checkTabPermission, showToast]);
  const handleDeleteCycleTrigger = useCallback((cycleId: string, entryIds: string[]) => {
    if (checkTabPermission(activeTab, 'delete')) {
      setDeletingCycleData({ cycleId, entryIds });
    } else {
      showToast("Restricted by administrator", "restricted");
    }
  }, [activeTab, checkTabPermission, showToast]);
  const handleAuthSuccess = async (code: string) => {
    const validPin = String(settings.appPin || '0609');
    if (code === "BIOMETRIC_PASS" || code === validPin || passcodeContext?.action === 'setupPersonalCloud') {
      if (passcodeContext) {
        const { action, targetTab, data, nextAction } = passcodeContext as any;
        switch (action) {
          case 'addRecord': setIsFormOpen(true); break;
          case 'openUsers': setIsUsersModalOpen(true); break;
          case 'push': handlePushToServer(); break;
          case 'pull': fetchAllData(false, true); break;
          case 'adjustQty': setAdjustingQtyRecord(data); break;
          case 'deleteTab': if (targetTab) setDeletingTabName(targetTab); break;
          case 'deleteCycle': {
            const { cycleId, entryIds } = data;
            await executeCycleDeletion(cycleId, entryIds);
            break;
          }
          case 'clear': if (targetTab) setClearingTabName(targetTab); break;
          case 'setupPersonalCloud': 
            setIsRefreshing(true); setRefreshIsBlocking(true);
            try {
              const res = await fetch(settings.personalScriptUrl!, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'saveMasterPin', pin: code }) });
              const d = await res.json();
              if (d.status === 'success') { 
                setSettings(prev => ({ ...prev, appPin: code })); 
                showToast("Personal Cloud Security Active", "success"); 
                if (nextAction === 'push') {
                  handlePushToServer();
                } else {
                  fetchAllData(false, true); 
                }
              }
            } finally { setIsRefreshing(false); }
            break;
        }
      }
      setIsPasscodeModalOpen(false); setPasscodeContext(null);
    } else throw new Error("INCORRECT_PIN");
  };
  const handleCloseSummary = useCallback(() => { if (finalSummaryData?.scrubInfo) handleCleanupHistory(finalSummaryData.scrubInfo.name, finalSummaryData.scrubInfo.keepId, finalSummaryData.scrubInfo.tab); setFinalSummaryData(null); }, [finalSummaryData, handleCleanupHistory]);
  
  const handleAddTab = async (name: string, type: TabType) => {
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl; 
    setIsRefreshing(true); 
    setRefreshIsBlocking(true);
    
    try { 
      if (activeUrl) await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'addTab', tab: name, type }) }); 
      
      let newTabOrder: string[] = [];
      
      setTabs(prev => {
        // Group logic: Find all existing tabs of that same type
        const sameTypeTabs = prev.filter(t => settings.tabTypes[t] === type);
        
        if (sameTypeTabs.length > 0) {
          // Insert the new tab after the last occurrence of that type
          const lastOfSameType = sameTypeTabs[sameTypeTabs.length - 1];
          const lastIdx = prev.indexOf(lastOfSameType);
          const updated = [...prev];
          updated.splice(lastIdx + 1, 0, name);
          newTabOrder = updated;
          return updated;
        } else {
          // If no tabs of that type exist, append to the end
          const updated = [...prev, name];
          newTabOrder = updated;
          return updated;
        }
      });
      
      setSettings(prev => ({ ...prev, tabTypes: { ...prev.tabTypes, [name]: type } })); 
      setAllRecords(prev => ({ ...prev, [name]: [] })); 
      setActiveTab(name); 
      setIsAddTabModalOpen(false); 
      showToast("Section Created"); 
      
      // Trigger background sync for the new physical order in Google Sheets
      if (activeUrl && newTabOrder.length > 0) {
        fetch(activeUrl, { 
          method: 'POST', 
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'reorderTabs', tabs: newTabOrder }) 
        }).catch(err => console.warn("Failed to sync new tab order", err));
      }
    } 
    finally { setIsRefreshing(false); }
  };
  
  const handleUpdateTab = async (oldName: string, name: string, type: TabType) => {
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl; setIsRefreshing(true); setRefreshIsBlocking(true);
    try { 
      if (activeUrl) await fetch(activeUrl, { 
        method: 'POST', 
        body: JSON.stringify({ 
          action: 'updateTab', 
          oldTab: oldName, 
          newTab: name, // Keys fixed to match script expectations
          newType: type 
        }) 
      }); 
      setTabs(prev => prev.map(t => t === oldName ? name : t)); 
      setSettings(prev => { 
        const nt = { ...prev.tabTypes }; 
        delete nt[oldName]; 
        nt[name] = type; 
        
        const nextRentTabPhotos = { ...prev.rentTabPhotos };
        if (nextRentTabPhotos[oldName]) {
          nextRentTabPhotos[name] = nextRentTabPhotos[oldName];
          delete nextRentTabPhotos[oldName];
        }

        const nextRentBannerSettings = { ...prev.rentBannerSettings };
        if (nextRentBannerSettings[oldName]) {
          nextRentBannerSettings[name] = nextRentBannerSettings[oldName];
          delete nextRentBannerSettings[oldName];
        }
        
        return { ...prev, tabTypes: nt, rentTabPhotos: nextRentTabPhotos, rentBannerSettings: nextRentBannerSettings }; 
      }); 
      setAllRecords(prev => { 
        const na = { ...prev }; 
        na[name] = na[oldName] || []; 
        delete na[oldName]; 
        return na; 
      }); 
      if (activeTab === oldName) setActiveTab(name); 
      setTabToEdit(null); 
      showToast("Section Updated"); 
    } 
    finally { setIsRefreshing(false); }
  };
  const handleExecuteExtension = async () => { if (!extendingRecordData) return; const updated = { ...extendingRecordData, date: addDays(extendingRecordData.date, 7) }; setExtendingRecordData(null); await handleUpdateRecordInline(updated); showToast("Extended by 7 days"); };
  
  const executeCycleDeletion = async (cycleId: string, entryIds: string[]) => {
    const currentTab = activeTab;
    const previousRecords = allRecords[currentTab] || [];
    
    setIsRefreshing(true);
    setRefreshIsBlocking(false);
    
    // Add to history before optimistic update removes them
    const recordsToDelete = (allRecords[currentTab] || []).filter(r => r.id === cycleId || entryIds.includes(r.id));
    const historyItems = recordsToDelete.map(r => ({ ...r, status: 'deleted' as const, tab: currentTab }));
    
    const tabType = settings.tabTypes[currentTab];
    if (tabType === 'debt' || tabType === 'rent') {
      setSettings(prev => ({
        ...prev,
        deletedHistory: [...historyItems, ...(prev.deletedHistory || [])].slice(0, 50)
      }));
    }

    // Optimistic update
    setAllRecords(prev => {
      const tabRecs = prev[currentTab] || [];
      const idsToDelete = new Set([cycleId, ...entryIds]);
      const filtered = tabRecs.filter(r => !idsToDelete.has(r.id));
      return { ...prev, [currentTab]: filtered };
    });

    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;
    if (activeUrl) {
      try {
        const allIds = [cycleId, ...entryIds];
        // Delete records in parallel
        await Promise.all(allIds.map(id => 
          fetch(activeUrl, {
            method: 'POST',
            body: JSON.stringify({ action: 'deleteRecord', tab: currentTab, id: id })
          })
        ));
      } catch (e) {
        // Rollback
        setAllRecords(prev => ({ ...prev, [currentTab]: previousRecords }));
        console.error("Failed to delete cycle on server", e);
        showToast("Failed to sync delete", "error");
      }
    }
    
    setIsRefreshing(false);
    showToast("Cycle Deleted");
  };

  const handleDeleteCycle = async () => {
    if (!deletingCycleData) return;
    const { cycleId, entryIds } = deletingCycleData;
    
    // If online, require authentication first
    if (!isOfflineMode) {
      setPasscodeContext({ action: 'deleteCycle', data: { cycleId, entryIds } });
      setDeletingCycleData(null);
      setIsPasscodeModalOpen(true);
      return;
    }

    setDeletingCycleData(null);
    await executeCycleDeletion(cycleId, entryIds);
  };

  const handleDeleteRecord = async () => {
    if (!deletingRecordData) return;
    const { id: targetId, status: compStatus } = deletingRecordData; 
    const currentTab = activeTab; 
    const previousRecords = allRecords[currentTab] || [];
    const targetRecord = previousRecords.find(r => r.id === targetId);
    if (!targetRecord) { setDeletingRecordData(null); return; }
    
    const personName = targetRecord.name;
    const allTabRecords = allRecords[currentTab] || [];
    const otherRecordsOfPerson = allTabRecords.filter(r => r.name === personName && r.id !== targetId);
    const remainingCount = otherRecordsOfPerson.length;
    const tabType = settings.tabTypes[currentTab] || 'debt';
    const isDebtTab = tabType === 'debt';
    const isSalesTab = tabType === 'sales';

    let cycleStartToDeleteId: string | null = null;
    if (isSalesTab) {
      const sorted = [...allTabRecords].sort((a, b) => {
         const dateDiff = a.date.localeCompare(b.date);
         if (dateDiff !== 0) return dateDiff;
         return (a.id || '').localeCompare(b.id || '');
      });
      let currentCycleStart: DebtRecord | null = null;
      let currentCycleEntries: DebtRecord[] = [];
      const cycleMap = new Map<string, { start: DebtRecord, entries: DebtRecord[] }>();
      sorted.forEach(r => {
        if (r.salesEntryType === 'expense' || r.transactionType === 'expense') return;
        if (r.salesEntryType === 'cycle_start' || r.remarks === 'Cycle started') {
          currentCycleStart = r;
          currentCycleEntries = [];
        } else if (r.salesEntryType === 'cycle_end') {
          currentCycleStart = null;
        } else if (r.salesEntryType === 'sale' || r.salesEntryType === 'capital' || (!r.salesEntryType && r.remarks !== 'Cycle started')) {
          if (currentCycleStart) {
            currentCycleEntries.push(r);
            cycleMap.set(r.id, { start: currentCycleStart, entries: currentCycleEntries });
          }
        }
      });
      const cycleInfo = cycleMap.get(targetId);
      if (cycleInfo && cycleInfo.start && cycleInfo.entries.length === 1) {
        cycleStartToDeleteId = cycleInfo.start.id;
      }
    }

    setAnimatingDeleteId(targetId); setDeletingRecordData(null); await new Promise(r => setTimeout(r, 500));
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl;
    
    if (isDebtTab && targetRecord.signature && remainingCount > 0) {
      const successorId = otherRecordsOfPerson[0].id;
      setAllRecords(prev => {
        const tabRecs = prev[currentTab] || [];
        const filtered = tabRecs.filter(r => r.id !== targetId);
        const updated = filtered.map(r => r.id === successorId ? {
          ...r,
          signature: targetRecord.signature,
          signatureDate: targetRecord.signatureDate,
          signerName: targetRecord.signerName,
          signerAddress: targetRecord.signerAddress,
          contractTerm: targetRecord.contractTerm,
          contractPeriod: targetRecord.contractPeriod,
          contractAmountPerDue: targetRecord.contractAmountPerDue
        } : r);
        return { ...prev, [currentTab]: updated };
      });
    } else {
      setAllRecords(prev => ({ 
        ...prev, 
        [currentTab]: (prev[currentTab] || []).filter(r => r.id !== targetId && r.id !== cycleStartToDeleteId) 
      })); 
    }

    // Capture record to move to history.
    // If it's the last entry (remainingCount === 0), wipe signature data so it is not persisted in history.
    const recordToHistory = { ...targetRecord, status: (compStatus || 'deleted') as any, tab: currentTab };
    if (remainingCount === 0) {
        delete (recordToHistory as any).signature;
        delete (recordToHistory as any).signatureDate;
        delete (recordToHistory as any).signerName;
        delete (recordToHistory as any).signerAddress;
        delete (recordToHistory as any).contractTerm;
        delete (recordToHistory as any).contractPeriod;
        delete (recordToHistory as any).contractAmountPerDue;
    }

    if (tabType === 'debt' || tabType === 'rent') {
      setSettings(prev => ({ ...prev, deletedHistory: [...prev.deletedHistory, recordToHistory] })); 
    } 
    
    if (!activeUrl) { 
        showToast(cycleStartToDeleteId ? "Cycle Automatically Removed" : "Removed Locally"); 
        setAnimatingDeleteId(null); 
    } else {
        setIsRefreshing(true); 
        setRefreshIsBlocking(false);
        try { 
          const deletePromises = [
            fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'deleteRecord', tab: currentTab, id: targetId, status: compStatus }) })
          ];
          if (cycleStartToDeleteId) {
            deletePromises.push(
              fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'deleteRecord', tab: currentTab, id: cycleStartToDeleteId }) })
            );
          }
          await Promise.all(deletePromises);
          await fetchAllData(true, false, currentTab); 
          showToast(cycleStartToDeleteId ? "Cycle Automatically Removed" : "Entry Removed"); 
        } 
        catch (e) { 
          // Rollback
          setAllRecords(prev => ({ ...prev, [currentTab]: previousRecords }));
          showToast("Sync Issue", "error"); 
        }
        finally { setIsRefreshing(false); setAnimatingDeleteId(null); }
    }

    if (isDebtTab && remainingCount === 0) {
        const currentHistory = [...settings.deletedHistory, recordToHistory]
            .filter(r => 
                r.name?.toLowerCase().trim() === personName.toLowerCase().trim() && 
                r.tab === currentTab && 
                r.status !== 'legacy'
            );
            
        setFinalSummaryData({
            name: personName,
            historyRecords: currentHistory,
            activeTab: currentTab,
            scrubInfo: { name: personName, keepId: targetId, tab: currentTab }
        });
    }
  };

  const handleClearTab = async (name: string) => {
    const activeUrl = isOfflineMode ? '' : settings.scriptUrl; setIsRefreshing(true); setRefreshIsBlocking(true);
    try { if (activeUrl) await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'clearTab', tab: name }) }); setAllRecords(prev => ({ ...prev, [name]: [] })); setClearingTabName(null); showToast("Section Cleared"); } 
    finally { setIsRefreshing(false); }
  };
  const handlePushToServer = async () => { 
    const activeUrl = isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl; 
    if (!activeUrl) return; 
    
    if (!activeUrl.startsWith('https://script.google.com')) {
      showToast("Invalid Script URL", "error");
      return;
    }

    setIsRefreshing(true); 
    setRefreshIsBlocking(true); 
    const pin = settings.appPin;

    try { 
      // Construct list of all tabs to sync, including auxiliary ones for Supply/Product
      const tabsToSync = [...tabs];
      tabs.forEach(t => {
          const type = settings.tabTypes[t];
          if (type === 'supply' || type === 'product') {
              tabsToSync.push(`${t} Incoming`);
              tabsToSync.push(`${t} Outgoing`);
          }
      });

      let serverTabs: string[] = [];
      let isNewSheet = false;
      try {
        const res = await fetch(`${activeUrl}?full=true`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.status === 'error') throw new Error(data.message || 'Script Error');
        if (data.tabs) serverTabs = data.tabs;
        if (!data.appPin && pin) isNewSheet = true;
      } catch (e) { 
        console.warn("Could not fetch server tabs, assuming empty or new sheet.", e); 
        isNewSheet = true;
      }

      if (isNewSheet && pin) {
         await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'saveMasterPin', pin: pin }) });
      }

      await fetch(activeUrl, {
        method: 'POST',
        body: JSON.stringify({
            action: 'saveAccountConfigs',
            pin: pin,
            configs: {
                authorizedSignature: settings.authorizedSignature,
                fundHolderName: settings.fundHolderName,
                operatorName: settings.operatorName,
                lenderName: settings.lenderName,
                githubPagesUrl: settings.githubPagesUrl
            }
        })
      });

      for (const tab of tabsToSync) {
        if (!serverTabs.includes(tab)) {
           try {
             // Determine type
             let type = settings.tabTypes[tab] || 'debt';
             if (tab.endsWith(' Incoming') || tab.endsWith(' Outgoing')) {
                 const parent = tab.replace(/ (Incoming|Outgoing)$/, '');
                 if (settings.tabTypes[parent] === 'supply' || settings.tabTypes[parent] === 'product') {
                     type = 'supply_trans'; // Use supply_trans structure for logs
                 }
             }
             const res = await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'addTab', tab: tab, type: type, pin: pin }) });
             const data = await res.json();
             if (data.status === 'error') throw new Error(data.message || 'Failed to add tab');
           } catch (e: any) {
             console.warn(`Failed to add tab ${tab}:`, e);
           }
        }
      }

      // Delete tabs on server that are not in local tabs
      for (const serverTab of serverTabs) {
        if (!tabsToSync.includes(serverTab) && serverTab !== 'History' && serverTab !== 'Users' && serverTab !== 'Investors' && serverTab !== 'Main Ledger' && !serverTab.startsWith('_')) {
           try {
             await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'deleteTab', tab: serverTab, pin: pin }) });
           } catch (e: any) {
             console.warn(`Failed to delete tab ${serverTab}:`, e);
           }
        }
      }

      for (const tab of tabsToSync) {
        const records = allRecords[tab] || [];
        if (records.length === 0) {
           try {
             const res = await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'clearTab', tab: tab, pin: pin }) });
             const data = await res.json();
             if (data.status === 'error') throw new Error(data.message || `Failed to clear ${tab}`);
           } catch (e: any) {
             console.warn(`Failed to clear tab ${tab}:`, e);
           }
         } else {
           const type = settings.tabTypes[tab] || 'debt';
           let isSupplyLog = false;
           if (tab.endsWith(' Incoming') || tab.endsWith(' Outgoing')) {
               const parent = tab.replace(/ (Incoming|Outgoing)$/, '');
               if (settings.tabTypes[parent] === 'supply' || settings.tabTypes[parent] === 'product') {
                   isSupplyLog = true;
               }
           }
           let dataToSync: any[] = records;
           
            if (type === 'cashflow' && isOfflineMode) {
              // Personal Backup: Sync cash flow data with specific keys that the Apps Script expects
              // The script uses r.id, r.amount, r.date, r.remarks, r.facebookId, r.transactionType, r.tab
              dataToSync = records.map(r => ({
                id: r.id || '',
                amount: Number(r.amount) || 0,
                date: r.date || '',
                remarks: r.remarks || '',
                facebookId: r.facebookId || '',
                transactionType: r.transactionType || '',
                tab: tab
              }));
              
              try {
                await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'saveInitialBalance', tab: tab, balance: settings.cashflowInitialBalances?.[tab] || 0, pin: pin }) });
              } catch (e) {
                console.warn(`Failed to sync initial balance for ${tab}:`, e);
              }
            } else if ((type === 'supply' || type === 'product') && isOfflineMode) {
              // Personal Backup: Sync supply/product data with specific keys for the requested arrangement
              dataToSync = records.map(r => ({
                id: r.id || '',
                transactionType: r.transactionType || 'income',
                name: r.name || '',
                itemCode: r.itemCode || '',
                amount: Number(r.amount) || 0,
                price: Number(r.price) || 0,
                date: r.date || '',
                remarks: r.remarks || '',
                minAmount: Number(r.minAmount) || 0,
                maxAmount: Number(r.maxAmount) || 0
              }));
            } else if (isSupplyLog && isOfflineMode) {
              dataToSync = records.map(r => ({
                id: r.id || '',
                supplySource: r.supplySource || (tab.endsWith(' Incoming') ? 'delivery' : 'sales'),
                name: r.name || '',
                amount: Number(r.amount) || 0,
                date: r.date || '',
                remarks: r.remarks || ''
              }));
            }
           
           const res = await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'bulkReplaceRecords', tab: tab, type: isSupplyLog ? 'supply_trans' : type, records: dataToSync, pin: pin }) });
           const data = await res.json();
           if (data.status === 'error') throw new Error(data.message || `Failed to sync ${tab}`);
        }
      }

      try {
        await fetch(activeUrl, { method: 'POST', body: JSON.stringify({ action: 'bulkUpdateHistory', history: settings.deletedHistory, pin: pin }) }); 
      } catch (e) {
        console.warn("History update failed, continuing backup", e);
      }
      
      // Manual push also triggers metric sync
      await syncGlobalMetricsInBackground();
      
      showToast("Backup & Config Complete"); 
    } catch (e: any) { 
      console.error("Backup failed", e);
      showToast(`Backup Failed: ${e.message || 'Unknown Error'}`, "error"); 
    } 
    finally { setIsRefreshing(false); } 
  };
  const handleTouchStart = (e: React.TouchEvent) => { if (isTransitioning) { if (transitionTimerRef.current) { window.clearTimeout(transitionTimerRef.current); transitionTimerRef.current = null; } setIsTransitioning(false); if (slideContainerRef.current) slideContainerRef.current.style.transition = 'none'; } if (isFormOpen || isSettingsOpen || isUsersModalOpen || isChangePasswordOpen || isAdjustModalOpen || isAdjustBankModalOpen || isGlobalCalculationOpen || isPasscodeModalOpen || finalSummaryData || rentalSummaryData || isTipsOpen || addedRecordToCopy || isExitConfirmOpen || contractRecord || isInvestorModalOpen || isNotificationsOpen || rentBannerOpenTab !== null || investorContractToView || isRefreshing || historyScrubQueue.length > 0) return; touchStartXRef.current = e.touches[0].clientX; touchStartYRef.current = e.touches[0].clientY; gestureType.current = 'none'; };
  const rafId = useRef<number | null>(null); const dragXRef = useRef(0); const dragOpacityRef = useRef(1); const dragBrightnessRef = useRef(1);
  useLayoutEffect(() => { if (gestureType.current === 'horizontal' && slideContainerRef.current) { slideContainerRef.current.style.setProperty('--swipe-offset', `${dragXRef.current}px`); slideContainerRef.current.style.setProperty('--swipe-opacity', `${dragOpacityRef.current}`); slideContainerRef.current.style.setProperty('--swipe-brightness', `${dragBrightnessRef.current}`); } if (gestureType.current === 'refreshing' && slideContainerRef.current) slideContainerRef.current.style.setProperty('--refresh-offset', `${pullDistance}px`); });
  const handleTouchMove = (e: React.TouchEvent) => { if (rentBannerOpenTab !== null) return; if (touchStartXRef.current === null || touchStartYRef.current === null) return; const currentX = e.touches[0].clientX; const currentY = e.touches[0].clientY; const diffX = currentX - touchStartXRef.current; const diffY = currentY - touchStartYRef.current; if (gestureType.current === 'none') { if (Math.abs(diffX) > 10 && Math.abs(diffX) > Math.abs(diffY)) gestureType.current = 'horizontal'; else if (diffY > 10 && Math.abs(diffY) > Math.abs(diffX)) { const container = containerRefs.current[activeTab]; if (container && container.scrollTop <= 0 && !isOfflineMode) gestureType.current = 'refreshing'; else gestureType.current = 'scrolling'; } else if (diffY < -10 && Math.abs(diffY) > Math.abs(diffX)) { const container = containerRefs.current[activeTab]; if (container && container.scrollHeight - container.scrollTop <= container.clientHeight + 1) gestureType.current = 'bottom-stretch'; else gestureType.current = 'scrolling'; } else if (Math.abs(diffY) > 5) gestureType.current = 'scrolling'; } if (gestureType.current === 'horizontal') { if (e.cancelable) e.preventDefault(); let clX = diffX; let scaleX = 1; let originX = 'center'; if (activeIndex === 0 && diffX > 0) { clX = 0; scaleX = 1 + (diffX / window.innerWidth) * 0.15; originX = '0%'; } else if (activeIndex === visibleTabs.length - 1 && diffX < 0) { clX = 0; scaleX = 1 + (Math.abs(diffX) / window.innerWidth) * 0.15; originX = `${(activeIndex + 1) * 100}%`; } const width = window.innerWidth; const progress = Math.min(Math.abs(clX) / (width * 0.4), 1); dragXRef.current = clX; dragOpacityRef.current = 1; dragBrightnessRef.current = 1; if (rafId.current) cancelAnimationFrame(rafId.current); rafId.current = requestAnimationFrame(() => { if (slideContainerRef.current) { slideContainerRef.current.style.setProperty('--swipe-offset', `${clX}px`); slideContainerRef.current.style.setProperty('--swipe-opacity', `${dragOpacityRef.current}`); slideContainerRef.current.style.setProperty('--swipe-brightness', `${dragBrightnessRef.current}`); slideContainerRef.current.style.setProperty('--swipe-scale-x', `${scaleX}`); slideContainerRef.current.style.setProperty('--swipe-origin-x', originX); slideContainerRef.current.style.transition = 'none'; } }); } else if (gestureType.current === 'bottom-stretch') { if (e.cancelable) e.preventDefault(); let scaleY = 1 + (Math.abs(diffY) / window.innerHeight) * 0.15; if (rafId.current) cancelAnimationFrame(rafId.current); rafId.current = requestAnimationFrame(() => { if (slideContainerRef.current) { slideContainerRef.current.style.setProperty('--swipe-scale-y', `${scaleY}`); slideContainerRef.current.style.setProperty('--swipe-origin-y', 'bottom'); slideContainerRef.current.style.transition = 'none'; } }); } else if (gestureType.current === 'refreshing') { if (e.cancelable) e.preventDefault(); const dist = Math.max(0, diffY * 0.5); setPullDistance(dist); if (dist >= REFRESH_THRESHOLD && pullDistance < REFRESH_THRESHOLD) if (window.navigator.vibrate) window.navigator.vibrate(10); } };
  const handleTouchEnd = (e: React.TouchEvent) => { if (touchStartXRef.current === null) return; if (rafId.current) cancelAnimationFrame(rafId.current); if (gestureType.current === 'horizontal') { const threshold = window.innerWidth * 0.18; const diffX = e.changedTouches[0].clientX - (touchStartXRef.current || 0); let nextIndex = activeIndex; if (diffX > threshold && activeIndex > 0) nextIndex = activeIndex - 1; else if (diffX < -threshold && activeIndex < visibleTabs.length - 1) nextIndex = activeIndex + 1; setIsTransitioning(true); if (nextIndex !== activeIndex) setActiveTab(visibleTabs[nextIndex]); if (slideContainerRef.current) { slideContainerRef.current.style.setProperty('--swipe-offset', '0px'); slideContainerRef.current.style.setProperty('--swipe-opacity', '1'); slideContainerRef.current.style.setProperty('--swipe-brightness', '1'); slideContainerRef.current.style.setProperty('--swipe-scale-x', '1'); slideContainerRef.current.style.transition = 'transform 350ms cubic-bezier(0.23, 1, 0.32, 1)'; } dragXRef.current = 0; dragOpacityRef.current = 1; dragBrightnessRef.current = 1; if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current); transitionTimerRef.current = window.setTimeout(() => { setIsTransitioning(false); transitionTimerRef.current = null; if (slideContainerRef.current) slideContainerRef.current.style.transition = 'none'; }, 350); } else if (gestureType.current === 'bottom-stretch') { if (slideContainerRef.current) { slideContainerRef.current.style.setProperty('--swipe-scale-y', '1'); slideContainerRef.current.style.transition = 'transform 350ms cubic-bezier(0.23, 1, 0.32, 1)'; } if (transitionTimerRef.current) window.clearTimeout(transitionTimerRef.current); transitionTimerRef.current = window.setTimeout(() => { if (slideContainerRef.current) slideContainerRef.current.style.transition = 'none'; }, 350); } else if (gestureType.current === 'refreshing') { if (pullDistance >= REFRESH_THRESHOLD) fetchAllData(false, true, activeTab); setPullDistance(0); } touchStartXRef.current = null; touchStartYRef.current = null; gestureType.current = 'none'; };
  const handleExitApp = async () => { 
    if (Capacitor.isNativePlatform()) {
      const { App: CapApp } = await import('@capacitor/app');
      CapApp.exitApp();
    }
  };
  const getForbiddenUrl = useCallback(() => { const otherSettingsStr = localStorage.getItem(`app_settings${isOfflineMode ? '_enterprise' : '_personal'}`); if (otherSettingsStr) { try { const other = JSON.parse(otherSettingsStr); return isOfflineMode ? other.scriptUrl : other.personalScriptUrl; } catch (e) { return undefined; } } return undefined; }, [isOfflineMode]);
  const onOpenContract = (record: DebtRecord) => { 
    if (record.tab === 'Investment') {
      const originalInvestor = investors.find(i => i.id === record.id);
      if (originalInvestor) {
        setInvestorContractToView(originalInvestor);
      }
    } else {
      setContractRecord(record); 
    }
  };

  const isSyncing = isRefreshing || historyScrubQueue.length > 0;
  const isSynchronizedMsg = toast.message === 'Synchronized' || toast.message === 'Personal Cloud Restored';
  const isBlueToast = isSyncing || isSynchronizedMsg;
  const isError = !isBlueToast && toast.type === 'error';
  const isRestricted = !isBlueToast && toast.type === 'restricted';
  const isSuccess = !isBlueToast && !isError && !isRestricted;
  const toastBg = isBlueToast ? 'rgba(37, 99, 235, 0.9)' : 'rgba(255, 255, 255, 0.95)';
  const toastTextColor = isBlueToast ? 'white' : '#1e293b';
  const toastBorder = isBlueToast ? 'none' : '1px solid rgba(0,0,0,0.05)';
  const shimmerColorClass = isBlueToast ? 'via-white/40' : isSuccess ? 'via-emerald-500/20' : isError ? 'via-rose-500/20' : null;

  return (
    <div className="h-full max-w-lg mx-auto bg-slate-50 relative flex flex-col overflow-hidden" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-rose-500 text-white text-xs font-bold text-center py-1 px-4 shadow-md z-50 flex items-center justify-center gap-2"
          >
            <CloudOffIcon size={12} />
            <span>No Internet Connection</span>
          </motion.div>
        )}
      </AnimatePresence>
      {isRefreshing && <div className="fixed inset-0 z-[120000] cursor-wait pointer-events-auto touch-none bg-transparent" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}></div>}
      {!isInitialLoad && (toast.visible || isRefreshing || historyScrubQueue.length > 0) && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[140000] ${toast.leaving ? 'animate-toast-out' : 'animate-toast-in'}`}>
          <div className={`relative overflow-hidden backdrop-blur-2xl px-6 py-4 rounded-[2rem] flex items-center gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.3)] font-bold text-sm ${isSyncing ? 'animate-beating' : ''}`} style={{ backgroundColor: toastBg, color: toastTextColor, border: toastBorder }}>
            {shimmerColorClass ? (
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                <div 
                  className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent to-transparent animate-shimmer-flow" 
                  style={{ 
                    background: `linear-gradient(90deg, transparent, ${shimmerColorClass === 'via-white/40' ? 'rgba(255,255,255,0.4)' : shimmerColorClass === 'via-emerald-500/20' ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}, transparent)`,
                    transform: 'skewX(-20deg)'
                  }} 
                />
              </div>
            ) : null}
            <div className="relative flex items-center gap-2 z-10">
              {isSyncing ? <SpinnerIcon /> : isError ? <XCircleIcon className="text-rose-500" /> : isRestricted ? <ShieldIcon /> : isSynchronizedMsg ? <AnimatedCheckIcon /> : <SuccessIconSolid />}
              <span className={`max-w-[80vw] ${toast.message.includes('\n') ? 'whitespace-pre-wrap text-center text-xs leading-tight py-1' : 'whitespace-nowrap truncate'}`}>
                {historyScrubQueue.length > 0 ? "Scrubbing history..." : isRefreshing ? (isOfflineMode ? (isCheckingPasscode ? "Checking Passcode" : "Linking Personal Cloud...") : "Synchronizing...") : toast.message}
              </span>
            </div>
          </div>
        </div>
      )}
      {isInitialLoad ? <LoadingOverlay isVisible={true} message={isOfflineMode ? "Personal Ledger Welcome..." : "Decrypting Ledger..."} color={settings.loadingColor} /> : !session ? <LoginScreen onLogin={handleLogin} initialScriptUrl={settings.scriptUrl} themeColor={settings.loadingColor} /> : (
        <>
          {session && !isOnline && (
            <div className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white text-[10px] font-black uppercase tracking-widest text-center py-1 shadow-md pt-safe">
              NO INTERNET CONNECTION
            </div>
          )}
          <header 
            className={`sticky top-0 z-50 shadow-sm shrink-0 pt-safe mb-4 transition-opacity duration-300 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}
            style={{ backgroundColor: `color-mix(in srgb, ${settings.loadingColor}, white 94%)` }}
          >
              <div className="px-4 py-3 flex justify-between items-center border-b border-slate-100 gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 min-w-0"><h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate shrink-0">Nica.Lmk.Corp</h1></div>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => setIsNotificationsOpen(true)} className="p-2 bg-blue-50 text-blue-600 rounded-lg active:scale-90 transition-transform relative flex items-center justify-center shadow-sm border border-blue-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                      {allSignedRecords.length > 0 && <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>}
                    </button>
                    {isOfflineMode ? <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-100 rounded-lg text-[9px] font-black text-amber-700 uppercase tracking-[0.1em] shadow-sm"><CloudOffIcon size={10} /> PERSONAL</div> : <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 rounded-lg text-[9px] font-black text-amber-700 uppercase tracking-[0.1em] shadow-sm"><CloudIcon size={10} /> CLOUD</div>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isMaster && (
                    <button onClick={() => setIsInvestorModalOpen(true)} className="p-2 bg-slate-900 text-white rounded-xl shadow-lg active:scale-95 transition-transform mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    </button>
                  )}
                  <UserMenu session={session} onLogout={handleLogout} onChangePassword={() => setIsChangePasswordOpen(true)} themeColor={settings.loadingColor} />
                  {isMaster && <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-slate-50 text-slate-500 rounded-xl border border-slate-200 active:scale-95 transition-transform"><SettingsIcon /></button>}
                </div>
              </div>
              {!settings.restrictedTabMode && isMaster && (
                <div className="bg-transparent border-b border-slate-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                   <div className="flex bg-white/60 p-1 rounded-xl shrink-0 backdrop-blur-sm shadow-sm border border-white/40">
                     <button onClick={handleUndo} disabled={past.length === 0 || isRefreshing} className={`p-1.5 rounded-lg ${past.length > 0 && !isRefreshing ? 'text-blue-600' : 'text-slate-300'}`}><UndoIcon /></button>
                     <button onClick={handleRedo} disabled={future.length === 0 || isRefreshing} className={`p-1.5 rounded-lg ${future.length > 0 && !isRefreshing ? 'text-blue-600' : 'text-slate-300'}`}><RedoIcon /></button>
                   </div>
                   <div className="flex gap-2 flex-1 justify-end">
                     <button onClick={() => setIsGlobalCopyModalOpen(true)} className="flex-1 py-2.5 bg-white border border-white/60 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm"><CopyIcon /> GLOBAL COPY</button>
                     <button onClick={() => setIsGlobalCalculationOpen(true)} className="flex-1 py-2.5 bg-white border border-white/60 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm"><CalculatorIconSmall /> GLOBAL CALC</button>
                   </div>
                </div>
              )}
              <TabManager tabs={visibleTabs} activeTab={activeTab} tabTypes={settings.tabTypes} onSwitch={setActiveTab} onAdd={() => setIsAddTabModalOpen(true)} onRename={(name) => setTabToEdit({name, type: settings.tabTypes[name]})} onDelete={(name) => { if (isOfflineMode) setDeletingTabName(name); else { setPasscodeContext({ action: 'deleteTab', targetTab: name }); setIsPasscodeModalOpen(true); } }} onRearrange={handleRearrangeTabs} lastDashboardInteraction={lastDashboardInteraction} showAddButton={isMaster} themeColor={settings.loadingColor} />
          </header>
          <main ref={mainContentRef} className={`flex-1 relative overflow-hidden transition-opacity duration-300 bg-slate-50 ${isRefreshing ? 'opacity-50 pointer-events-none' : 'opacity-100'}`} style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}>
            <div className="absolute top-0 left-0 w-full flex items-center justify-center overflow-hidden transition-all duration-200" style={{ height: `${pullDistance}px`, opacity: Math.min(1, pullDistance / REFRESH_THRESHOLD), transform: `translateY(${Math.min(0, pullDistance - REFRESH_THRESHOLD)}px)` }}>
              <div className={`p-2 rounded-full bg-white shadow-lg border border-slate-100 flex items-center gap-2 ${pullDistance >= REFRESH_THRESHOLD ? 'animate-bounce' : ''}`}>
                <div className={`w-5 h-5 border-2 border-blue-100 border-t-blue-500 rounded-full ${pullDistance >= REFRESH_THRESHOLD ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 4}deg)` }}></div>
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{pullDistance >= REFRESH_THRESHOLD ? 'Release to Sync' : 'Pull to Refresh'}</span>
              </div>
            </div>
            <div ref={slideContainerRef} className={`flex h-full will-change-transform bg-slate-50 gpu-layer ${isTransitioning ? 'transition-all duration-350 cubic-bezier(0.23, 1, 0.32, 1)' : ''}`} style={{ '--active-index': activeIndex, '--swipe-offset': '0px', '--swipe-opacity': '1', '--swipe-brightness': '1', '--swipe-scale-x': '1', '--swipe-scale-y': '1', '--swipe-origin-x': 'center', '--swipe-origin-y': 'center', '--refresh-offset': `${pullDistance}px`, opacity: 'var(--swipe-opacity)', filter: 'brightness(var(--swipe-brightness))', transform: `translate3d(calc(var(--active-index) * -100% + var(--swipe-offset)), var(--refresh-offset), 0.1px) scaleX(var(--swipe-scale-x)) scaleY(var(--swipe-scale-y))`, transformOrigin: 'var(--swipe-origin-x) var(--swipe-origin-y)', transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' } as React.CSSProperties}>
              {visibleTabs.map((tab, idx) => {
                const isCurrent = idx === activeIndex; const isNeighbor = Math.abs(idx - activeIndex) <= 1;
                return (
                  <div key={tab} ref={el => containerRefs.current[tab] = el} className="w-full h-full shrink-0 overflow-y-auto no-scrollbar relative overscroll-y-none gpu-layer bg-slate-50" style={{ visibility: isNeighbor ? 'visible' : 'hidden', pointerEvents: isCurrent ? 'auto' : 'none', contain: 'layout paint', zIndex: isCurrent ? 1 : 0, transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
                    {isNeighbor && (
                      <TabPage tab={tab} tabType={settings.tabTypes[tab] || 'debt'} records={allRecords[tab] || []} spreadsheetUrl={settings.spreadsheetUrl} scriptUrl={isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl} allRecords={allRecords} onAdd={handleAddTrigger} onHistory={() => setIsHistoryOpen(true)} onEdit={handleEditTrigger} onUpdateRecord={handleUpdateRecordInline} onBulkAdd={handleRecordSubmit} onLocalCopy={handleLocalTabCopy} onClearTab={(name: string) => { if (isOfflineMode) setClearingTabName(name); else { setPasscodeContext({ action: 'clear', targetTab: name }); setIsPasscodeModalOpen(true); } }} highlightedId={highlightedRecordId} animatingDeleteId={animatingDeleteId} onAdjustEarnings={() => { if (checkTabPermission(tab, 'adjust_earnings')) setIsAdjustModalOpen(true); else showToast("Access Denied", "restricted"); }} onAdjustBankBalance={(mode: any) => { if (checkTabPermission(tab, 'adjust_bank')) { setAdjustBankMode(mode); setIsAdjustBankModalOpen(true); } else showToast("Access Denied", "restricted"); }} addedRecordToCopy={addedRecordToCopy} onDismissCopy={handleDismissCopy} formatCopyDetails={formatCopyDetails} showToast={showToast} onOpenTips={onOpenTips} cashFlowFilter={cashFlowFilter} onSetCashFlowFilter={setCashFlowFilter} currencyConfig={settings.currencyConfigs?.[tab]} onUpdateCurrencyConfig={(c: any) => handleUpdateCurrencyConfig(tab, c)} onAdjustQty={(r: any) => { if (checkTabPermission(tab, 'adjust_qty')) { const activeScriptUrl = isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl; if (!activeScriptUrl) { setAdjustQtyDualConfirmRecord(r); } else { setPasscodeContext({ action: 'adjustQty', data: r }); setIsPasscodeModalOpen(true); } } else { showToast("Access Denied", "restricted"); } }} appPin={settings.appPin} isMaster={isMaster} biometricEnabled={settings.biometricSensitiveEnabled} settings={settings} session={session} onLogAction={handleLogAction} onOpenContract={onOpenContract} onDelete={handleDeleteTrigger} onDeleteCycle={handleDeleteCycleTrigger} onRenew={(r: DebtRecord) => handleConfirmExtend(r)} onKeepReuse={(r: DebtRecord) => handleConfirmExtend(r)} onExtend={(r: DebtRecord) => setExtendingRecordData(r)} onEndSalesCycle={handleEndSalesCycle} investors={investors} pendingDraftIds={pendingDraftIds} salesEntryTypeFilter={salesEntryTypeFilter} onSetSalesEntryTypeFilter={setSalesEntryTypeFilter} rentBannerOpenTab={rentBannerOpenTab} onRentBannerOpenChange={(isOpen: boolean) => setRentBannerOpenTab(isOpen ? tab : null)} onSaveRentPhoto={(photo: string) => handleSaveRentPhoto(tab, photo)} rentBannerSettings={settings.rentBannerSettings?.[tab]} onSaveRentBannerSettings={(s: RentBannerSettings) => handleSaveRentBannerSettings(tab, s)} />
                    )}
                  </div>
                );
              })}
            </div>
          </main>
        </>
      )}
      <AnimatePresence>
        {isFormOpen && <RecordForm onClose={() => setIsFormOpen(false)} onSubmit={handleRecordSubmit} initialData={editingRecord} activeTab={activeTab} activeTabType={settings.tabTypes[activeTab] || 'debt'} records={allRecords[activeTab] || []} currencyConfig={settings.currencyConfigs?.[activeTab] || { primary: 'PHP', secondary: 'USD', useSecondary: false, exchangeRate: 1 }} appPin={settings.appPin} isMaster={isMaster} biometricEnabled={settings.biometricSensitiveEnabled} session={session} showToast={showToast} />}
      </AnimatePresence>
      <AnimatePresence>
        {isSettingsOpen && <SettingsModal 
          onClose={() => setIsSettingsOpen(false)} 
          settings={settings} 
          onSave={setSettings} 
          allTabs={tabs} 
          onToggleRestriction={() => {}} 
          onManageUsers={() => { setPasscodeContext({ action: 'openUsers' }); setIsPasscodeModalOpen(true); }} 
          showToast={showToast} 
          isOfflineMode={isOfflineMode} 
          onPushToServer={async () => { 
            if (isOfflineMode && settings.personalScriptUrl) {
              setIsRefreshing(true); setRefreshIsBlocking(true); setIsCheckingPasscode(true);
              try {
                const res = await fetch(`${settings.personalScriptUrl}?tab=_TabConfigs_`);
                const data = await res.json();
                if (!data.appPin) {
                  setPasscodeContext({ action: 'setupPersonalCloud', nextAction: 'push' });
                  setIsPasscodeModalOpen(true);
                } else {
                  setPasscodeContext({ action: 'push' });
                  setIsPasscodeModalOpen(true);
                }
              } catch (e) {
                showToast("Cloud Connection Failed", "error");
              } finally {
                setIsRefreshing(false); setIsCheckingPasscode(false);
              }
            } else {
              setPasscodeContext({ action: 'push' });
              setIsPasscodeModalOpen(true);
            }
          }} 
          onPullFromServer={async () => { 
            if (isOfflineMode && settings.personalScriptUrl) {
              setIsRefreshing(true); setRefreshIsBlocking(true); setIsCheckingPasscode(true);
              try {
                const res = await fetch(`${settings.personalScriptUrl}?tab=_TabConfigs_`);
                const data = await res.json();
                if (!data.appPin) {
                  setPasscodeContext({ action: 'setupPersonalCloud', nextAction: 'pull' });
                  setIsPasscodeModalOpen(true);
                } else {
                  setPasscodeContext({ action: 'pull' });
                  setIsPasscodeModalOpen(true);
                }
              } catch (e) {
                showToast("Cloud Connection Failed", "error");
              } finally {
                setIsRefreshing(false); setIsCheckingPasscode(false);
              }
            } else {
              setPasscodeContext({ action: 'pull' });
              setIsPasscodeModalOpen(true);
            }
          }} 
          onGoOnline={(sUrl) => { handleLogin({ role: 'master', isOffline: false }, sUrl); }} 
          forbiddenUrl={getForbiddenUrl()} 
        />}
      </AnimatePresence>
      {isHistoryOpen && <HistoryModal onClose={() => setIsHistoryOpen(false)} history={settings.deletedHistory} onReuse={(r) => { setEditingRecord({ ...r, id: '', status: 'active', date: getTodayStr() }); setIsFormOpen(true); setIsHistoryOpen(false); }} onDeleteFromHistory={handleManualHistoryDelete} onViewContract={(r) => setContractRecord(r)} />}
      <AnimatePresence>
        {isNotificationsOpen && <NotificationsModal onClose={() => setIsNotificationsOpen(false)} signedRecords={allSignedRecords} onOpenContract={onOpenContract} />}
      </AnimatePresence>
      {isAdjustModalOpen && <AdjustEarningsModal isOpen={true} onClose={() => setIsAdjustModalOpen(false)} adjustments={settings.earningsAdjustments || { month: 0, year: 0 }} onSave={(adj) => setSettings(prev => ({ ...prev, earningsAdjustments: adj }))} />}
      {isAdjustBankModalOpen && <AdjustBankBalanceModal isOpen={true} onClose={() => setIsAdjustBankModalOpen(false)} initialBalance={settings.cashflowInitialBalances?.[activeTab] || 0} onSave={handleUpdateInitialBalance} mode={adjustBankMode} />}
      {isGlobalCalculationOpen && <GlobalCalculationModal isOpen={true} onClose={() => setIsGlobalCalculationOpen(false)} allRecords={allRecords} tabs={tabs} settings={settings} />}
      {isGlobalCopyModalOpen && <GlobalCopyModal isOpen={true} onClose={() => setIsGlobalCopyModalOpen(false)} onCopyGlobal={handleGlobalCopy} onCopyAlerts={handleCopyAlerts} />}
      {isPasscodeModalOpen && <PasscodeModal isOpen={true} onClose={() => { setIsPasscodeModalOpen(false); setPasscodeContext(null); }} onSuccess={handleAuthSuccess} title={passcodeContext?.action === 'setupPersonalCloud' ? 'Initialize Cloud' : 'Security Check'} message={passcodeContext?.action === 'setupPersonalCloud' ? 'Set a PIN to secure your private sheet.' : 'Enter your passcode to proceed.'} biometricEnabled={settings.biometricSensitiveEnabled} />}
      {finalSummaryData && <FinalSummaryModal isOpen={true} onClose={handleCloseSummary} name={finalSummaryData.name} historyRecords={finalSummaryData.historyRecords} activeTab={finalSummaryData.activeTab} showToast={showToast} copyBullet={settings.copyBullet} copyFooter={settings.copyFooter} scrubInfo={finalSummaryData.scrubInfo} />}
      {rentalSummaryData && <RentalSummaryModal isOpen={true} onClose={() => setRentalSummaryData(null)} records={rentalSummaryData.records} tab={rentalSummaryData.tab} totalYearEarnings={rentalSummaryData.total} showToast={showToast} />}
      {isTipsOpen && <TipsModal isOpen={true} onClose={() => setIsTipsOpen(false)} type={settings.tabTypes[activeTab] || 'debt'} />}
      {isUsersModalOpen && <UsersModal onClose={() => setIsUsersModalOpen(false)} users={users} onAddUser={(u) => handleUserAction(u, 'addUser')} onUpdateUser={(u) => handleUserAction(u, 'updateUser')} onDeleteUser={(id) => handleUserAction({ id } as AppUser, 'deleteUser')} allTabs={tabs} tabTypes={settings.tabTypes} themeColor={settings.loadingColor} />}
      {isInvestorModalOpen && <InvestorModal isOpen={true} onClose={() => setIsInvestorModalOpen(false)} investors={investors} onAddInvestor={handleAddInvestor} onUpdateInvestor={handleUpdateInvestor} onDeleteInvestor={handleDeleteInvestor} onDeleteSignature={(id, type) => handleDeleteSignature(id, type)} currencyConfig={settings.currencyConfigs?.[activeTab]} scriptUrl={isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl} githubPagesUrl={settings.githubPagesUrl} showToast={showToast} authorizedSignature={settings.authorizedSignature} fundHolderName={settings.fundHolderName} />}
      {isChangePasswordOpen && session && <ChangePasswordModal onClose={() => setIsChangePasswordOpen(false)} onSubmit={handleChangePassword} username={session.username || ''} />}
      {adjustingQtyRecord && <AdjustQtyModal isOpen={true} onClose={() => setAdjustingQtyRecord(null)} itemName={adjustingQtyRecord.name} initialQty={adjustingQtyRecord.amount} onConfirm={(newQty) => { handleUpdateRecordInline({ ...adjustingQtyRecord, amount: newQty }); setAdjustingQtyRecord(null); }} />}
      {isAddTabModalOpen && <AddTabModal isOpen={true} onClose={() => setIsAddTabModalOpen(false)} onConfirm={handleAddTab} existingTabs={tabs} />}
      {tabToEdit && <TabSettingsModal isOpen={true} onClose={() => setTabToEdit(null)} onConfirm={(n, t) => handleUpdateTab(tabToEdit.name, n, t)} currentName={tabToEdit.name} currentType={tabToEdit.type} hasRecords={(allRecords[tabToEdit.name] || []).length > 0} allTabs={tabs} />}
      <ConfirmModal isOpen={!!extendingRecordData} onClose={() => setExtendingRecordData(null)} onConfirm={handleExecuteExtension} title="Confirm Extension" message={`Extend due date for "${extendingRecordData?.name}" by 7 days to ${extendingRecordData ? formatDateMD(addDays(extendingRecordData.date, 7)) : ''}?`} confirmText="Extend" confirmVariant="warning" />
      <ConfirmModal isOpen={!!deletingRecordData} onClose={() => setDeletingRecordData(null)} onConfirm={handleDeleteRecord} title="Confirm Delete" message="Are you sure you want to delete this entry?" />
      <ConfirmModal isOpen={!!deletingCycleData} onClose={() => setDeletingCycleData(null)} onConfirm={handleDeleteCycle} title="Delete Sales Cycle" message="Are you sure you want to delete this sales cycle and all its entries?" />
      <DualConfirmModal isOpen={!!deletingTabName} onClose={() => setDeletingTabName(null)} onConfirm={() => deletingTabName && handleDeleteTab(deletingTabName)} title="Delete Section" message={`Are you sure you want to delete "${deletingTabName}"?`} />
      <DualConfirmModal isOpen={!!clearingTabName} onClose={() => setClearingTabName(null)} onConfirm={() => clearingTabName && handleClearTab(clearingTabName)} title="Clear Ledger" message={`Are you sure you want to clear all records in "${clearingTabName}"?`} />
      <DualConfirmModal isOpen={!!adjustQtyDualConfirmRecord} onClose={() => setAdjustQtyDualConfirmRecord(null)} onConfirm={() => { if (adjustQtyDualConfirmRecord) { setAdjustingQtyRecord(adjustQtyDualConfirmRecord); setAdjustQtyDualConfirmRecord(null); } }} title="Unlock Quantity" message="Two-hand confirmation required to manually adjust stock quantity." confirmLabel="Unlock" />
      <ConfirmModal isOpen={isExitConfirmOpen} onClose={() => setIsExitConfirmOpen(false)} onConfirm={handleExitApp} title="Exit App?" message="Are you sure you want to close Nica Lmk Corp?" confirmText="Exit" confirmVariant="danger" />
      <ErrorRetryModal isOpen={!!syncErrorMessage} onRetry={() => { const a = pendingSyncAction; setSyncErrorMessage(""); setPendingSyncAction(null); if (a) a(); }} message={syncErrorMessage} />
      {contractRecord && <ContractModal isOpen={true} onClose={() => setContractRecord(null)} record={contractRecord} tabType={(settings.tabTypes[contractRecord.tab || activeTab] || 'debt') as TabType} scriptUrl={settings.scriptUrl || ''} githubPagesUrl={settings.githubPagesUrl} currencySymbol={settings.currencyConfigs?.[contractRecord.tab || activeTab]?.primary || 'PHP'} authorizedSignature={settings.authorizedSignature} lenderName={settings.lenderName} operatorName={settings.operatorName} onDeleteSignature={(id, type, tab) => handleDeleteSignature(id, type, tab)} onSaveContractDetails={handleUpdateContractDetails} onGenerateLink={(id) => setPendingDraftIds(prev => prev.includes(id) ? prev : [...prev, id])} />}
      {investorContractToView && <InvestorContractModal isOpen={true} onClose={() => setInvestorContractToView(null)} investor={investorContractToView} scriptUrl={(isOfflineMode ? settings.personalScriptUrl : settings.scriptUrl) || ''} githubPagesUrl={settings.githubPagesUrl} currencyCode={settings.currencyConfigs?.[activeTab]?.primary || 'PHP'} authorizedSignature={settings.authorizedSignature} fundHolderName={settings.fundHolderName} onDeleteSignature={(id, type) => handleDeleteSignature(id, type)} />}
      <SyncOverlay isVisible={isRefreshing} isBlocking={refreshIsBlocking} accentColor={settings.loadingColor} />
    </div>
  );
};

export default App;