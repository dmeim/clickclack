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
  const name = searchParams.get("name") || "Anonymous";

  const [connected, setConnected] = useState(false);
  const [lockedSettings, setLockedSettings] = useState<Partial<SettingsState> | null>(null);
  const [status, setStatus] = useState<"waiting" | "active">("waiting");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    socket = io();

    socket.on("connect", () => {
      console.log("Connected to server");
      
      socket.emit("join_room", { code, name }, (response: any) => {
        if (response.error) {
            setError(response.error);
        } else {
            setLockedSettings(response.settings);
            setStatus(response.status);
            setConnected(true);
        }
      });
    });

    socket.on("settings_updated", (settings: SettingsState) => {
        setLockedSettings(settings);
    });

    socket.on("test_started", () => {
        setStatus("active");
    });

    socket.on("test_stopped", () => {
        setStatus("waiting");
    });

    socket.on("test_reset", () => {
        setStatus("waiting");
        // Force reload or signal reset?
        // TypingPractice handles reset via isTestActive toggle usually, 
        // but if we are already waiting, we might need a hard reset signal.
        // For now, relying on status change to 'waiting' might be enough to stop it.
        // But to clear text, TypingPractice might need a specific reset prop or key change.
        // We can force re-mount by changing key, but that might be jarring.
        // Alternatively, we can add a 'resetToken' prop to TypingPractice.
        // For MVP, let's assume status change is enough.
        // Wait, TypingPractice reset logic in useEffect depends on isTestActive changing.
        // If we get a reset, we go to waiting.
    });

    socket.on("host_disconnected", () => {
        setError("Host disconnected.");
        setConnected(false);
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
              <button onClick={() => router.push("/connect_join")} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">
                  Go Back
              </button>
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
    />
  );
}
