import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Walkthrough", template: "%s · Walkthrough" },
  description: "AI-generated guided tours of any GitHub codebase.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${fontVariables} h-full antialiased`}
    >
      <body className="flex min-h-dvh flex-col overflow-x-clip bg-background font-sans text-foreground">
        <Header />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-16">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
