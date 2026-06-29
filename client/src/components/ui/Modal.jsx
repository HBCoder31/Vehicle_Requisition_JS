import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    /* fixed inset-0 ensures this always covers the VISIBLE viewport,
       completely independent of how far the user has scrolled */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — blocks all clicks behind the modal */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Dialog card — capped at 90vh so it never overflows the screen */}
      <div className={`relative bg-surface rounded-2xl shadow-2xl w-full ${sizeClasses[size]} animate-modal-spring flex flex-col max-h-[90vh]`}>
        {/* Sticky header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Scrollable body — only this part scrolls if content is very tall */}
        <div className="px-6 py-4 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
