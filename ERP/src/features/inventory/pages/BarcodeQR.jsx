import React from 'react';
import { QrCode, AlertCircle } from 'lucide-react';

export default function BarcodeQR() {
  const [expandedRowId, setExpandedRowId] = React.useState(null);
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center animate-fade-in">
      <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
        <QrCode size={32} className="text-zinc-400" />
      </div>
      <h1 className="text-2xl font-bold text-zinc-800 mb-2">Barcode & QR Support</h1>
      <p className="text-zinc-500 max-w-md mb-8">
        Scan, generate, and print barcodes and QR labels for inventory items.
      </p>
      
      <div className="max-w-md w-full p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-left">
        <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-amber-800">Backend Not Connected</h3>
          <p className="text-xs text-amber-700 mt-1">
            The barcode generation and scanning endpoints are currently missing from the Inventory API slice. Contact your backend team to implement the required APIs.
          </p>
        </div>
      </div>
    </div>
  );
}
