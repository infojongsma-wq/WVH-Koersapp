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
  themeColor: "#F5F1E6",
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
      <body className="min-h-screen flex flex-col bg-cream text-ink">
        {user && (
          <header className="border-b border-cream-200 bg-cream/80 backdrop-blur">
            <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-6">
              <Link
                href="/"
                className="font-display text-xl font-bold tracking-tight flex items-center gap-2"
              >
                <span aria-hidden>🚴</span>
                <span>
                  WVH <span className="text-ink-muted font-normal">Koersapp</span>
                </span>
              </Link>
              <nav className="flex items-center gap-1 text-sm">
                <NavLink href="/">Ritten</NavLink>
                <NavLink href="/library">Bibliotheek</NavLink>
                {user.role === "ADMIN" && <NavLink href="/admin">Admin</NavLink>}
                <NavLink href="/profile">
                  {user.name ?? user.email.split("@")[0]}
                </NavLink>
                <a
                  href="/api/auth/logout"
                  className="ml-2 text-ink-muted hover:text-ink text-xs px-2 py-1"
                >
                  Uitloggen
                </a>
              </nav>
            </div>
          </header>
        )}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-pill text-ink hover:bg-cream-100 font-medium"
    >
      {children}
    </Link>
  );
}
