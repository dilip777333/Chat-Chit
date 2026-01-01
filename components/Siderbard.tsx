"use client";

import {
  MessageSquare,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="h-screen w-16 bg-white shadow-md flex flex-col items-center py-4 border-r border-gray-200">
      <div className="bg-linear-to-r from-blue-500 to-purple-500 p-2 rounded-xl">
        <MessageSquare className="text-white w-6 h-6" />
      </div>
    </aside>
  );
}


