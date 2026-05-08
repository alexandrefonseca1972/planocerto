import type { Metadata } from "next";
import { Outfit, Manrope } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "PlanoCerto",
    template: "%s | PlanoCerto",
  },
  description:
    "Organize suas finanças com o PlanoCerto. Simples, seguro e inteligente.",
  keywords: ["finanças", "planejamento", "gestão financeira", "plano"],
  authors: [{ name: "PlanoCerto" }],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "PlanoCerto",
    description: "Organize suas finanças de forma simples e segura.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="flex-1">{children}</div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
