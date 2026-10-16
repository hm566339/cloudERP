import React from 'react';
import ConfirmModal from './ConfirmModal';

/**
 * Standard ConfirmDialog component.
 * Wrapper/alias around ConfirmModal with unified naming conventions.
 */
export default function ConfirmDialog({
  isOpen,
  open,
  onClose,
  onCancel,
  message,
  description,
  variant = 'danger',
  isDestructive,
  ...props
}) {
  const isActualOpen = open !== undefined ? open : isOpen;
  const handleCancel = onCancel || onClose;
  const actualDestructive = isDestructive !== undefined ? isDestructive : variant === 'danger';

  return (
    <ConfirmModal
      open={isActualOpen}
      onCancel={handleCancel}
      message={message || description}
      isDestructive={actualDestructive}
      {...props}
    />
  );
}
