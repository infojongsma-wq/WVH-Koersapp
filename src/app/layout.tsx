import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "WVH Koersapp",
  description: "Fietsritten van Wielerclub Holten",
};

export const viewport: Viewport = {
  themeColor: "#0b3d91",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="nl">
      <body className="min-h-screen flex flex-col">
        {user && (
          <header className="bg-wvh text-white shadow">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
              <Link href="/" className="font-bold text-lg flex items-center gap-2">
                <span>🚴</span> <span>WVH Koersapp</span>
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link href="/" className="hover:underline">Ritten</Link>
                <Link href="/library" className="hover:underline">Bibliotheek</Link>
                <Link href="/rides/new" className="hover:underline font-semibold">+ Rit toevoegen</Link>
                {user.role === "ADMIN" && (
                  <Link href="/admin" className="hover:underline">Admin</Link>
                )}
                <Link href="/profile" className="hover:underline">
                  {user.name ?? user.email.split("@")[0]}
                </Link>
                <a href="/api/auth/logout" className="opacity-70 hover:opacity-100">Uitloggen</a>
              </nav>
            </div>
          </header>
        )}
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
