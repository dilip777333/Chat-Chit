import "./globals.css";
import Sidebar from "@/components/Siderbard";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="flex">
        <Sidebar />
        <main className="flex-1 bg-gray-50 p-4">{children}</main>
      </body>
    </html>
  );
}
