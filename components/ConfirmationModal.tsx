import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue?: string) => void; // Updated to accept input
  title: string;
  message?: string;
  type?: 'danger' | 'warning' | 'primary';
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
  
  // --- NEW FEATURES FOR REJECTION ---
  showInput?: boolean;       // Triggers the text area
  inputPlaceholder?: string; // "Enter rejection reason..."
  inputRequired?: boolean;   // Forces user to type before confirming
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen, onClose, onConfirm, title, message, type = 'primary', 
  confirmText = 'Confirm', cancelText = 'Cancel', children,
  showInput = false,
  inputPlaceholder = "Enter details...",
  inputRequired = false
}) => {
  const [inputValue, setInputValue] = useState('');

  // Reset input when modal opens/closes
  useEffect(() => {
    if (isOpen) setInputValue('');
  }, [isOpen]);

  if (!isOpen) return null;

  // Configuration for different modal types
  const styles = {
    danger: {
      icon: <AlertTriangle size={24} />,
      iconBg: 'bg-red-50 text-red-600',
      buttonBg: 'bg-red-600 hover:bg-red-700 shadow-red-500/30',
    },
    warning: {
      icon: <AlertTriangle size={24} />,
      iconBg: 'bg-yellow-50 text-yellow-600',
      buttonBg: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-500/20',
    },
    primary: {
      icon: <CheckCircle size={24} />,
      iconBg: 'bg-primary-50 text-primary-600',
      buttonBg: 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30',
    }
  };

  const currentStyle = styles[type];

  // Logic to disable button if input is required but empty
  const isConfirmDisabled = inputRequired && inputValue.trim().length === 0;

  const handleConfirm = () => {
    onConfirm(inputValue);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-full flex-shrink-0 ${currentStyle.iconBg}`}>
            {currentStyle.icon}
          </div>
          <div className="flex-1">
            <h3 id="modal-title" className="text-lg font-bold text-gray-900">{title}</h3>
            {message && <p className="text-sm text-gray-500 mt-2 leading-relaxed">{message}</p>}
            
            {children}

            {/* --- NEW: REJECTION REASON INPUT --- */}
            {showInput && (
                <div className="mt-4 animate-fade-in">
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                        {inputPlaceholder}
                        {inputRequired && <span className="text-red-500">*</span>}
                    </label>
                    <textarea 
                        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm min-h-[80px] resize-none transition-all"
                        placeholder="Type here..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    ></textarea>
                </div>
            )}

          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex justify-end gap-3 mt-8">
          <button 
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
          >
            {cancelText}
          </button>
          <button 
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`px-4 py-2.5 text-sm font-bold text-white rounded-lg shadow-md transition-all ${currentStyle.buttonBg} ${isConfirmDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;