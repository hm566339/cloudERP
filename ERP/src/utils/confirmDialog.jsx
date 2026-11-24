import React, { useState, useEffect } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

let resolveCallback = null;

export const confirmDialog = (optionsOrMessage, title = "Confirm Action") => {
  return new Promise((resolve) => {
    resolveCallback = resolve;
    
    let payload = { message: '', title: title, info: null };
    
    if (typeof optionsOrMessage === 'string') {
      payload.message = optionsOrMessage;
    } else if (typeof optionsOrMessage === 'object') {
      payload = { ...payload, ...optionsOrMessage };
    }
    
    const event = new CustomEvent('show-confirm', { detail: payload });
    window.dispatchEvent(event);
  });
};

export const ConfirmDialogContainer = () => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState({ message: '', title: '', info: null });

  useEffect(() => {
    const handleShow = (e) => {
      setContent(e.detail);
      setOpen(true);
    };
    window.addEventListener('show-confirm', handleShow);
    return () => window.removeEventListener('show-confirm', handleShow);
  }, []);

  const handleConfirm = () => {
    setOpen(false);
    if (resolveCallback) resolveCallback(true);
  };

  const handleCancel = () => {
    setOpen(false);
    if (resolveCallback) resolveCallback(false);
  };

  return (
    <ConfirmModal 
      open={open} 
      title={content.title} 
      message={content.message} 
      info={content.info}
      onConfirm={handleConfirm} 
      onCancel={handleCancel} 
      isDestructive={content.isDestructive !== false}
      details={content.details}
      confirmLabel={content.confirmLabel || (content.title && content.title.toLowerCase().includes('delete') ? "Yes, Delete" : (content.title && content.title.toLowerCase().includes('deactivate') ? "Yes, Deactivate" : "Confirm"))}
      cancelLabel={content.cancelLabel || "Cancel"}
    />
  );
};

export default confirmDialog;
