import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Providers } from "@/components/Providers";
import PWALoader from "@/components/PWALoader";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEN Labs | El Estándar en Laboratorios Virtuales 2.5D",
  description: "Plataforma líder en simulaciones de ciencias exactas (Física, Química, Biología y Matemáticas) con pedagogía avanzada y tecnología de alto rendimiento para instituciones educativas.",
  keywords: ["laboratorios virtuales", "simuladores de ciencias", "educación digital", "CEN Labs", "Física", "Química", "Biología", "Matemáticas", "STEM Mexico"],
  authors: [{ name: "Campaña de Educación Nacional" }],
  openGraph: {
    title: "CEN Labs Simulator - El Futuro de la Educación en Ciencias",
    description: "Accede a 40 simulaciones interactivas de alta fidelidad. Sin riesgos, sin consumibles, aprendizaje total.",
    images: ["/images/landing/hero.png"],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CEN Labs | Simuladores Científicos de Alta Fidelidad",
    description: "Transforma tu institución con el ecosistema de laboratorios virtuales más avanzado de México.",
    images: ["/images/landing/hero.png"],
  },
  icons: {
    icon: [
      { url: '/icon-192.png?v=2', type: 'image/png' },
      { url: '/icon-192.png?v=2', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png?v=2', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png?v=2' },
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={outfit.variable}>
      <head>
        <link rel="icon" href="/icon-192.png?v=2" />
      </head>
      <body className={`${outfit.className} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <PWALoader />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
