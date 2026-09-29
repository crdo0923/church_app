import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Church Leadership LMS — Project Roadmap",
  description:
    "Human-maintained project roadmap tracker for building the Church Leadership LMS.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
