import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Loader2 } from 'lucide-react';

export default function PrintPreviewModal({ isOpen, onClose, pdfUrl, invoiceNo }) {
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [pagesOption, setPagesOption] = useState('all'); // 'all', 'current', 'custom'
  const [customRange, setCustomRange] = useState('');
  const [copies, setCopies] = useState(1);
  const [orientation, setOrientation] = useState('portrait');
  const [paperSize, setPaperSize] = useState('A4');
  
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printError, setPrintError] = useState('');
  const [printSuccess, setPrintSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPrinters();
    } else {
      setPrintSuccess(false);
      setPrintError('');
      setPrinters([]);
      setSelectedPrinter('');
    }
  }, [isOpen]);

  const fetchPrinters = async () => {
    setIsLoadingPrinters(true);
    setPrintError('');
    try {
      const res = await fetch('http://localhost:8089/printers');
      if (!res.ok) throw new Error('Local print service not running.');
      const list = await res.json();
      setPrinters(list);
      
      if (list.length > 0) {
        const defaultPrinter = list.find(p => p.isDefault || p.name.includes('PDF'));
        if (defaultPrinter) {
          setSelectedPrinter(defaultPrinter.name);
        } else {
          setSelectedPrinter(list[0].name || list[0].deviceId || list[0]);
        }
      }
    } catch (err) {
      console.error(err);
      setPrintError('Unable to connect to Local Print Service on port 8089. Please ensure the service is running.');
    } finally {
      setIsLoadingPrinters(false);
    }
  };

  const handlePrint = async () => {
    if (!selectedPrinter) {
      setPrintError('Please select a printer.');
      return;
    }

    setIsPrinting(true);
    setPrintError('');
    setPrintSuccess(false);

    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('pdf', blob, 'invoice.pdf');
      
      formData.append('printer', selectedPrinter);
      formData.append('copies', copies);
      if (pagesOption === 'custom' && customRange) {
        formData.append('pages', customRange);
      }
      formData.append('orientation', orientation);
      formData.append('paperSize', paperSize);

      const printRes = await fetch('http://localhost:8089/print', {
        method: 'POST',
        body: formData,
      });

      const result = await printRes.json();
      if (!printRes.ok) {
        throw new Error(result.error || 'Failed to print');
      }

      setPrintSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setPrintError('Unable to print invoice. Please check the selected printer.');
    } finally {
      setIsPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex bg-zinc-50 overflow-hidden">
      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 h-[48px] bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6 z-10 shadow-md">
        <h1 className="text-[13.6px] font-bold text-white flex items-center gap-2.5">
          <Printer size={20} className="text-zinc-300" />
          Print Invoice {invoiceNo && <span className="text-zinc-400 font-normal ml-2">({invoiceNo})</span>}
        </h1>
        <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors" title="Close Print Modal">
          <X size={22} />
        </button>
      </div>

      <div className="flex w-full h-full pt-[48px]">
        {/* Left Panel: Preview */}
        <div className="flex-[7] bg-zinc-400/80 p-8 flex items-center justify-center overflow-hidden relative">
          <div className="w-full h-full max-w-5xl mx-auto flex items-center justify-center shadow-2xl bg-white rounded-sm overflow-hidden border border-zinc-300/50">
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                className="w-full h-full border-none"
                style={{ overflow: 'hidden' }}
                title="Invoice Print Preview"
              />
            ) : (
              <div className="text-zinc-500 flex flex-col items-center gap-2">
                <Loader2 size={32} className="animate-spin text-zinc-300" />
                <span>Loading preview...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Settings */}
        <div className="flex-[3] bg-white border-l border-zinc-200 flex flex-col min-w-[272px] max-w-[336px] relative shadow-[-10px_0_20px_rgba(0,0,0,0.05)] z-10">
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Printer Selection */}
            <div>
              <label className="block text-[10.4px] font-bold text-zinc-800 mb-2.5 uppercase tracking-wide">Printer</label>
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                disabled={isLoadingPrinters}
                className="input-field w-full h-[33.6px] text-[11.2px] font-medium bg-zinc-50 border-zinc-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20"
              >
                {isLoadingPrinters ? (
                  <option>Loading printers...</option>
                ) : printers.length === 0 ? (
                  <option value="">No printers found</option>
                ) : (
                  printers.map((p, i) => {
                    const name = p.name || p.deviceId || p;
                    return <option key={i} value={name}>{name}</option>;
                  })
                )}
              </select>
            </div>

            {/* Pages Selection */}
            <div>
              <label className="block text-[10.4px] font-bold text-zinc-800 mb-3 uppercase tracking-wide">Pages</label>
              <div className="space-y-3.5 bg-zinc-50 p-4 border border-zinc-200 rounded-lg">
                <label className="flex items-center gap-3 text-[11.2px] text-zinc-800 cursor-pointer font-medium hover:text-primary transition-colors">
                  <input
                    type="radio"
                    name="pages"
                    checked={pagesOption === 'all'}
                    onChange={() => setPagesOption('all')}
                    className="w-4 h-4 text-primary focus:ring-primary border-zinc-300 cursor-pointer"
                  />
                  All
                </label>
                <label className="flex items-center gap-3 text-[11.2px] text-zinc-800 cursor-pointer font-medium hover:text-primary transition-colors">
                  <input
                    type="radio"
                    name="pages"
                    checked={pagesOption === 'current'}
                    onChange={() => setPagesOption('current')}
                    className="w-4 h-4 text-primary focus:ring-primary border-zinc-300 cursor-pointer"
                  />
                  Current Page
                </label>
                <label className="flex items-center gap-3 text-[11.2px] text-zinc-800 cursor-pointer font-medium hover:text-primary transition-colors">
                  <input
                    type="radio"
                    name="pages"
                    checked={pagesOption === 'custom'}
                    onChange={() => setPagesOption('custom')}
                    className="w-4 h-4 text-primary focus:ring-primary border-zinc-300 cursor-pointer"
                  />
                  Selected Pages
                </label>
              </div>

              {pagesOption === 'custom' && (
                <div className="mt-4 animate-in slide-in-from-top-1 fade-in duration-200">
                  <input
                    type="text"
                    value={customRange}
                    onChange={(e) => setCustomRange(e.target.value)}
                    placeholder="e.g. 1-3, 5"
                    className="input-field w-full h-[33.6px] text-[11.2px] font-medium border-zinc-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[9.6px] text-zinc-500 mt-1.5 font-medium">Page Range (e.g. 1-3, 5)</p>
                </div>
              )}
            </div>

            <div className="w-full h-[0.8px] bg-zinc-200"></div>

            {/* Copies */}
            <div>
              <label className="block text-[10.4px] font-bold text-zinc-800 mb-2.5 uppercase tracking-wide">Copies</label>
              <div className="flex items-center border border-zinc-300 rounded-lg w-36 overflow-hidden h-[33.6px] shadow-sm">
                <button
                  type="button"
                  onClick={() => setCopies(Math.max(1, copies - 1))}
                  className="w-12 h-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                >
                  −
                </button>
                <div className="flex-1 flex items-center justify-center font-bold text-[12px] text-zinc-900 border-x border-zinc-300 h-full bg-white">
                  {copies}
                </div>
                <button
                  type="button"
                  onClick={() => setCopies(copies + 1)}
                  className="w-12 h-full flex items-center justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Paper Settings */}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-[10.4px] font-bold text-zinc-800 mb-2.5 uppercase tracking-wide">Orientation</label>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value)}
                  className="input-field w-full h-[33.6px] text-[11.2px] font-medium bg-zinc-50 border-zinc-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20"
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label className="block text-[10.4px] font-bold text-zinc-800 mb-2.5 uppercase tracking-wide">Paper Size</label>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value)}
                  className="input-field w-full h-[33.6px] text-[11.2px] font-medium bg-zinc-50 border-zinc-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary/20"
                >
                  <option value="A4">A4</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
            </div>

            {/* Status Messages */}
            {printError && (
              <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10.4px] leading-relaxed font-medium flex items-start gap-2 shadow-sm">
                <div className="mt-0.5">⚠️</div>
                <div>{printError}</div>
              </div>
            )}
            {printSuccess && (
              <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[11.2px] leading-relaxed flex items-center gap-2 font-bold shadow-sm">
                <div className="text-xl">✅</div>
                Invoice printed successfully!
              </div>
            )}

          </div>

          {/* Bottom Actions */}
          <div className="p-6 bg-zinc-50 border-t border-zinc-200 shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.02)]">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary py-3 font-bold text-[11.2px] shadow-sm hover:shadow"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting || !selectedPrinter || isLoadingPrinters}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md hover:shadow-lg flex items-center justify-center gap-2 font-bold text-[12px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
              >
                {isPrinting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Printing...
                  </>
                ) : (
                  <>
                    <Printer size={20} />
                    PRINT
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
