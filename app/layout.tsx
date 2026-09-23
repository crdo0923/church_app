import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Church Leadership LMS — Engineering Command Center",
  description:
    "Internal engineering roadmap and project-tracking platform for building the Church Leadership LMS.",
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
