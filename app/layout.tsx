import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const base = new URL(`${protocol}://${host}`);
  return {
  metadataBase: base,
  title: {
    default: "Movimento Volta Pra Você",
    template: "%s | Volta Pra Você",
  },
  description:
    "Um diagnóstico e uma jornada prática para voltar a ocupar espaço na própria vida, 15 minutos por dia.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Movimento Volta Pra Você",
    description: "30 dias para parar de se abandonar e voltar a se reconhecer.",
    images: [{ url: "/og.png", width: 1664, height: 935, alt: "Movimento Volta Pra Você — Eu não me abandono mais." }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Movimento Volta Pra Você",
    description: "Eu não me abandono mais.",
    images: ["/og.png"],
  },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
