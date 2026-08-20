import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StudyProvider } from "@/lib/store/useStudyStore";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyFlow — AI Deep Work & Focus Tracker",
  description: "Mobile-responsive AI-powered study tracker that audits in-session stray thoughts ('Mind Pings'), isolates net focus time, and accelerates flow state.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-[100dvh]`}>
        <StudyProvider>
          {children}
        </StudyProvider>
      </body>
    </html>
  );
}
