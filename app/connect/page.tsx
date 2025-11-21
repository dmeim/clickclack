"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GLOBAL_COLORS } from "@/lib/colors";

export default function ConnectPage() {
  const [code, setCode] = useState("");
  const [joinName, setJoinName] = useState("");
  const [hostName, setHostName] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() && joinName.trim()) {
      router.push(`/connect/${code.trim().toUpperCase()}?name=${encodeURIComponent(joinName.trim())}`);
    }
  };

  const handleHost = (e: React.FormEvent) => {
      e.preventDefault();
      if (hostName.trim()) {
          router.push(`/connect/host?name=${encodeURIComponent(hostName.trim())}`);
      }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center font-mono px-4 transition-colors duration-300"
      style={{ backgroundColor: GLOBAL_COLORS.background, color: GLOBAL_COLORS.text.primary }}
    >
      <div className="w-full max-w-4xl mx-auto animate-fade-in">
         <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-2" style={{ color: GLOBAL_COLORS.brand.primary }}>Multiplayer</h1>
            <p style={{ color: GLOBAL_COLORS.text.secondary }}>Compete with friends in real-time</p>
         </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Host Card */}
          <div 
            className="relative overflow-hidden rounded-2xl p-10 flex flex-col items-center justify-center group border border-gray-800 hover:border-gray-700 transition-colors h-96"
            style={{ backgroundColor: GLOBAL_COLORS.surface }}
          >
            <div className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: GLOBAL_COLORS.text.secondary }}>Create Room</div>
            <h2 className="text-5xl font-black mb-8" style={{ color: GLOBAL_COLORS.brand.primary }}>HOST</h2>
            
            <form onSubmit={handleHost} className="w-full max-w-xs flex flex-col gap-4 z-10">
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  placeholder="YOUR NAME"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-center text-lg font-bold tracking-wide focus:outline-none text-white placeholder-gray-600"
                  style={{ borderColor: "transparent" }} // Override border
                  onFocus={(e) => e.target.style.borderColor = GLOBAL_COLORS.brand.primary}
                  onBlur={(e) => e.target.style.borderColor = "transparent"}
                  maxLength={15}
                />
                <button 
                    type="submit"
                    disabled={!hostName.trim()}
                    className="w-full px-8 py-3 text-gray-900 font-bold rounded-lg transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    style={{ 
                      backgroundColor: GLOBAL_COLORS.brand.primary,
                      boxShadow: `0 10px 15px -3px ${GLOBAL_COLORS.brand.primary}33`
                    }}
                >
                    Start Hosting
                </button>
            </form>

            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>

          {/* Join Card */}
          <div 
            className="relative overflow-hidden rounded-2xl p-10 flex flex-col items-center justify-center group border border-gray-800 hover:border-gray-700 transition-colors h-96"
            style={{ backgroundColor: GLOBAL_COLORS.surface }}
          >
            <div className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: GLOBAL_COLORS.text.secondary }}>Join Room</div>
            <h2 className="text-5xl font-black mb-8" style={{ color: GLOBAL_COLORS.brand.primary }}>JOIN</h2>
            
            <form onSubmit={handleJoin} className="w-full max-w-xs flex flex-col gap-4 z-10">
                <input
                  type="text"
                  value={joinName}
                  onChange={(e) => setJoinName(e.target.value)}
                  placeholder="YOUR NAME"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-center text-lg font-bold tracking-wide focus:outline-none text-white placeholder-gray-600"
                  style={{ borderColor: "transparent" }}
                  onFocus={(e) => e.target.style.borderColor = GLOBAL_COLORS.brand.primary}
                  onBlur={(e) => e.target.style.borderColor = "transparent"}
                  maxLength={15}
                />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-center text-xl font-bold tracking-widest uppercase focus:outline-none text-white placeholder-gray-600"
                  style={{ borderColor: "transparent" }}
                  onFocus={(e) => e.target.style.borderColor = GLOBAL_COLORS.brand.primary}
                  onBlur={(e) => e.target.style.borderColor = "transparent"}
                  maxLength={6}
                />
                <button
                    type="submit"
                    disabled={!code.trim() || !joinName.trim()}
                    className="w-full px-8 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition"
                >
                    Join Room
                </button>
            </form>

            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
             <Link href="/" className="transition text-sm hover:text-white" style={{ color: GLOBAL_COLORS.text.secondary }}>
                ← Back to Typing
            </Link>
        </div>
      </div>
    </div>
  );
}
