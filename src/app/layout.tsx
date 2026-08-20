import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StudyProvider } from "@/lib/store/useStudyStore";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "StudyFlow — AI Deep Work & Focus Tracker",
  description: "AI-powered study tracker that audits in-session stray thoughts ('Mind Pings'), isolates net focus time, and accelerates flow state.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png" },
      { url: "/apple-icon-152x152.png", sizes: "152x152" },
    ],
    shortcut: ["/favicon.ico"],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
      </head>
      <body className={`${inter.className} bg-background text-foreground antialiased min-h-[100dvh]`}>
        <StudyProvider>
          {children}
        </StudyProvider>
      </body>
    </html>
  );
}
