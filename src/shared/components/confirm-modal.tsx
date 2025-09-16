"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ActionButton } from "@/components/ui/action-button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  children,
  onOpenChange,
}: ConfirmModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
        onOpenChange?.(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        <DialogDescription className="text-sm text-gray-600">
          {message}
        </DialogDescription>

        {children && <div className="mt-3">{children}</div>}

        <div className="flex justify-end gap-2 mt-5">
          <ActionButton
            label={cancelText}
            variant="outline"
            onAction={onCancel}
          />
          <ActionButton
            label={confirmText}
            className="btn-cancel-gradient "
            onAction={onConfirm}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
