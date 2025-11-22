"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { SettingsState } from "@/components/TypingPractice";

let socket: Socket;

type User = {
  id: string;
  name: string;
  stats: {
    wpm: number;
    accuracy: number;
    progress: number;
  };
};

export default function ConnectHost() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Partial<SettingsState>>({
    mode: "time",
    duration: 30,
    difficulty: "medium",
    punctuation: false,
    numbers: false,
  });
  const [status, setStatus] = useState<"waiting" | "active">("waiting");

  useEffect(() => {
    // Connect to socket
    socket = io();

    socket.on("connect", () => {
      console.log("Connected to server");
      socket.emit("create_room", ({ code }: { code: string }) => {
        setRoomCode(code);
      });
    });

    socket.on("user_joined", (user: User) => {
      setUsers((prev) => [...prev, user]);
    });

    socket.on("user_left", ({ userId }: { userId: string }) => {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    });

    socket.on("stats_update", ({ userId, stats }: { userId: string; stats: any }) => {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, stats } : u))
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateSettings = (newSettings: Partial<SettingsState>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (roomCode) {
      socket.emit("update_settings", { code: roomCode, settings: updated });
    }
  };

  const startTest = () => {
    if (roomCode) {
      socket.emit("start_test", { code: roomCode });
      setStatus("active");
    }
  };

  const stopTest = () => {
    if (roomCode) {
      socket.emit("stop_test", { code: roomCode });
      setStatus("waiting");
    }
  };

  const resetTest = () => {
      if (roomCode) {
          socket.emit("reset_test", { code: roomCode });
          setStatus("waiting");
          // Clear local stats view
          setUsers(prev => prev.map(u => ({ ...u, stats: { wpm: 0, accuracy: 0, progress: 0 } })));
      }
  };

  if (!roomCode) {
    return <div className="min-h-screen flex items-center justify-center bg-[#323437] text-gray-200">Creating room...</div>;
  }

  return (
    <div className="min-h-screen bg-[#323437] text-gray-200 p-8 font-mono">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-yellow-500">Host Panel</h1>
            <p className="text-gray-400">Room Code: <span className="text-2xl font-bold text-white bg-gray-700 px-2 py-1 rounded ml-2 tracking-widest">{roomCode}</span></p>
          </div>
          <div className="space-x-4">
              <button 
                  onClick={resetTest}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition"
              >
                  Reset
              </button>
            {status === "waiting" ? (
              <button
                onClick={startTest}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded transition"
              >
                Start Test
              </button>
            ) : (
              <button
                onClick={stopTest}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition"
              >
                Stop Test
              </button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Settings Column */}
          <div className="bg-[#2c2e31] p-6 rounded-lg space-y-6">
            <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">Settings</h2>
            
            <div>
                <label className="block text-sm text-gray-400 mb-2">Mode</label>
                <div className="flex gap-2">
                    {["time", "words"].map(m => (
                        <button 
                            key={m}
                            onClick={() => updateSettings({ mode: m as any })}
                            className={`flex-1 py-1 rounded text-sm ${settings.mode === m ? "bg-yellow-500 text-gray-900" : "bg-gray-700"}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            {settings.mode === "time" && (
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Duration (s)</label>
                    <div className="flex flex-wrap gap-2">
                        {[15, 30, 60].map(d => (
                             <button 
                                key={d}
                                onClick={() => updateSettings({ duration: d })}
                                className={`px-3 py-1 rounded text-sm ${settings.duration === d ? "bg-yellow-500 text-gray-900" : "bg-gray-700"}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {settings.mode === "words" && (
                <div>
                    <label className="block text-sm text-gray-400 mb-2">Word Target</label>
                    <div className="flex flex-wrap gap-2">
                        {[10, 25, 50, 100].map(w => (
                             <button 
                                key={w}
                                onClick={() => updateSettings({ wordTarget: w })}
                                className={`px-3 py-1 rounded text-sm ${settings.wordTarget === w ? "bg-yellow-500 text-gray-900" : "bg-gray-700"}`}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div>
                <label className="block text-sm text-gray-400 mb-2">Difficulty</label>
                <select 
                    value={settings.difficulty}
                    onChange={(e) => updateSettings({ difficulty: e.target.value as any })}
                    className="w-full bg-gray-700 rounded px-2 py-1 text-sm"
                >
                    {["beginner", "easy", "medium", "hard", "extreme"].map(d => (
                        <option key={d} value={d}>{d}</option>
                    ))}
                </select>
            </div>

             <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={settings.punctuation}
                        onChange={(e) => updateSettings({ punctuation: e.target.checked })}
                        className="rounded bg-gray-700 border-none"
                    />
                    <span className="text-sm text-gray-400">Punctuation</span>
                </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={settings.numbers}
                        onChange={(e) => updateSettings({ numbers: e.target.checked })}
                        className="rounded bg-gray-700 border-none"
                    />
                    <span className="text-sm text-gray-400">Numbers</span>
                </label>
            </div>
          </div>

          {/* Users Column */}
          <div className="md:col-span-2 bg-[#2c2e31] p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h2 className="text-xl font-semibold">Connected Users ({users.length})</h2>
            </div>
            
            <div className="grid gap-4">
                {users.length === 0 && <div className="text-gray-500 text-center py-8">Waiting for users to join...</div>}
                {users.map(user => (
                    <div key={user.id} className="bg-gray-800 p-4 rounded flex items-center justify-between">
                        <div>
                            <div className="font-bold text-lg">{user.name}</div>
                            <div className="text-xs text-gray-500">ID: {user.id.slice(0, 6)}</div>
                        </div>
                        <div className="flex gap-6 text-center">
                            <div>
                                <div className="text-2xl font-bold text-yellow-500">{Math.round(user.stats?.wpm || 0)}</div>
                                <div className="text-xs text-gray-500">WPM</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-300">{Math.round(user.stats?.accuracy || 0)}%</div>
                                <div className="text-xs text-gray-500">ACC</div>
                            </div>
                            <div className="w-24 flex flex-col justify-center">
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-yellow-500 transition-all duration-500" 
                                        style={{ width: `${user.stats?.progress || 0}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500 mt-1 text-right">{Math.round(user.stats?.progress || 0)}%</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
        
        <div className="text-center pt-8">
             <Link href="/" className="text-gray-500 hover:text-gray-300">← Back to Main Menu</Link>
        </div>
      </div>
    </div>
  );
}
