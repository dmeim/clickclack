"use client";

import { useEffect, useState, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import Link from "next/link";
import { SettingsState, Mode, Difficulty, QuoteLength } from "@/components/TypingPractice";

let socket: Socket;

type User = {
  id: string;
  name: string;
  stats: {
    wpm: number;
    accuracy: number;
    progress: number;
    wordsTyped: number;
    timeElapsed: number;
    isFinished: boolean;
  };
};

const TIME_PRESETS = [15, 30, 60, 120, 300];
const WORD_PRESETS = [10, 25, 50, 100, 200];

export default function ConnectHost() {
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<Partial<SettingsState>>({
    mode: "time",
    duration: 30,
    wordTarget: 25,
    difficulty: "medium",
    punctuation: false,
    numbers: false,
    quoteLength: "all",
    presetText: "",
    presetModeType: "finish",
  });
  const [status, setStatus] = useState<"waiting" | "active">("waiting");

  // View Options
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [sortBy, setSortBy] = useState<"join" | "wpm" | "accuracy" | "progress" | "name">("join");
  const [cardSize, setCardSize] = useState(1); // 0.5 to 2

  const [showPresetInput, setShowPresetInput] = useState(false);
  const [tempPresetText, setTempPresetText] = useState("");

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
          setUsers(prev => prev.map(u => ({ 
            ...u, 
            stats: { wpm: 0, accuracy: 0, progress: 0, wordsTyped: 0, timeElapsed: 0, isFinished: false } 
          })));
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            setTempPresetText(ev.target?.result as string);
        };
        reader.readAsText(file);
    }
  };

  const sortedUsers = useMemo(() => {
      let sorted = [...users];
      if (sortBy === "wpm") sorted.sort((a, b) => (b.stats?.wpm || 0) - (a.stats?.wpm || 0));
      if (sortBy === "accuracy") sorted.sort((a, b) => (b.stats?.accuracy || 0) - (a.stats?.accuracy || 0));
      if (sortBy === "progress") sorted.sort((a, b) => (b.stats?.progress || 0) - (a.stats?.progress || 0));
      if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
      return sorted;
  }, [users, sortBy]);

  if (!roomCode) {
    return <div className="min-h-screen flex items-center justify-center bg-[#323437] text-gray-200">Creating room...</div>;
  }

  return (
    <div className="min-h-screen bg-[#323437] text-gray-200 p-8 font-mono flex flex-col">
      
      {/* Header & Controls */}
      <div className="flex flex-col items-center mb-8 space-y-6">
          <div className="text-center">
             <h1 className="text-3xl font-bold text-yellow-500 mb-2">Host Panel</h1>
             <div className="text-gray-400">Room Code: <span className="text-2xl font-bold text-white bg-gray-700 px-3 py-1 rounded ml-2 tracking-widest">{roomCode}</span></div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
              <button 
                  onClick={resetTest}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white transition font-medium"
              >
                  Reset
              </button>
              {status === "waiting" ? (
              <button
                  onClick={startTest}
                  className="px-8 py-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold rounded transition shadow-lg shadow-yellow-500/20"
              >
                  Start Test
              </button>
              ) : (
              <button
                  onClick={stopTest}
                  className="px-8 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded transition shadow-lg shadow-red-500/20"
              >
                  Stop Test
              </button>
              )}
          </div>

          {/* View Options */}
          <div className="flex items-center gap-6 text-sm bg-[#2c2e31] px-6 py-3 rounded-full shadow-lg">
              <div className="flex items-center gap-2">
                  <span className="text-gray-500">Sort:</span>
                  <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-gray-800 border-none rounded px-2 py-1 text-gray-200 cursor-pointer focus:ring-1 focus:ring-yellow-500"
                  >
                      <option value="join">Joined</option>
                      <option value="wpm">WPM</option>
                      <option value="accuracy">Accuracy</option>
                      <option value="progress">Progress</option>
                      <option value="name">Name</option>
                  </select>
              </div>

              <div className="w-px h-4 bg-gray-600"></div>

              <div className="flex items-center gap-2">
                  <span className="text-gray-500">View:</span>
                  <div className="flex bg-gray-800 rounded p-1">
                      <button 
                          onClick={() => setViewMode("grid")}
                          className={`px-2 py-0.5 rounded ${viewMode === "grid" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
                      >
                          Grid
                      </button>
                      <button 
                          onClick={() => setViewMode("list")}
                          className={`px-2 py-0.5 rounded ${viewMode === "list" ? "bg-gray-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
                      >
                          List
                      </button>
                  </div>
              </div>

               {viewMode === "grid" && (
                  <>
                    <div className="w-px h-4 bg-gray-600"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">Size:</span>
                        <input 
                            type="range" 
                            min="0.5" 
                            max="2" 
                            step="0.1" 
                            value={cardSize}
                            onChange={(e) => setCardSize(parseFloat(e.target.value))}
                            className="w-24 accent-yellow-500"
                        />
                    </div>
                  </>
               )}
          </div>
      </div>

      {/* Settings Bar (Mimicking TypingPractice) */}
      <div className="flex justify-center mb-12">
         <div className="flex flex-col items-center gap-4">
             {/* Top Row */}
             <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-400">
                 
                 {/* Mode */}
                 <div className="flex bg-[#2c2e31] rounded-lg p-1">
                    {(["time", "words", "quote", "zen", "preset"] as Mode[]).map((m) => (
                        <button
                            key={m}
                            onClick={() => {
                                if (settings.mode === m && m === "preset") {
                                    setShowPresetInput(true);
                                } else {
                                    updateSettings({ mode: m });
                                }
                            }}
                            className={`px-3 py-1 rounded transition ${settings.mode === m ? "text-yellow-500 font-medium bg-gray-800" : "hover:text-gray-200"}`}
                        >
                            {m}
                        </button>
                    ))}
                 </div>

                 <div className="w-px h-4 bg-gray-700"></div>

                 {/* Toggles */}
                 {settings.mode !== "preset" && (
                     <div className="flex gap-4 bg-[#2c2e31] rounded-lg px-3 py-1.5">
                        <button 
                            onClick={() => updateSettings({ punctuation: !settings.punctuation })}
                            className={`flex items-center gap-2 transition ${settings.punctuation ? "text-yellow-500" : "hover:text-gray-200"}`}
                        >
                            <span className={settings.punctuation ? "bg-yellow-500 text-gray-900 rounded px-1 text-xs font-bold" : "bg-gray-700 rounded px-1 text-xs"}>@</span>
                             Punctuation
                        </button>
                        <button 
                            onClick={() => updateSettings({ numbers: !settings.numbers })}
                            className={`flex items-center gap-2 transition ${settings.numbers ? "text-yellow-500" : "hover:text-gray-200"}`}
                        >
                             <span className={settings.numbers ? "bg-yellow-500 text-gray-900 rounded px-1 text-xs font-bold" : "bg-gray-700 rounded px-1 text-xs"}>#</span>
                             Numbers
                        </button>
                     </div>
                 )}
             </div>

             {/* Bottom Row: Sub-settings */}
             <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-gray-400">
                 
                 {/* Time/Word Presets */}
                 {(settings.mode === "time" || (settings.mode === "preset" && settings.presetModeType === "time")) && (
                    <div className="flex bg-[#2c2e31] rounded-lg p-1">
                        {TIME_PRESETS.map(d => (
                            <button
                                key={d}
                                onClick={() => updateSettings({ duration: d })}
                                className={`px-3 py-1 rounded transition ${settings.duration === d ? "text-yellow-500 font-medium bg-gray-800" : "hover:text-gray-200"}`}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                 )}

                 {settings.mode === "words" && (
                    <div className="flex bg-[#2c2e31] rounded-lg p-1">
                        {WORD_PRESETS.map(w => (
                            <button
                                key={w}
                                onClick={() => updateSettings({ wordTarget: w })}
                                className={`px-3 py-1 rounded transition ${settings.wordTarget === w ? "text-yellow-500 font-medium bg-gray-800" : "hover:text-gray-200"}`}
                            >
                                {w}
                            </button>
                        ))}
                    </div>
                 )}

                 {settings.mode === "quote" && (
                    <div className="flex bg-[#2c2e31] rounded-lg p-1">
                        {(["all", "short", "medium", "long", "xl"] as QuoteLength[]).map(l => (
                            <button
                                key={l}
                                onClick={() => updateSettings({ quoteLength: l })}
                                className={`px-3 py-1 rounded transition ${settings.quoteLength === l ? "text-yellow-500 font-medium bg-gray-800" : "hover:text-gray-200"}`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                 )}

                 {/* Difficulty (Non-Quote/Preset) */}
                 {settings.mode !== "quote" && settings.mode !== "zen" && settings.mode !== "preset" && (
                    <div className="flex bg-[#2c2e31] rounded-lg p-1 ml-2">
                        {(["beginner", "easy", "medium", "hard", "extreme"] as Difficulty[]).map(d => (
                            <button
                                key={d}
                                onClick={() => updateSettings({ difficulty: d })}
                                className={`px-3 py-1 rounded transition ${settings.difficulty === d ? "text-yellow-500 font-medium bg-gray-800" : "hover:text-gray-200"}`}
                            >
                                {d === "extreme" ? "expert" : d}
                            </button>
                        ))}
                    </div>
                 )}

                 {/* Preset Type */}
                 {settings.mode === "preset" && (
                    <div className="flex bg-[#2c2e31] rounded-lg p-1">
                        {(["finish", "time"] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => updateSettings({ presetModeType: t })}
                                className={`px-3 py-1 rounded transition ${settings.presetModeType === t ? "text-yellow-500 font-medium bg-gray-800" : "hover:text-gray-200"}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                 )}
                 
                 {/* Edit Preset Button */}
                 {settings.mode === "preset" && (
                     <button
                        onClick={() => setShowPresetInput(true)}
                        className="ml-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-200 transition flex items-center gap-2"
                     >
                         <span>✎</span> Edit Text
                     </button>
                 )}

             </div>
         </div>
      </div>

      {/* Connected Users Area */}
      <div className={`flex-1 overflow-y-auto p-4 rounded-xl bg-[#27292c] ${users.length === 0 ? "flex items-center justify-center" : ""}`}>
        {users.length === 0 ? (
            <div className="text-center text-gray-500">
                <div className="text-xl mb-2">Waiting for users to join...</div>
                <div>Share code <span className="text-yellow-500 font-bold">{roomCode}</span></div>
            </div>
        ) : (
            <div 
                className={
                    viewMode === "grid" 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 content-start"
                    : "flex flex-col gap-2"
                }
                style={viewMode === "grid" ? { 
                    gridTemplateColumns: `repeat(auto-fill, minmax(${300 * cardSize}px, 1fr))`
                } : {}}
            >
                {sortedUsers.map(user => {
                    // Calculate specific progress
                    let progressDisplay = <div className="w-full h-full bg-gray-700"></div>;
                    let progressText = "";
                    let isFinished = user.stats?.isFinished;

                    // Logic for different modes
                    if (settings.mode === "time" || (settings.mode === "preset" && settings.presetModeType === "time")) {
                        const duration = settings.duration || 30;
                        const elapsed = (user.stats?.timeElapsed || 0) / 1000;
                        const remaining = Math.max(0, duration - elapsed);
                        const progressPct = Math.min(100, (elapsed / duration) * 100);
                        
                        progressDisplay = (
                            <div className="h-full bg-gray-700 overflow-hidden rounded-full relative">
                                <div 
                                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${isFinished ? "bg-green-500" : "bg-yellow-500"}`}
                                    style={{ width: `${isFinished ? 100 : progressPct}%` }}
                                />
                            </div>
                        );
                        progressText = isFinished ? "Done" : `${remaining.toFixed(0)}s`;

                    } else if (settings.mode === "words") {
                        const target = settings.wordTarget || 25;
                        const typed = user.stats?.wordsTyped || 0; // Approx words
                        const progressPct = Math.min(100, (typed / target) * 100);

                        progressDisplay = (
                            <div className="h-full bg-gray-700 overflow-hidden rounded-full relative">
                                <div 
                                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${isFinished ? "bg-green-500" : "bg-yellow-500"}`}
                                    style={{ width: `${isFinished ? 100 : progressPct}%` }}
                                />
                            </div>
                        );
                        progressText = isFinished ? "Done" : `${Math.floor(typed)}/${target}`;

                    } else {
                        // Quote, Preset (finish), Zen
                        const progress = user.stats?.progress || 0;
                         progressDisplay = (
                            <div className="h-full bg-gray-700 overflow-hidden rounded-full relative">
                                <div 
                                    className={`absolute top-0 left-0 h-full transition-all duration-500 ${isFinished ? "bg-green-500" : "bg-yellow-500"}`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        );
                        progressText = isFinished ? "Done" : `${Math.round(progress)}%`;
                    }

                    if (viewMode === "list") {
                        return (
                            <div key={user.id} className="bg-[#2c2e31] p-4 rounded flex items-center justify-between hover:bg-[#323437] transition border-l-4 border-transparent hover:border-yellow-500">
                                <div className="flex items-center gap-4 w-1/3">
                                    <div className="font-bold text-lg text-gray-200 truncate">{user.name}</div>
                                    <div className="text-xs text-gray-600 font-mono">{user.id.slice(0, 4)}</div>
                                </div>
                                
                                <div className="flex-1 px-4">
                                     <div className="h-2 w-full rounded-full overflow-hidden bg-gray-800">
                                        {progressDisplay}
                                     </div>
                                     <div className="text-xs text-right text-gray-500 mt-1">{progressText}</div>
                                </div>

                                <div className="flex gap-8 w-1/3 justify-end">
                                    <div className="text-right w-16">
                                        <div className="text-xl font-bold text-yellow-500">{Math.round(user.stats?.wpm || 0)}</div>
                                        <div className="text-xs text-gray-500">WPM</div>
                                    </div>
                                    <div className="text-right w-16">
                                        <div className="text-xl font-bold text-gray-300">{Math.round(user.stats?.accuracy || 0)}%</div>
                                        <div className="text-xs text-gray-500">ACC</div>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    // Grid Card View
                    return (
                        <div 
                            key={user.id} 
                            className="bg-[#2c2e31] rounded-lg p-6 flex flex-col gap-4 hover:shadow-lg transition border-t-4 border-transparent hover:border-yellow-500"
                            style={{ fontSize: `${cardSize}rem` }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="font-bold text-[1.2em] text-gray-200 truncate w-3/4" title={user.name}>{user.name}</div>
                                <div className="text-[0.6em] text-gray-600 font-mono mt-1">{user.id.slice(0, 4)}</div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-[0.8em] text-gray-500">
                                    <span>Progress</span>
                                    <span>{progressText}</span>
                                </div>
                                <div className="h-3 w-full rounded-full overflow-hidden bg-gray-800">
                                    {progressDisplay}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <div className="bg-gray-800 rounded p-3 text-center">
                                    <div className="text-[1.5em] font-bold text-yellow-500 leading-none">{Math.round(user.stats?.wpm || 0)}</div>
                                    <div className="text-[0.6em] text-gray-500 mt-1">WPM</div>
                                </div>
                                <div className="bg-gray-800 rounded p-3 text-center">
                                    <div className="text-[1.5em] font-bold text-gray-300 leading-none">{Math.round(user.stats?.accuracy || 0)}%</div>
                                    <div className="text-[0.6em] text-gray-500 mt-1">Accuracy</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Preset Input Modal */}
      {showPresetInput && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPresetInput(false)}
        >
          <div
            className="w-full max-w-2xl rounded-lg bg-[#2c2e31] p-6 shadow-xl border border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-200">Custom Text</h2>
              <button
                onClick={() => setShowPresetInput(false)}
                className="text-gray-400 hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <textarea
                  className="w-full h-48 rounded bg-gray-700 p-4 text-gray-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 font-mono text-sm"
                  placeholder="Paste your text here..."
                  onChange={(e) => setTempPresetText(e.target.value)}
                  value={tempPresetText}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-700" />
                <span className="text-sm text-gray-500">OR</span>
                <div className="h-px flex-1 bg-gray-700" />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">
                  Upload text file (.txt)
                </label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-400 file:mr-4 file:rounded file:border-0 file:bg-gray-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-200 hover:file:bg-gray-600 cursor-pointer"
                />
              </div>
              
              <div className="flex justify-end pt-4">
                 <button
                    onClick={() => {
                        if (tempPresetText) {
                            updateSettings({ presetText: tempPresetText.trim() });
                            setShowPresetInput(false);
                        }
                    }}
                    disabled={!tempPresetText}
                    className={`px-6 py-2 rounded font-medium transition ${
                        tempPresetText 
                        ? "bg-yellow-500 text-gray-900 hover:bg-yellow-400 shadow-lg shadow-yellow-500/20" 
                        : "bg-gray-700 text-gray-500 cursor-not-allowed"
                    }`}
                 >
                    Set Text
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center pt-6 text-xs text-gray-600">
           <Link href="/" className="hover:text-gray-400 transition">← Back to Main Menu</Link>
      </div>
    </div>
  );
}
