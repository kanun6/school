import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/contexts/ModalContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "School-Sys",
  description: "ระบบจัดการโรงเรียนออนไลน์",
  icons: {
    icon: "/icon.png"
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full bg-white dark:bg-gray-950">
      <body className={`${inter.className} h-full`} suppressHydrationWarning>
        <ModalProvider>{children}</ModalProvider>
      </body>
    </html>
  );
}
