import "./globals.css";
import { Suspense } from "react";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { QueryProvider } from "@/shared/react-query/query-provider";
import AppShell from "./AppShell";
import ClientToaster from "@/shared/utils/client-toaster";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          <AuthProvider>
            <Suspense fallback={null}>
              <AppShell>{children}</AppShell>
            </Suspense>
          </AuthProvider>
          <ClientToaster />
        </QueryProvider>
      </body>
    </html>
  );
}
