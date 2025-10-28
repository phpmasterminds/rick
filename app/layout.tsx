import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "okcannashop",
  description: "okcannashop",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>{children}
			<ToastContainer
			  position="top-center"
			  autoClose={3000}
			  hideProgressBar={false}
			  newestOnTop={false}
			  closeOnClick
			  pauseOnHover
			  draggable
			  theme="light"
			/>
		</ThemeProvider>
      </body>
    </html>
  );
}
