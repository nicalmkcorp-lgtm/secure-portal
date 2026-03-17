
import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { DebtRecord } from '../types';
import { formatDateShort } from '../utils';
import ConfirmModal from './ConfirmModal';

interface HistoryModalProps {
  onClose: () => void;
  history: DebtRecord[];
  tabType: string;
  tabName: string;
  activeUrl: string;
  showToast: (message: string, type?: 'success' | 'error' | 'restricted') => void;
  initialRecentActions?: any[];
  isOfflineMode?: boolean;
  deletedActionItem?: any;
  onReuse: (record: DebtRecord) => void;
  onDeleteFromHistory: (record: DebtRecord, scrubPerson: boolean) => void | Promise<void>;
  onDeleteActionHistory?: (action: any) => void;
  onViewContract: (record: DebtRecord) => void;
  isMaster?: boolean;
}

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const TrashIcon = ({ size = 16 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>;
const FileTextIcon = ({ size = 16 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>;
const RefreshCwIcon = ({ size = 16 }) => <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;

const HistoryModal: React.FC<HistoryModalProps> = ({ onClose, history = [], tabType, tabName, activeUrl, showToast, initialRecentActions = [], isOfflineMode = false, deletedActionItem, onReuse, onDeleteFromHistory, onDeleteActionHistory, onViewContract, isMaster = true }) => {
  const [search, setSearch] = useState('');
  const [recordToDelete, setRecordToDelete] = useState<DebtRecord | null>(null);
  const [actionToDelete, setActionToDelete] = useState<any | null>(null);
  const isDebtOrRent = tabType === 'debt' || tabType === 'rent';
  const [activeTab, setActiveTab] = useState<'reuse' | 'actions'>(isDebtOrRent ? 'reuse' : 'actions');
  const [openActionRecord, setOpenActionRecord] = useState<DebtRecord | null>(null);
  const [openRecentAction, setOpenRecentAction] = useState<any | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  const handleRecordClick = (e: React.MouseEvent<any>, record: DebtRecord) => {
    if (!isMaster) return;
    const top = Math.min(window.innerHeight - 200, e.clientY - 40);
    const left = Math.min(window.innerWidth - 200, Math.max(10, e.clientX - 90));
    setMenuPosition({ top, left });
    setOpenActionRecord(record);
  };

  const handleActionClick = (e: React.MouseEvent<any>, action: any) => {
    if (!isMaster) return;
    const top = Math.min(window.innerHeight - 100, e.clientY - 40);
    const left = Math.min(window.innerWidth - 200, Math.max(10, e.clientX - 90));
    setMenuPosition({ top, left });
    setOpenRecentAction(action);
  };
  
  const getFilteredActions = React.useCallback(() => {
    return initialRecentActions.filter(a => {
      if (a.tabName === tabName || a.tabName === 'Global') return true;
      if (!a.tabName && a.details.startsWith(`[${tabName}] `)) return true;
      if (!a.tabName && !a.details.match(/^\[.*?\] /)) return true;
      return false;
    });
  }, [initialRecentActions, tabName]);

  const [recentActions, setRecentActions] = useState<any[]>(getFilteredActions);
  const [offset, setOffset] = useState(() => getFilteredActions().length);

  // Sync recentActions with initialRecentActions prop when it changes
  React.useEffect(() => {
    const filtered = getFilteredActions();
    setRecentActions(filtered);
    setOffset(filtered.length);
  }, [getFilteredActions]);

  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const isLoadingRef = React.useRef(false);
  const [hasMoreActions, setHasMoreActions] = useState(true);

  React.useEffect(() => {
    if (deletedActionItem) {
      setRecentActions(prev => prev.filter(a => a.timestamp !== deletedActionItem.timestamp || a.details !== deletedActionItem.details));
    }
  }, [deletedActionItem]);

  const fetchMoreActions = async () => {
    if (isLoadingRef.current || !hasMoreActions || isOfflineMode || !activeUrl) return;
    isLoadingRef.current = true;
    setIsLoadingActions(true);
    try {
      const res = await fetch(activeUrl, { 
        method: 'POST', 
        body: JSON.stringify({ action: 'getRecentActions', tabName, offset, limit: 20 }) 
      });
      const data = await res.json();
      if (data.status === 'success') {
        if (data.actions.length < 20) {
          setHasMoreActions(false);
        }
        
        setRecentActions(prev => {
          // Deduplicate based on timestamp and details
          const existingKeys = new Set(prev.map(a => `${a.timestamp}-${a.details}`));
          const newActions = data.actions.filter((a: any) => !existingKeys.has(`${a.timestamp}-${a.details}`));
          return [...prev, ...newActions];
        });
        setOffset(prev => prev + data.actions.length);
      } else {
        showToast(data.message || 'Failed to fetch recent actions', 'error');
      }
    } catch (e) {
      showToast('Failed to fetch recent actions', 'error');
    } finally {
      isLoadingRef.current = false;
      setIsLoadingActions(false);
    }
  };

  // Fetch recent actions only if we have none and it's not offline
  React.useEffect(() => {
    if (activeTab === 'actions' && recentActions.length === 0 && hasMoreActions && !isOfflineMode && activeUrl) {
      fetchMoreActions();
    }
  }, [activeTab, isOfflineMode, activeUrl]);
  const uniqueHistory = useMemo(() => {
    if (!Array.isArray(history)) return [];
    const map = new Map<string, DebtRecord>();
    history.forEach(r => {
      if (!r || !r.name) return;
      const nameKey = r.name.toLowerCase().trim();
      // Always overwrite to ensure we have the latest record's details (contact, etc)
      map.set(nameKey, r);
    });
    // Reverse values to show newest deleted items at top of list visually if they were added last
    return Array.from(map.values()).reverse().filter(r => 
      r.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [history, search]);

  const confirmDelete = () => {
    if (recordToDelete) {
      onDeleteFromHistory(recordToDelete, true);
      setRecordToDelete(null);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
    >
      <motion.div 
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500">
              <HistoryIcon />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">
                {isDebtOrRent ? 'History' : 'Recent Actions'}
              </h2>
              <p className="text-slate-500 text-xs">
                {isDebtOrRent ? 'Reuse data or manage history' : 'View recent actions'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
            <CloseIcon />
          </button>
        </div>

        {isDebtOrRent && (
          <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-2xl">
            <button 
              onClick={() => setActiveTab('reuse')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all relative z-10 ${activeTab === 'reuse' ? 'text-slate-900' : 'text-slate-500'}`}
            >
              {activeTab === 'reuse' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              Deleted Person
            </button>
            <button 
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all relative z-10 ${activeTab === 'actions' ? 'text-slate-900' : 'text-slate-500'}`}
            >
              {activeTab === 'actions' && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-xl shadow-sm -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              Action History
            </button>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex-1 flex flex-col overflow-hidden touch-pan-y"
            >
              {activeTab === 'reuse' ? (
                <>
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                      <SearchIcon />
                    </div>
                    <input 
                      type="text" 
                      placeholder="Search by name..." 
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-2 pb-4">
                    {uniqueHistory.length === 0 ? (
                      <div className="py-20 text-center">
                        <p className="text-slate-400 font-medium">{search ? 'No matches found.' : 'History is empty.'}</p>
                      </div>
                    ) : (
                      uniqueHistory.map((record) => (
                        <div 
                          key={record.id}
                          className="w-full flex items-center gap-2 p-1.5 rounded-2xl border border-slate-100 bg-white group hover:border-blue-200 transition-all"
                        >
                          <button 
                            onClick={(e) => handleRecordClick(e, record)}
                            className="flex-1 flex items-center justify-between p-2.5 text-left active:scale-[0.98] transition-transform overflow-hidden"
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              <div className="font-bold text-slate-800 truncate mb-0.5 flex items-center gap-2">
                                {record.name}
                                {record.signature && <span className="bg-emerald-100 text-emerald-600 p-0.5 rounded-full"><svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg></span>}
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Last: {formatDateShort(record.date)}
                              </div>
                            </div>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <div 
                  className="flex-1 overflow-y-auto no-scrollbar pb-4"
                  onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                    const hasScrollbar = target.scrollHeight > target.clientHeight;
                    if (isAtBottom && hasScrollbar) {
                      fetchMoreActions();
                    }
                  }}
                >
                  {recentActions.length === 0 && !isLoadingActions ? (
                    <p className="text-slate-400 text-center py-20">No recent actions found.</p>
                  ) : (
                    recentActions.map((action, idx) => {
                      const date = new Date(action.timestamp);
                      const dateStr = date.toLocaleDateString();
                      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const displayDetails = action.tabName 
                        ? action.details 
                        : (action.details.startsWith(`[${tabName}] `) 
                          ? action.details.substring(`[${tabName}] `.length) 
                          : action.details);
                      return (
                        <button 
                          key={idx} 
                          onClick={(e) => handleActionClick(e, action)}
                          className="w-full text-left p-3 border-b border-slate-100 flex justify-between items-center group hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <p className="text-sm text-slate-800">{displayDetails}</p>
                            <p className="text-[10px] text-slate-400">{dateStr} {timeStr}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                  {isLoadingActions && (
                    <p className="text-slate-400 text-center py-4">Loading more actions...</p>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-2 py-4 text-slate-500 font-bold text-sm bg-slate-50 rounded-2xl active:bg-slate-100"
        >
          Cancel
        </button>
      </motion.div>

      {recordToDelete && (
        <ConfirmModal 
          isOpen={true}
          onClose={() => setRecordToDelete(null)}
          onConfirm={confirmDelete}
          title="Delete History?"
          message={`Permanently delete ALL history for "${recordToDelete.name}"? This cannot be undone.`}
          confirmText="Delete All"
        />
      )}

      {actionToDelete && (
        <ConfirmModal 
          isOpen={true}
          onClose={() => setActionToDelete(null)}
          onConfirm={() => {
            if (onDeleteActionHistory) {
              onDeleteActionHistory(actionToDelete);
            }
            setActionToDelete(null);
          }}
          title="Delete Action History?"
          message={`Permanently delete this action history entry? This cannot be undone.`}
          confirmText="Delete"
        />
      )}

      {createPortal(
        <AnimatePresence>
          {openActionRecord && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[5000] bg-black/5" 
              onClick={() => setOpenActionRecord(null)}
              onTouchStart={() => setOpenActionRecord(null)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute z-[5001] bg-white rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.2)] border border-slate-100 py-2 w-48 overflow-hidden" 
                style={{ top: menuPosition.top, left: menuPosition.left }} 
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onTouchStart={(e: React.TouchEvent) => e.stopPropagation()}
              >
                 <div className="px-4 py-2 border-b border-slate-50 mb-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{openActionRecord.name}</p></div>
                 {openActionRecord.signature && (
                    <button onClick={() => { onViewContract(openActionRecord); setOpenActionRecord(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-emerald-50 text-emerald-600 transition-colors text-xs font-bold">
                       <div className="w-6 h-6 flex items-center justify-center bg-emerald-100 rounded-lg"><FileTextIcon size={16} /></div> View Contract
                    </button>
                 )}
                 {isDebtOrRent && (
                    <button onClick={() => { onReuse(openActionRecord); setOpenActionRecord(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-blue-600 transition-colors text-xs font-bold">
                       <div className="w-6 h-6 flex items-center justify-center bg-blue-100 rounded-lg"><RefreshCwIcon /></div> Reuse Data
                    </button>
                 )}
                 {!isOfflineMode && (
                    <>
                       <div className="h-px bg-slate-50 my-1" />
                       <button onClick={() => { setRecordToDelete(openActionRecord); setOpenActionRecord(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors text-xs font-bold">
                          <div className="w-6 h-6 flex items-center justify-center bg-red-100 rounded-lg"><TrashIcon size={14} /></div> Delete History
                       </button>
                    </>
                 )}
              </motion.div>
            </motion.div>
          )}

          {openRecentAction && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[5000] bg-black/5" 
              onClick={() => setOpenRecentAction(null)}
              onTouchStart={() => setOpenRecentAction(null)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute z-[5001] bg-white rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.2)] border border-slate-100 py-2 w-48 overflow-hidden" 
                style={{ top: menuPosition.top, left: menuPosition.left }} 
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                onTouchStart={(e: React.TouchEvent) => e.stopPropagation()}
              >
                 <div className="px-4 py-2 border-b border-slate-50 mb-1"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Recent Action</p></div>
                 {!isOfflineMode && (
                    <button onClick={() => { setActionToDelete(openRecentAction); setOpenRecentAction(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 text-red-600 transition-colors text-xs font-bold">
                       <div className="w-6 h-6 flex items-center justify-center bg-red-100 rounded-lg"><TrashIcon size={14} /></div> Delete Action
                    </button>
                 )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </motion.div>
  );
};

export default HistoryModal;
