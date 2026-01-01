import "./globals.css";
import Sidebar from "@/components/Siderbard";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex">
        <Sidebar />
        <main className="flex-1 bg-gray-50">{children}</main>
      </body>
    </html>
  );
}
