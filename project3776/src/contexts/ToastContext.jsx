import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * トースト通知システム
 * 使い方: const { showToast } = useToast();
 *         showToast('課題を追加しました！', 'success');
 * type: 'success' | 'error' | 'warning' | 'info'
 */

const ToastContext = createContext(null);

const ICONS = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
};

const COLORS = {
    success: { bg: 'from-emerald-500 to-teal-500', icon: 'text-emerald-100' },
    error: { bg: 'from-red-500 to-rose-500', icon: 'text-red-100' },
    warning: { bg: 'from-amber-500 to-orange-500', icon: 'text-amber-100' },
    info: { bg: 'from-indigo-500 to-blue-500', icon: 'text-indigo-100' },
};

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3500) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* トースト表示レイヤー */}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => {
                        const IconComp = ICONS[toast.type] || CheckCircle;
                        const colors = COLORS[toast.type] || COLORS.success;
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, x: 80, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 80, scale: 0.9 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                                className={`flex items-center gap-3 pl-4 pr-3 py-3 rounded-2xl shadow-2xl bg-gradient-to-r ${colors.bg} text-white pointer-events-auto max-w-xs`}
                                style={{
                                    backdropFilter: 'blur(12px)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.1)',
                                }}
                            >
                                <IconComp className={`w-5 h-5 flex-shrink-0 ${colors.icon}`} />
                                <span className="text-sm font-semibold leading-snug flex-1">{toast.message}</span>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="p-1 rounded-full hover:bg-white/20 transition"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};
