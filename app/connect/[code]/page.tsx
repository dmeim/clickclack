"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import TypingPractice, { SettingsState } from "@/components/TypingPractice";

let socket: Socket;

export default function ConnectRoom() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const code = params?.code as string;
  const searchName = searchParams.get("name");
  
  const [name, setName] = useState<string | null>(searchName);
  const [inputName, setInputName] = useState("");

  const [connected, setConnected] = useState(false);
  const [lockedSettings, setLockedSettings] = useState<Partial<SettingsState> | null>(null);
  const [status, setStatus] = useState<"waiting" | "active">("waiting");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState(0);
  const [hostName, setHostName] = useState<string>("Host");

  useEffect(() => {
    if (!code || !name) return;

    socket = io();

    socket.on("connect", () => {
      console.log("Connected to server");
      
      socket.emit("join_room", { code, name }, (response: any) => {
          if (response.error) {
            setError(response.error);
        } else {
            setLockedSettings(response.settings);
            setStatus(response.status);
            if (response.hostName) setHostName(response.hostName);
            setConnected(true);
        }
      });
    });

    socket.on("settings_updated", (settings: SettingsState) => {
        setLockedSettings(settings);
        setSessionId(prev => prev + 1);
    });

    socket.on("test_started", () => {
        setStatus("active");
        setSessionId(prev => prev + 1);
    });

    socket.on("test_stopped", () => {
        setStatus("waiting");
    });

    socket.on("test_reset", () => {
        setStatus("waiting");
        setSessionId(prev => prev + 1);
    });

    socket.on("host_disconnected", () => {
        setError("Host disconnected.");
        setConnected(false);
    });

    socket.on("kicked", () => {
        setError("You have been kicked from the room.");
        setConnected(false);
        socket.disconnect();
        setTimeout(() => {
            router.push("/");
        }, 3000);
    });

    return () => {
      socket.disconnect();
    };
  }, [code, name]);

  const handleStatsUpdate = (stats: any) => {
      if (connected) {
          socket.emit("send_stats", { code, stats });
      }
  };

  const handleLeave = () => {
      socket.disconnect();
      router.push("/");
  };

  if (error) {
      return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#323437] text-gray-200 gap-4">
          <div className="text-xl text-red-500">{error}</div>
          <button onClick={() => router.push("/connect")} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
              Go Back
          </button>
      </div>
    );
  }

  if (!name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#323437] text-gray-200 px-4">
          <div className="w-full max-w-md bg-[#2c2e31] p-8 rounded-2xl border border-gray-800 shadow-2xl text-center animate-fade-in">
              <h2 className="text-2xl font-bold text-yellow-500 mb-2">Join Room</h2>
              <p className="text-gray-400 mb-8">Enter your name to join the room</p>
              
              <form onSubmit={(e) => {
                  e.preventDefault();
                  if (inputName.trim()) {
                      setName(inputName.trim());
                  }
              }} className="flex flex-col gap-4">
                  <input
                      type="text"
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      placeholder="YOUR NAME"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded text-center text-lg font-bold tracking-wide focus:border-yellow-500 focus:outline-none text-white placeholder-gray-600"
                      maxLength={15}
                      autoFocus
                  />
                  <button
                      type="submit"
                      disabled={!inputName.trim()}
                      className="w-full px-8 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 font-bold rounded-lg transition shadow-lg shadow-yellow-500/20"
                  >
                      Enter Room
                  </button>
              </form>
              <div className="mt-6">
                 <button onClick={() => router.push("/connect")} className="text-sm text-gray-500 hover:text-gray-300 transition">
                    Cancel
                 </button>
              </div>
          </div>
      </div>
    );
  }

  if (!connected || !lockedSettings) {
       return (
          <div className="min-h-screen flex items-center justify-center bg-[#323437] text-gray-200">
              Connecting to room {code}...
          </div>
      );
  }

  return (
    <TypingPractice 
        connectMode={true}
        lockedSettings={lockedSettings}
        isTestActive={status === "active"}
        onStatsUpdate={handleStatsUpdate}
        onLeave={handleLeave}
        sessionId={sessionId}
        hostName={hostName}
    />
  );
}
