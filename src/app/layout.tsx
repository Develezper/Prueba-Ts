import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RentVago",
  description: "Plataforma para gestionar propiedades, busquedas y favoritos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
