'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import AlertDialog, { AlertDialogProps } from '@/components/shared/AlertDialog';

type ModalContextType = {
  showAlert: (props: Omit<AlertDialogProps, 'isOpen' | 'onClose'>) => void;
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

  const showAlert = (props: Omit<AlertDialogProps, 'isOpen' | 'onClose'>) => {
    setModalState({ ...props, isOpen: true, onClose: () => setModalState(null) });
  };

  const showConfirm = (props: Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'type'>): Promise<boolean> => {
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
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {modalState && <AlertDialog {...modalState} />}
    </ModalContext.Provider>
  );
};
