import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl', bodyClassName }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-black/60 backdrop-blur-sm">
      <div className={`bg-white dark:bg-[#1D212C] rounded-xl shadow-xl dark:shadow-2xl w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200/80 dark:border-[#2A2F3D]`}>
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-zinc-100 dark:border-[#2A2F3D] shrink-0 bg-white dark:bg-[#1D212C]">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE] hover:bg-zinc-100 dark:hover:bg-[#222736] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className={bodyClassName || "p-4 sm:p-6 overflow-y-auto overscroll-contain bg-white dark:bg-[#1D212C]"}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
