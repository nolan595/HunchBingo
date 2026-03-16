import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Connect 3 Admin",
  description: "Hunch Connect 3 simulation dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Sidebar />
        <main className="ml-56 min-h-screen p-8">{children}</main>
      </body>
    </html>
  );
}
