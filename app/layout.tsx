import "./globals.css";
import Sidebar from "@/components/Siderbard";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex">
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 bg-gray-50">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
