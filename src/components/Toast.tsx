import { Alert, Snackbar } from '@mui/material';
import React, { createContext, useState, useContext } from 'react';

interface ToastProps {
    message: string;
    severity: 'error' | 'warning' | 'info' | 'success';
    duration?: number;
    open: boolean;
    onClose: () => void;
}

function Toast({ message, severity, duration = 6000, open, onClose }: ToastProps) {
    return (
        <Snackbar open={open} autoHideDuration={duration} onClose={onClose}>
            <Alert variant='filled' onClose={onClose} severity={severity} sx={{ width: '100%' }}>
                {message}
            </Alert>
        </Snackbar>
    );
}

interface ToastContextType {
    showToast: (message: any, severity: 'error' | 'warning' | 'info' | 'success', duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [open, setOpen] = useState(false);
    const [toastProps, setToastProps] = useState<Omit<ToastProps, 'open' | 'onClose'>>({
        message: '',
        severity: 'info',
        duration: 6000,
    });

    const showToast = (message: any, severity: 'error' | 'warning' | 'info' | 'success', duration?: number) => {
        setToastProps({ message, severity, duration });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Toast
                open={open}
                onClose={handleClose}
                {...toastProps}
            />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};