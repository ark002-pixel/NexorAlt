import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

interface ActionBlockedModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    instructions: string[];
    actionLabel?: string;
    onAction?: () => void;
}

const ActionBlockedModal: React.FC<ActionBlockedModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    instructions,
    actionLabel,
    onAction
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[99999] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border-t-4 border-amber-500">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-6">
                        <p className="text-slate-600 mb-4 font-medium leading-relaxed">
                            {message}
                        </p>

                        {instructions.length > 0 && (
                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Pasos para solucionar:</h4>
                                <ul className="space-y-2">
                                    {instructions.map((step, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                                            <span className="bg-amber-200 text-amber-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                        >
                            Entendido
                        </button>
                        {onAction && actionLabel && (
                            <button
                                onClick={onAction}
                                className="px-5 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium transition-colors flex items-center gap-2 shadow-lg"
                            >
                                {actionLabel}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ActionBlockedModal;
