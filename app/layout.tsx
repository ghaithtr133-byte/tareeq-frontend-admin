import type { Metadata } from "next";
import "@fontsource/noto-sans-arabic/400.css";
import "@fontsource/noto-sans-arabic/500.css";
import "@fontsource/noto-sans-arabic/600.css";
import "@fontsource/noto-sans-arabic/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";

import "./globals.css";
import { isAdminDevMockAccessEnabled } from "@/lib/admin-dev-mock";
import { AdminAccessProvider } from "@/providers/admin-access-provider";
import { QueryProvider } from "@/providers/query-provider";

export const metadata: Metadata = {
  title: "إدارة طريق أكاديمي",
  description: "بوابة إدارة طريق أكاديمي",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // This value is evaluated only on the server. Client components receive no
  // environment value and cannot enable mock access themselves.
  const mockEnabled = isAdminDevMockAccessEnabled();
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <QueryProvider>
          <AdminAccessProvider mockEnabled={mockEnabled}>{children}</AdminAccessProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
