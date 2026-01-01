"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Home,
  LayoutGrid,
  ListOrdered,
  Info,
  Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menu = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutGrid, label: "Categories", path: "/categories" },
  { icon: ListOrdered, label: "Listings", path: "/listings" },
  { icon: Info, label: "About", path: "/about" },
  { icon: Contact, label: "Contact", path: "/contact" },
];

export default function Sidebar() {
  const [active, setActive] = useState("");

  return (
    <aside className="h-screen w-16 bg-white shadow-md flex flex-col items-center py-4 gap-6 border-r">
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
        <ShoppingBag className="text-white w-6 h-6" />
      </div>

      <nav className="flex flex-col gap-6 mt-4">
        {menu.map((item) => (
          <Link key={item.label} href={item.path}>
            <button
              onClick={() => setActive(item.label)}
              className={cn(
                "p-2 rounded-lg hover:bg-blue-100 transition",
                active === item.label && "bg-blue-100 text-blue-600"
              )}
            >
              <item.icon className="w-5 h-5" />
            </button>
          </Link>
        ))}
      </nav>
    </aside>
  );
}


