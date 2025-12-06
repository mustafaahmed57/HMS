import React, { useEffect } from 'react';
import './InvoiceModal.css';  // Make sure to add the CSS below

function InvoiceModal({ isOpen, onClose, title = "Invoice Preview", children }) {
  // Close modal when pressing ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
    }

    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Click on overlay closes modal
  const handleOverlayClick = () => {
    onClose();
  };

  // Clicking inside modal content does NOT close it
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      className="invoice-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="invoice-modal-content" onClick={handleContentClick}>
        {/* Header */}
        <div className="invoice-modal-header">
          <h3>{title}</h3>
          <button className="invoice-close-btn" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="invoice-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

export default InvoiceModal;
