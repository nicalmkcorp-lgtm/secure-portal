import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import * as htmlToImage from 'html-to-image';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { DebtRecord, RentBannerSettings } from '../types';

interface RentBannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: DebtRecord[];
  currentViewDate: Date;
  rentTabPhoto?: string;
  onSaveRentPhoto?: (photo: string) => void;
  bannerSettings?: RentBannerSettings;
  onSaveBannerSettings?: (settings: RentBannerSettings) => Promise<void> | void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'restricted') => void;
}

const XIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const ArrowLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>;
const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>;
const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>;

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const RentBannerModal: React.FC<RentBannerModalProps> = ({ isOpen, onClose, records, currentViewDate, rentTabPhoto, onSaveRentPhoto, bannerSettings, onSaveBannerSettings, showToast }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [carModel, setCarModel] = useState(bannerSettings?.carModel || 'Toyota Vios');
  const [carColor, setCarColor] = useState(bannerSettings?.carColor || 'White');
  const [price12h, setPrice12h] = useState(bannerSettings?.price12h || '1,799');
  const [price24h, setPrice24h] = useState(bannerSettings?.price24h || '2,499');
  const [priceDriver, setPriceDriver] = useState(bannerSettings?.priceDriver || '1,000');
  const [facebookContact, setFacebookContact] = useState(bannerSettings?.facebookContact || '');
  const [qrCode1, setQrCode1] = useState<string | null>(bannerSettings?.qrCode1 || null);
  const [qrCode2, setQrCode2] = useState<string | null>(bannerSettings?.qrCode2 || null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [carImageUrl, setCarImageUrl] = useState<string | null>(null);

  const bannerRef = useRef<HTMLDivElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (rentTabPhoto) {
        setCarImageUrl(rentTabPhoto);
      } else {
        setCarImageUrl(null);
      }
      
      // Update local state from props when opening
      if (bannerSettings) {
        setCarModel(bannerSettings.carModel);
        setCarColor(bannerSettings.carColor);
        setPrice12h(bannerSettings.price12h);
        setPrice24h(bannerSettings.price24h);
        setPriceDriver(bannerSettings.priceDriver);
        setFacebookContact(bannerSettings.facebookContact || '');
        setQrCode1(bannerSettings.qrCode1 || null);
        setQrCode2(bannerSettings.qrCode2 || null);
      }
    } else {
      setStep(1);
    }
  }, [isOpen, rentTabPhoto, bannerSettings]);

  // Save settings manually when clicking preview
  const handlePreview = () => {
    if (onSaveBannerSettings) {
      onSaveBannerSettings({
        carModel,
        carColor,
        price12h,
        price24h,
        priceDriver,
        facebookContact,
        qrCode1: qrCode1 || undefined,
        qrCode2: qrCode2 || undefined
      });
    }
    setStep(2);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>, isQr1: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (showToast) showToast("Uploading QR...", "success");
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0, width, height);
          
          const result = canvas.toDataURL('image/jpeg', 0.7);
          
          if (isQr1) setQrCode1(result);
          else setQrCode2(result);
          
          if (onSaveBannerSettings) {
               try {
                   await onSaveBannerSettings({
                      carModel,
                      carColor,
                      price12h,
                      price24h,
                      priceDriver,
                      facebookContact,
                      qrCode1: isQr1 ? result : (qrCode1 || undefined),
                      qrCode2: !isQr1 ? result : (qrCode2 || undefined)
                   });
                   if (showToast) showToast("Uploading Successful", "success");
               } catch (e) {
                   if (showToast) showToast("Uploading Failed", "error");
               }
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };


  if (!isOpen) return null;

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isBooked = (day: number) => {
    const d = new Date(year, month, day);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${dd}`;
    
    return records.some(r => {
      if (r.status === 'cancelled' || r.status === 'legacy') return false;
      const start = r.date;
      const end = r.endDate || r.date;
      return dateStr >= start && dateStr <= end;
    });
  };

  const handleDownload = async () => {
    if (!bannerRef.current) return;
    setIsGenerating(true);
    try {
      // Wait for fonts to be ready
      await document.fonts.ready;
      
      const dataUrl = await htmlToImage.toJpeg(bannerRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        width: 1080,
        height: 1450,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
        }
      });
      
      const fileName = `Rent-Banner-${carModel.replace(/\s+/g, '-')}-${MONTHS[month]}-${year}.jpg`;

      if (Capacitor.isNativePlatform()) {
        // Capacitor Save Logic
        const base64Data = dataUrl.split(',')[1];
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true
        });
        alert(`Saved to Documents: ${fileName}`);
      } else {
        // Web Download Logic
        const link = document.createElement('a');
        link.download = fileName;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Failed to generate banner', err);
      alert('Failed to generate banner. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!bannerRef.current) return;
    setIsGenerating(true);
    try {
      await document.fonts.ready;
      
      const dataUrl = await htmlToImage.toJpeg(bannerRef.current, {
        quality: 0.95,
        pixelRatio: 2,
        width: 1080,
        height: 1450,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          margin: '0',
        }
      });
      
      const fileName = `Rent-Banner-${carModel.replace(/\s+/g, '-')}-${MONTHS[month]}-${year}.jpg`;

      if (Capacitor.isNativePlatform()) {
        // Capacitor Share Logic
        const base64Data = dataUrl.split(',')[1];
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });

        await Share.share({
          title: 'Rental Schedule',
          text: `Check out the availability schedule for ${carModel} this ${MONTHS[month]} ${year}!`,
          files: [savedFile.uri],
        });
      } else {
        // Web Share Logic
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Rental Schedule',
            text: `Check out the availability schedule for ${carModel} this ${MONTHS[month]} ${year}!`,
          });
        } else {
          const link = document.createElement('a');
          link.download = file.name;
          link.href = dataUrl;
          link.click();
        }
      }
    } catch (err) {
      console.error('Failed to share banner', err);
      if (err instanceof Error && err.name !== 'AbortError') {
        alert('Failed to share banner. Please try again.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[130000] flex items-center justify-center p-4 sm:p-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
          onClick={onClose} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }} 
          className={`relative w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all duration-500 ${step === 1 ? 'max-w-md' : 'max-w-5xl'}`}
        >
          {step === 1 ? (
            // STEP 1: INPUT FORM
            <div className="p-6 sm:p-8 flex flex-col overflow-y-auto w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Rent Banner</h2>
                <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors">
                  <XIcon />
                </button>
              </div>

              <div className="grid grid-cols-6 gap-4 flex-1 mb-8">
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Car Model</label>
                  <input type="text" value={carModel} onChange={e => setCarModel(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Car Color</label>
                  <input type="text" value={carColor} onChange={e => setCarColor(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">12 Hours Price</label>
                  <input type="text" value={price12h} onChange={e => setPrice12h(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">24 Hours Price</label>
                  <input type="text" value={price24h} onChange={e => setPrice24h(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">With Driver (12 hrs)</label>
                  <input type="text" value={priceDriver} onChange={e => setPriceDriver(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
                <div className="col-span-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Facebook Contact Details</label>
                  <input type="text" value={facebookContact} onChange={e => setFacebookContact(e.target.value)} placeholder="e.g. LMK Car Rental Services" className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <button 
                onClick={handlePreview} 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                Preview Banner
              </button>
            </div>
          ) : (
            // STEP 2: PREVIEW & ACTIONS
            <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
              {/* Sidebar Actions */}
              <div className="w-full md:w-1/4 p-4 bg-white border-r border-slate-100 flex flex-col gap-2 overflow-y-auto shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Options</h2>
                  <button onClick={onClose} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors md:hidden">
                    <XIcon />
                  </button>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setStep(1)} className="flex-1 bg-slate-50 border-2 border-slate-200 text-slate-600 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors text-sm">
                    <ArrowLeftIcon /> Edit
                  </button>

                  <div className="relative flex-1">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const img = new Image();
                            img.src = reader.result as string;
                            img.onload = () => {
                              const canvas = document.createElement('canvas');
                              const MAX_WIDTH = 800;
                              const MAX_HEIGHT = 800;
                              let width = img.width;
                              let height = img.height;

                              if (width > height) {
                                if (width > MAX_WIDTH) {
                                  height *= MAX_WIDTH / width;
                                  width = MAX_WIDTH;
                                }
                              } else {
                                if (height > MAX_HEIGHT) {
                                  width *= MAX_HEIGHT / height;
                                  height = MAX_HEIGHT;
                                }
                              }

                              canvas.width = width;
                              canvas.height = height;
                              const ctx = canvas.getContext('2d');
                              ctx?.drawImage(img, 0, 0, width, height);
                              
                              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                              setCarImageUrl(compressedDataUrl);
                              onSaveRentPhoto?.(compressedDataUrl);
                            };
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <button className="w-full h-full bg-indigo-50 border-2 border-indigo-100 text-indigo-600 py-2 rounded-xl font-bold flex items-center justify-center gap-1 hover:bg-indigo-100 transition-colors pointer-events-none text-[11px] uppercase">
                      <UploadIcon /> Upload Car Photo
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <input type="file" accept="image/*" onChange={(e) => handleQrUpload(e, true)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <button className="w-full bg-slate-50 border-2 border-slate-200 text-slate-600 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors text-[10px] uppercase">
                            <UploadIcon /> Upload Qr 1
                        </button>
                    </div>
                    <div className="relative flex-1">
                        <input type="file" accept="image/*" onChange={(e) => handleQrUpload(e, false)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <button className="w-full bg-slate-50 border-2 border-slate-200 text-slate-600 py-2 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors text-[10px] uppercase">
                            <UploadIcon /> Upload Qr 2
                        </button>
                    </div>
                </div>

                <div className="flex-1 min-h-[10px]"></div>

                <div className="flex gap-2">
                  <button onClick={handleDownload} disabled={isGenerating} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50">
                    {isGenerating ? 'Saving...' : <><DownloadIcon /> Save</>}
                  </button>
                  <button onClick={handleShare} disabled={isGenerating} className="flex-1 bg-indigo-50 text-indigo-600 border-2 border-indigo-100 py-3 rounded-2xl font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-indigo-100 active:scale-95 transition-all disabled:opacity-50">
                    {isGenerating ? 'Wait...' : <><ShareIcon /> Share</>}
                  </button>
                </div>
              </div>

              {/* Preview Area */}
              <div className="w-full md:w-3/4 bg-slate-100 p-2 sm:p-4 flex items-center justify-center overflow-y-auto relative">
                {/* Close button for desktop */}
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white text-slate-500 rounded-full shadow-sm hover:bg-slate-50 transition-colors hidden md:block z-20">
                  <XIcon />
                </button>

                {/* Wrapper for scaling to avoid html2canvas cutoff issues */}
                <div style={{ transform: 'scale(0.4)', transformOrigin: 'center center', margin: '-300px' }}>
                  {/* The actual banner container to be captured */}
                  <div 
                    ref={bannerRef}
                    className="w-[1080px] h-[1450px] bg-gradient-to-br from-slate-900 via-slate-800 to-black flex flex-col p-16 relative overflow-hidden shrink-0"
                  >
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

                    {/* Header */}
                    <div className="relative z-10 text-center mb-8">
                      <p className="text-pink-400 text-5xl font-black uppercase mb-2">LMK CAR RENTALS</p>
                      <h1 className="text-7xl font-black text-white mb-4">{carModel}</h1>
                      <div className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                        <p className="text-2xl font-bold text-slate-200 uppercase">{carColor}</p>
                      </div>
                    </div>

                    {/* Car Image Area */}
                    <div className="relative z-10 w-full h-64 mb-8 rounded-3xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center shrink-0">
                      {carImageUrl ? (
                        <img 
                          src={carImageUrl} 
                          alt={`${carColor} ${carModel}`}
                          className="w-full h-full object-cover opacity-90"
                        />
                      ) : (
                        <div className="text-white/50">No image available</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10"></div>
                    </div>

                    <div className="flex-1 flex gap-12 relative z-10">
                      {/* Pricing Column */}
                      <div className="w-1/3 flex flex-col gap-6">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                          <p className="text-slate-400 text-lg font-bold uppercase mb-2">12 Hours</p>
                          <p className="text-5xl font-black text-white">{price12h}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                          <p className="text-slate-400 text-lg font-bold uppercase mb-2">24 Hours</p>
                          <p className="text-5xl font-black text-white">{price24h}</p>
                        </div>
                        <div className="bg-pink-600/20 backdrop-blur-sm border border-pink-500/30 rounded-3xl p-8">
                          <p className="text-pink-300 text-lg font-bold uppercase mb-2">Option for Driver</p>
                          <p className="text-4xl font-black text-white mb-2">{priceDriver}</p>
                          <p className="text-pink-200/60 text-sm font-bold uppercase">12 Hours</p>
                        </div>

                        <div className="mt-auto pt-4">
                            <p className="text-slate-400 text-sm font-bold uppercase mb-1">For inquiries contact us on facebook,</p>
                            <p className="text-xl font-black text-white mb-6 leading-tight">{facebookContact}</p>
                            
                            <div className="flex gap-4">
                                {qrCode1 && (
                                    <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-lg">
                                        <img src={qrCode1} className="w-full h-full object-contain" alt="QR 1" />
                                    </div>
                                )}
                                {qrCode2 && (
                                    <div className="w-36 h-36 bg-white p-2 rounded-xl shadow-lg">
                                        <img src={qrCode2} className="w-full h-full object-contain" alt="QR 2" />
                                    </div>
                                )}
                            </div>
                        </div>
                      </div>

                      {/* Calendar Column */}
                      <div className="w-2/3 bg-white/5 backdrop-blur-md border border-white/10 rounded-[3rem] p-10 flex flex-col">
                        <div className="text-center mb-8">
                          <h2 className="text-5xl font-black text-white">{MONTHS[month]} {year}</h2>
                          <p className="text-pink-400 text-xl font-bold uppercase mt-2">Availability Schedule</p>
                        </div>

                        <div className="grid grid-cols-7 gap-4 mb-4">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-slate-400 font-bold text-xl uppercase">{d}</div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-4 flex-1">
                          {days.map((day, idx) => {
                            if (!day) return <div key={`empty-${idx}`} className="rounded-2xl bg-white/5"></div>;
                            
                            const booked = isBooked(day);
                            
                            return (
                              <div 
                                key={`day-${day}`} 
                                className={`rounded-2xl flex items-center justify-center relative overflow-hidden ${
                                  booked 
                                    ? 'bg-rose-500/20 border-2 border-rose-500/30' 
                                    : 'bg-emerald-500/20 border-2 border-emerald-500/30'
                                }`}
                              >
                                <span className={`text-3xl font-black ${booked ? 'text-rose-400/50' : 'text-emerald-400'}`}>
                                  {day}
                                </span>
                                {booked && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-1.5 bg-rose-500 rotate-45 absolute rounded-full"></div>
                                    <div className="w-full h-1.5 bg-rose-500 -rotate-45 absolute rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="mt-8 flex justify-center gap-8">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md bg-emerald-500/20 border-2 border-emerald-500/30"></div>
                            <span className="text-slate-300 font-bold text-xl uppercase">Available</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-md bg-rose-500/20 border-2 border-rose-500/30 relative flex items-center justify-center">
                              <div className="w-full h-0.5 bg-rose-500 rotate-45 absolute"></div>
                              <div className="w-full h-0.5 bg-rose-500 -rotate-45 absolute"></div>
                            </div>
                            <span className="text-slate-300 font-bold text-xl uppercase">Booked</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default RentBannerModal;
