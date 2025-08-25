import "./globals.css";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import { QueryProvider } from "@/shared/react-query/query-provider";
// import { Toaster } from "sonner";
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
            <AppShell>{children}</AppShell>
          </AuthProvider>
          <ClientToaster />
        </QueryProvider>
      </body>
    </html>
  );
}
