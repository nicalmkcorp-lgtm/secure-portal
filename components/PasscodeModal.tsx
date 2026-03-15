import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

// Android Biometric Authenticator Constants
// 15 = BIOMETRIC_STRONG
// 255 = BIOMETRIC_WEAK
// 32768 = DEVICE_CREDENTIAL (PIN/Pattern/Password)
const AUTH_CONFIG = 15 | 255 | 32768;

interface PasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (code: string) => void | Promise<void>;
  title: string;
  message: string;
  targetTab?: string; 
  biometricEnabled?: boolean;
  preventCloseOnSuccess?: boolean;
  loading?: boolean;
  loadingText?: string;
}

const LockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const FingerprintIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12c0-4.4 3.6-8 8-8s8 3.6 8 8"/><path d="M5 12c0-2.8 2.2-5 5-5s5 2.2 5 5"/><path d="M8 12c0-1.1.9-2 2-2s2 .9 2 2"/><path d="M12 22s4-1.1 4-5V10c0-1.1-.9-2-2-2s-2 .9-2 2v7c0 1.1-.9 2-2 2s-2-.9-2-2"/><path d="M18 12c0 1.7-.5 3.3-1.4 4.7"/><path d="M22 12c0 2.8-1.1 5.4-3 7.3"/></svg>;
const AlertCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" cy="8" x2="12" y2="12"/><line x1="12" cy="16" x2="12.01" y2="16"/></svg>;

const PasscodeModal: React.FC<PasscodeModalProps> = ({ isOpen, onClose, onSuccess, title, message, biometricEnabled = false, preventCloseOnSuccess = false, loading = false, loadingText = 'Saving to Cloud...' }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState(false);
  const [bioErrorMsg, setBioErrorMsg] = useState<string | null>(null);
  const [isBioSupported, setIsBioSupported] = useState(false);
  const [isBioChecking, setIsBioChecking] = useState(false);
  const [isBioLocked, setIsBioLocked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Ref to prevent overlapping biometric attempts during state transitions
  const checkInProgressRef = useRef(false);

  const handleBiometricAuth = useCallback(async () => {
    // If already checking, loading, or in 3s hardware lockout, stop
    if (checkInProgressRef.current || loading || isBioLocked) return;
    
    if (!Capacitor.isNativePlatform()) {
      console.debug("Biometrics only available on native device");
      return;
    }

    checkInProgressRef.current = true;
    setIsBioChecking(true);
    setBioErrorMsg(null);

    try {
      // 150ms buffer to ensure modal has finished zooming and window has focus
      await new Promise(r => setTimeout(r, 150));

      const result = await NativeBiometric.isAvailable();
      if (result.isAvailable) {
          try {
            await NativeBiometric.verifyIdentity({
              reason: "Authorize Action",
              subtitle: "Identity Verification"
            });
            await onSuccess("BIOMETRIC_PASS");
            if (!preventCloseOnSuccess) onClose();
          } catch (verifyErr: any) {
            throw verifyErr;
          }
      } else {
          setIsBioSupported(false);
          setBioErrorMsg("Sensor not ready");
      }
    } catch (err: any) {
      console.debug("Biometric failed", err);
      
      const errMsg = (err.message || err.code || "").toString().toLowerCase();
      const isCancel = errMsg.includes('cancel') || errMsg.includes('user exit') || errMsg.includes('user_cancel') || errMsg.includes('10');
      // Detect if OS rejected request because hardware is already in use or transitioning
      const isBusy = errMsg.includes('busy') || errMsg.includes('unavailable') || errMsg.includes('locked') || errMsg.includes('not_enrolled') || errMsg.includes('not_available');

      if (!isCancel) {
        if (isBusy) {
          // Trigger 3s UI Lockout to let Android Biometric Prompt service reset
          setBioErrorMsg("Hardware busy. Wait 3s...");
          setIsBioLocked(true);
          setTimeout(() => {
            setIsBioLocked(false);
            setBioErrorMsg(null);
          }, 3000);
        } else {
          setBioErrorMsg("Sensor error. Try PIN.");
          setTimeout(() => setBioErrorMsg(null), 3000);
        }
      }
    } finally {
      setIsBioChecking(false);
      checkInProgressRef.current = false;
    }
  }, [loading, isBioLocked, onClose, onSuccess, preventCloseOnSuccess]);

  // Handle initialization when modal opens
  useEffect(() => {
    if (isOpen) {
      setPasscode('');
      setError(false);
      setBioErrorMsg(null);
      setIsBioLocked(false);
      
      // Focus the input
      const timer = setTimeout(() => inputRef.current?.focus(), 300);

      // Check biometrics availability and auto-trigger with delay
      if (biometricEnabled && Capacitor.isNativePlatform()) {
        const initBio = async () => {
          try {
            const result = await NativeBiometric.isAvailable();
            if (result.isAvailable) {
              setIsBioSupported(true);
              // CRITICAL: Wait 800ms for modal animation to fully settle 
              // and for Android 15 to grant the "Stable Window" focus.
              setTimeout(() => {
                handleBiometricAuth();
              }, 800);
            }
          } catch (e) { console.debug("Native Bio unavailable", e); }
        };
        initBio();
      }

      return () => clearTimeout(timer);
    }
  }, [isOpen, biometricEnabled, handleBiometricAuth]);

  const handleManualVerify = async () => {
    if (loading) return;
    const finalCode = passcode.trim();
    if (finalCode.length >= 1) {
      try {
        await onSuccess(finalCode);
        if (!preventCloseOnSuccess) onClose();
      } catch (e) {
        setError(true);
        setPasscode('');
        if (window.navigator.vibrate) window.navigator.vibrate(100);
        setTimeout(() => setError(false), 2000);
      }
    } else {
      setError(true);
      if (window.navigator.vibrate) window.navigator.vibrate(100);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputRef.current) inputRef.current.blur();
      handleManualVerify();
    }
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200000] flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={error ? { x: [-10, 10, -10, 10, 0], transition: { duration: 0.4 } } : { scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            className="w-full max-w-xs bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
          >
            <div className="space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                <LockIcon />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
              <p className="text-slate-500 text-xs mb-6 leading-relaxed font-semibold px-2">
                {message}
              </p>
    
              <div className="relative">
                <input 
                  ref={inputRef}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={10}
                  placeholder="PIN"
                  disabled={loading}
                  className={`w-full p-4 bg-slate-50 border-2 ${error ? 'border-red-500' : 'border-slate-200'} rounded-2xl text-center text-2xl font-black tracking-[0.5em] text-slate-800 focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 outline-none transition-all shadow-inner disabled:opacity-50`}
                  value={passcode}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => {
                    setPasscode(e.target.value.replace(/\D/g, ''));
                    if (error) setError(false);
                  }}
                />
                {error && (
                  <p className="text-red-500 text-xs font-bold mt-2 absolute -bottom-6 left-0 right-0 text-center animate-shake">
                    Incorrect PIN
                  </p>
                )}
              </div>
    
              <div className="flex flex-col gap-2 pt-4">
                <button 
                  type="button"
                  onClick={handleManualVerify}
                  disabled={loading}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest disabled:bg-slate-400"
                >
                  {loading ? loadingText : 'Verify with PIN'}
                </button>
    
                {biometricEnabled && isBioSupported && (
                  <div className="space-y-1.5">
                    <button 
                      type="button"
                      onClick={handleBiometricAuth}
                      disabled={isBioChecking || loading || isBioLocked}
                      className={`w-full py-4 font-black rounded-2xl border-2 active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 ${isBioLocked ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}
                    >
                      <FingerprintIcon />
                      {isBioLocked ? 'Hardware Locked' : isBioChecking ? 'Starting Sensor...' : 'Use Fingerprint'}
                    </button>
                    {bioErrorMsg && (
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                        <AlertCircleIcon /> {bioErrorMsg}
                      </p>
                    )}
                  </div>
                )}
    
                {!loading && (
                  <button 
                    type="button" 
                    onClick={onClose}
                    className="w-full py-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default PasscodeModal;