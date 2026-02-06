// src/components/race/Podium.tsx
// Podium display for race results
import type { LegacyTheme } from "@/types/theme";
import { Trophy, Medal, Award } from "lucide-react";
import { motion } from "framer-motion";

interface RaceRanking {
  sessionId: string;
  name: string;
  emoji?: string;
  position: number;
  wpm: number;
  accuracy: number;
  finishTime?: number;
  didFinish: boolean;
}

interface PodiumProps {
  rankings: RaceRanking[];
  currentSessionId: string;
  theme: LegacyTheme;
  showTable?: boolean;
  showPodium?: boolean;
}

// Format milliseconds to readable time
function formatTime(ms: number | undefined): string {
  if (!ms) return "--:--";
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export default function Podium({
  rankings,
  currentSessionId,
  theme,
  showTable = true,
  showPodium = true,
}: PodiumProps) {
  // Get top 3 for podium display
  const top3 = rankings.slice(0, 3);

  // Podium positions are displayed: 2nd | 1st | 3rd
  const podiumOrder = [top3[1], top3[0], top3[2]].filter(Boolean);

  const getPodiumStyles = (position: number) => {
    switch (position) {
      case 1:
        return {
          height: "160px",
          color: theme.statusWarning,
          bgColor: theme.statusWarningMuted,
          icon: Trophy,
          label: "1st",
        };
      case 2:
        return {
          height: "120px",
          color: theme.textSecondary,
          bgColor: theme.surfaceColor,
          icon: Medal,
          label: "2nd",
        };
      case 3:
        return {
          height: "80px",
          color: "#cd7f32", // Bronze color
          bgColor: "rgba(205, 127, 50, 0.2)",
          icon: Award,
          label: "3rd",
        };
      default:
        return {
          height: "60px",
          color: theme.textMuted,
          bgColor: theme.elevatedColor,
          icon: Award,
          label: `${position}th`,
        };
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Podium visualization */}
      {showPodium && (
      <div className={`flex items-end justify-center gap-4 ${showTable ? "mb-8" : ""}`}>
        {podiumOrder.map((racer) => {
          if (!racer) return null;
          const styles = getPodiumStyles(racer.position);
          const Icon = styles.icon;
          const isCurrentUser = racer.sessionId === currentSessionId;
          // Stagger: 3rd (index 0 or 2), then 2nd, then 1st
          // podiumOrder is [2nd, 1st, 3rd], reveal order: 3rd -> 2nd -> 1st
          const revealOrder = racer.position === 3 ? 0 : racer.position === 2 ? 1 : 2;
          const delay = revealOrder * 0.35;

          return (
            <motion.div
              key={racer.sessionId}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay, duration: 0.5, ease: "easeOut" }}
            >
              {/* Racer info */}
              <motion.div
                className="mb-3 text-4xl"
                style={{
                  filter: isCurrentUser ? "drop-shadow(0 0 10px currentColor)" : "none",
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: delay + 0.3, type: "spring", stiffness: 400, damping: 20 }}
              >
                {racer.emoji || "🏎️"}
              </motion.div>
              <motion.p
                className={`font-bold mb-1 ${racer.position === 1 ? "text-lg" : "text-sm"}`}
                style={{
                  color: isCurrentUser ? theme.accentColor : theme.textPrimary,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.4, duration: 0.3 }}
              >
                {racer.name}
              </motion.p>
              <motion.p
                className="text-sm font-medium mb-2"
                style={{ color: styles.color }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.5, duration: 0.3 }}
              >
                {racer.wpm} WPM
              </motion.p>

              {/* Podium stand - rises from bottom */}
              <motion.div
                className="w-28 rounded-t-lg flex flex-col items-center justify-center overflow-hidden"
                style={{
                  backgroundColor: styles.bgColor,
                  border: `2px solid ${styles.color}`,
                  borderBottom: "none",
                }}
                initial={{ height: 0 }}
                animate={{ height: styles.height }}
                transition={{ delay, duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <Icon
                  size={racer.position === 1 ? 32 : 24}
                  style={{ color: styles.color }}
                  fill={racer.position === 1 ? styles.color : "none"}
                />
                <span
                  className="font-black text-xl mt-1"
                  style={{ color: styles.color }}
                >
                  {styles.label}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      )}

      {/* Full results table */}
      {showTable && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            backgroundColor: theme.surfaceColor,
            border: `1px solid ${theme.borderDefault}`,
          }}
        >
          <table className="w-full">
            <thead>
              <tr style={{ backgroundColor: theme.elevatedColor }}>
                <th
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  Rank
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  Racer
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  WPM
                </th>
                <th
                  className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider"
                  style={{ color: theme.textSecondary }}
                >
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((racer, index) => {
                const isCurrentUser = racer.sessionId === currentSessionId;
                return (
                  <motion.tr
                    key={racer.sessionId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.08, duration: 0.3 }}
                    style={{
                      backgroundColor: isCurrentUser
                        ? theme.accentSubtle
                        : index % 2 === 0
                        ? "transparent"
                        : theme.elevatedColor,
                    }}
                  >
                    <td className="px-4 py-3">
                      <span
                        className="font-bold"
                        style={{
                          color:
                            racer.position === 1
                              ? theme.statusWarning
                              : racer.position === 2
                              ? theme.textSecondary
                              : racer.position === 3
                              ? "#cd7f32"
                              : theme.textMuted,
                        }}
                      >
                        {racer.position}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{racer.emoji || "🏎️"}</span>
                        <span
                          className="font-medium"
                          style={{
                            color: isCurrentUser
                              ? theme.accentColor
                              : theme.textPrimary,
                          }}
                        >
                          {racer.name}
                          {isCurrentUser && (
                            <span
                              className="ml-2 text-xs"
                              style={{ color: theme.textSecondary }}
                            >
                              (you)
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono font-bold"
                      style={{ color: theme.textPrimary }}
                    >
                      {racer.wpm}
                    </td>
                    <td
                      className="px-4 py-3 text-right font-mono"
                      style={{
                        color: racer.didFinish
                          ? theme.textPrimary
                          : theme.statusError,
                      }}
                    >
                      {racer.didFinish ? formatTime(racer.finishTime) : "DNF"}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
