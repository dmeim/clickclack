"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConnectJoin() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      // Store name in localStorage or query param?
      // Since we redirect to [code] page, we can't easily pass state unless we use query param or context.
      // Query param is easiest.
      const safeName = name.trim() || "Anonymous Axolotl";
      router.push(`/connect_join/${code.trim().toUpperCase()}?name=${encodeURIComponent(safeName)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#323437] text-gray-200 font-mono">
      <div className="w-full max-w-md p-8 space-y-8 bg-[#2c2e31] rounded-lg shadow-xl">
        <div className="text-center space-y-2">
           <h1 className="text-3xl font-bold text-yellow-500">Join Room</h1>
           <p className="text-gray-400">Enter the room code provided by the host.</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Room Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TR4X9"
              className="w-full px-4 py-3 bg-gray-700 border border-transparent rounded focus:border-yellow-500 focus:outline-none text-center text-2xl tracking-widest uppercase placeholder-gray-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Your Name (Optional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anonymous Axolotl"
              className="w-full px-4 py-2 bg-gray-700 border border-transparent rounded focus:border-yellow-500 focus:outline-none text-center"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded transition"
          >
            Join
          </button>
        </form>

        <div className="text-center space-y-4 pt-4 border-t border-gray-700">
            <Link href="/connect_host" className="block text-sm text-gray-400 hover:text-white">
                Want to host a room instead?
            </Link>
            <Link href="/" className="block text-sm text-gray-500 hover:text-gray-300">
                ← Back to Main Menu
            </Link>
        </div>
      </div>
    </div>
  );
}
