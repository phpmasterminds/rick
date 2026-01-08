import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { ApprovalProvider } from "@/providers/ApprovalProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nature's High",
  description: "Nature's High",
  icons: {
    icon: [
      { url: '/images/favicon.ico', sizes: 'any' },
    ]
},
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://natureshigh.com',
    siteName: "Nature's High",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ApprovalProvider>
          <ThemeProvider>
            {children}
            <ToastContainer
              position="bottom-center"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              pauseOnHover
              draggable
              theme="light"
            />
          </ThemeProvider>
        </ApprovalProvider>
      </body>
    </html>
  );
}