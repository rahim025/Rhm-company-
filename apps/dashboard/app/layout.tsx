import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RHM Base",
  description: "Plateforme backend open-source — bases de données, auth et API pour vos projets.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
