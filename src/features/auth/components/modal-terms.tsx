"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";

export interface TermsData {
  id: string;
  version: string;
  content: string;
}

interface ModalTermsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function ModalTerms({
  open,
  onOpenChange,
  title = "Términos y Condiciones",
}: ModalTermsProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [terms, setTerms] = React.useState<TermsData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [scrolledToBottom, setScrolledToBottom] = React.useState(false);

  React.useEffect(() => {
    if (open && !terms) {
      setLoading(true);
      import("../services/authService").then(({ authService }) => {
        authService
          .getCurrentTerms()
          .then(setTerms)
          .catch(() => {
            toast.error("Error al cargar términos");
            onOpenChange(false);
          })
          .finally(() => setLoading(false));
      });
    }
  }, [open, terms, onOpenChange]);

  React.useEffect(() => {
    if (terms) {
      setScrolledToBottom(false);
    }
  }, [terms?.id]);

  const handleScroll = React.useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    if (isAtBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
    }
  }, [scrolledToBottom]);

  const handleAccept = React.useCallback(() => {
    if (!scrolledToBottom) return;
    onOpenChange(false);
  }, [scrolledToBottom, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl w-[90vw] max-h-[85vh] flex flex-col p-0 gap-0"
        closeOnOutsideClick={true}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold text-center flex items-center justify-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </DialogTitle>
          {terms?.version && (
            <p className="text-sm text-muted-foreground text-center">
              Versión {terms.version}
            </p>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : terms ? (
          <div
            ref={contentRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-6 py-4 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: terms.content }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-muted-foreground">No hay términos disponibles</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface AcceptTermsModalProps {
  open: boolean;
  terms: TermsData;
  accessToken: string;
  refreshToken?: string;
  onAccepted: () => void;
  onError: (message: string) => void;
}

export function AcceptTermsModal({
  open,
  terms,
  accessToken,
  refreshToken,
  onAccepted,
  onError,
}: AcceptTermsModalProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [accepting, setAccepting] = React.useState(false);
  const [scrolledToBottom, setScrolledToBottom] = React.useState(false);

  React.useEffect(() => {
    setScrolledToBottom(false);
  }, [terms.id]);

  const handleScroll = React.useCallback(() => {
    const el = contentRef.current;
    if (!el) return;

    const isAtBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 10;
    if (isAtBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
    }
  }, [scrolledToBottom]);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const { authService } = await import("../services/authService");
      const { setTokens } = await import("@/shared/auth/storage");

      setTokens(accessToken, refreshToken ?? null);

      await authService.acceptTerms();

      toast.success("Términos y condiciones aceptados");
      onAccepted();
    } catch (err) {
      const { getHumanErrorMessage } = await import("@/shared/api/response");
      const msg = getHumanErrorMessage(err);
      onError(msg);
    } finally {
      setAccepting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl w-[90vw] max-h-[85vh] flex flex-col p-0 gap-0"
        showCloseButton={false}
        closeOnOutsideClick={false}
      >
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="text-xl font-semibold text-center flex items-center justify-center gap-2">
            <FileText className="h-5 w-5" />
            Términos y Condiciones
          </DialogTitle>
          <p className="text-sm text-muted-foreground text-center">
            Versión {terms.version}
          </p>
        </DialogHeader>

        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-4 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: terms.content }}
        />

        <div className="px-6 py-4 border-t shrink-0 bg-muted/20">
          {!scrolledToBottom && (
            <p className="text-sm text-muted-foreground text-center mb-3">
              Desliza hasta el final para aceptar
            </p>
          )}
          <Button
            onClick={handleAccept}
            disabled={accepting || !scrolledToBottom}
            className="w-full h-11 text-base btn-gradient"
          >
            {accepting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Aceptando...
              </span>
            ) : (
              "Aceptar términos y condiciones"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}