'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';
import AlertDialog, { AlertDialogProps } from '@/components/shared/AlertDialog';

type ModalContextType = {
  showAlert: (props: Omit<AlertDialogProps, 'isOpen' | 'onClose'>) => Promise<void>;
  showConfirm: (props: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'type'>) => Promise<boolean>;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalState, setModalState] = useState<AlertDialogProps | null>(null);

  const showAlert = useCallback((props: Omit<AlertDialogProps, 'isOpen' | 'onClose'>): Promise<void> => {
    return new Promise((resolve) => {
        const handleClose = () => {
            setModalState(null);
            resolve();
        };
        setModalState({ ...props, isOpen: true, onClose: handleClose });
    });
  }, []);

  const showConfirm = useCallback((props: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'type'>): Promise<boolean> => {
    return new Promise((resolve) => {
      const handleConfirm = () => {
        setModalState(null);
        resolve(true);
      };
      const handleCancel = () => {
        setModalState(null);
        resolve(false);
      };

      setModalState({
        ...props,
        type: 'confirm',
        isOpen: true,
        onConfirm: handleConfirm,
        onClose: handleCancel,
      });
    });
  }, []);

  const value = useMemo(() => ({ showAlert, showConfirm }), [showAlert, showConfirm]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      {modalState && <AlertDialog {...modalState} />}
    </ModalContext.Provider>
  );
};
