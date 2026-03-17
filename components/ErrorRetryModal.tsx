import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';

interface ErrorRetryModalProps {
  isOpen: boolean;
  onRetry: () => void;
  message: string;
}

const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
  </svg>
);

const ErrorRetryModal: React.FC<ErrorRetryModalProps> = ({ isOpen, onRetry, message }) => {
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[3000] flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="w-full max-w-xs bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-red-50/50">
              <AlertTriangleIcon />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-2">Sync Failed</h3>
            <p className="text-slate-600 text-sm mb-8 leading-relaxed font-medium whitespace-pre-line">
              {message || "We couldn't reach the Google Sheet.\nPlease check your connection and try again."}
            </p>

            <div className="flex flex-col gap-3">
              <button 
                onClick={onRetry}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-100 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
                Try Sync Again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ErrorRetryModal;