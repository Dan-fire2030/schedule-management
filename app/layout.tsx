import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme/theme-provider";
import { ServiceWorkerProvider } from "@/components/pwa/ServiceWorkerProvider";
import { ReminderProvider } from "@/components/reminders/ReminderProvider";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({ 
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "スケマネ - 友達と楽しく予定管理",
  description: "友達や家族と共有できる夢の世界のような予定管理アプリ",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans bg-gradient-to-br from-pastel-pink via-white to-pastel-blue 
                      dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 min-h-screen 
                      transition-colors duration-300">
        <ThemeProvider
          defaultTheme="system"
          storageKey="schemanager-theme"
        >
          <ServiceWorkerProvider />
          <ReminderProvider>
            {children}
          </ReminderProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}