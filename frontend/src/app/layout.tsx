import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sileo";
import "sileo/styles.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "DevATS | Hackeando o ATS com IA",
  description:
    "Otimização de currículo com tecnologia de IA, criada especificamente para desenvolvedores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${spaceGrotesk.variable} antialiased overflow-x-hidden`}
      >
        {children}
        <Toaster position="top-right" options={{ autopilot: true }} />
      </body>
    </html>
  );
}
