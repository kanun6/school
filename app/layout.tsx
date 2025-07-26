import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/contexts/ModalContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "School-ONL",
  description: "ระบบจัดการโรงเรียนออนไลน์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-white dark:bg-gray-950">
      <body className={`${inter.className} h-full`} suppressHydrationWarning={true}>
        <ModalProvider>
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}
