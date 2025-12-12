import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Natural Clinic Marketing",
  description: "Email Marketing Campaign Management Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              border: '1px solid rgba(51, 65, 85, 0.5)',
            },
            success: {
              iconTheme: {
                primary: '#5B8C51',
                secondary: '#f8fafc',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#f8fafc',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
