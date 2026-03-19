import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { prisma } from "@/lib/prisma";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jack Connect 3 · Admin",
  description: "Jack Connect 3 simulation dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const openGamesCount = await prisma.game.count({ where: { status: "OPEN" } });

  return (
    <html lang="en" className={outfit.variable}>
      <body className="antialiased min-h-screen bg-slate-100">
        <Sidebar openGamesCount={openGamesCount} />
        <main className="md:ml-56 min-h-screen p-4 pt-[72px] md:p-8 max-w-[1600px]">{children}</main>
      </body>
    </html>
  );
}
