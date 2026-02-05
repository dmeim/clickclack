import { useState } from "react";
import type { SettingsState } from "@/lib/typing-constants";
import type { LegacyTheme } from "@/types/theme";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GhostWriterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsState;
  onUpdateSettings: (updates: Partial<SettingsState>) => void;
  theme: LegacyTheme;
}

const SPEED_PRESETS = [20, 40, 60, 80, 100, 120];

export default function GhostWriterSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  theme,
}: GhostWriterSettingsModalProps) {
  const [customSpeed, setCustomSpeed] = useState(settings.ghostWriterSpeed);

  // Derive customSpeed from settings when it changes
  const displaySpeed = customSpeed !== settings.ghostWriterSpeed ? customSpeed : settings.ghostWriterSpeed;

  const isCustomSpeed = !SPEED_PRESETS.includes(settings.ghostWriterSpeed);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-md"
        style={{
          backgroundColor: theme.surfaceColor,
          borderColor: theme.borderSubtle,
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: theme.textPrimary }}>
            Ghost Writer
          </DialogTitle>
          <DialogDescription style={{ color: theme.textSecondary }}>
            A visual guide that shows where you would be if typing at your target speed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onUpdateSettings({ ghostWriterEnabled: false })}
              className="group relative inline-flex items-center justify-center px-6 py-2 font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: !settings.ghostWriterEnabled ? `${theme.buttonSelected}30` : `${theme.defaultText}20`,
                color: !settings.ghostWriterEnabled ? theme.correctText : theme.defaultText,
                boxShadow: !settings.ghostWriterEnabled ? `0 0 0 2px ${theme.buttonSelected}` : "none",
              }}
            >
              Off
            </button>

            <button
              onClick={() => onUpdateSettings({ ghostWriterEnabled: true })}
              className="group relative inline-flex items-center justify-center px-6 py-2 font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: settings.ghostWriterEnabled ? `${theme.buttonSelected}30` : `${theme.defaultText}20`,
                color: settings.ghostWriterEnabled ? theme.correctText : theme.defaultText,
                boxShadow: settings.ghostWriterEnabled ? `0 0 0 2px ${theme.buttonSelected}` : "none",
              }}
            >
              On
              {settings.ghostWriterEnabled && (
                <div
                  className="absolute bottom-0 left-0 h-1 w-full scale-x-100 rounded-b-lg transition-transform duration-200"
                  style={{ backgroundColor: theme.buttonSelected }}
                ></div>
              )}
            </button>
          </div>

          {/* Speed Selection */}
          <div
            className={`space-y-4 transition-opacity duration-200 ${!settings.ghostWriterEnabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="flex flex-col gap-3">
              <label className="text-sm text-center" style={{ color: theme.textSecondary }}>
                Target Speed (WPM)
              </label>

              {/* Speed Presets */}
              <div className="flex flex-wrap justify-center gap-2">
                {SPEED_PRESETS.map((speed) => (
                  <button
                    key={speed}
                    onClick={() => onUpdateSettings({ ghostWriterSpeed: speed })}
                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200"
                    style={{
                      backgroundColor: settings.ghostWriterSpeed === speed ? `${theme.buttonSelected}30` : `${theme.defaultText}20`,
                      color: settings.ghostWriterSpeed === speed ? theme.correctText : theme.defaultText,
                      boxShadow: settings.ghostWriterSpeed === speed ? `0 0 0 2px ${theme.buttonSelected}` : "none",
                    }}
                  >
                    {speed}
                  </button>
                ))}
              </div>

              {/* Custom Speed Input */}
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-sm" style={{ color: theme.textSecondary }}>Custom:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newSpeed = Math.max(1, customSpeed - 10);
                      setCustomSpeed(newSpeed);
                      onUpdateSettings({ ghostWriterSpeed: newSpeed });
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:opacity-75 transition"
                    style={{ backgroundColor: `${theme.defaultText}20`, color: theme.correctText }}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={displaySpeed}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setCustomSpeed(val);
                    }}
                    onBlur={() => {
                      const clampedSpeed = Math.max(
                        1,
                        Math.min(500, customSpeed)
                      );
                      setCustomSpeed(clampedSpeed);
                      onUpdateSettings({ ghostWriterSpeed: clampedSpeed });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const clampedSpeed = Math.max(
                          1,
                          Math.min(500, customSpeed)
                        );
                        setCustomSpeed(clampedSpeed);
                        onUpdateSettings({ ghostWriterSpeed: clampedSpeed });
                      }
                    }}
                    className="w-20 text-center rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{
                      backgroundColor: `${theme.backgroundColor}80`,
                      color: theme.correctText,
                      boxShadow: isCustomSpeed ? `0 0 0 2px ${theme.buttonSelected}` : "none",
                      ["--tw-ring-color" as string]: theme.buttonSelected,
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newSpeed = Math.min(500, customSpeed + 10);
                      setCustomSpeed(newSpeed);
                      onUpdateSettings({ ghostWriterSpeed: newSpeed });
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded hover:opacity-75 transition"
                    style={{ backgroundColor: `${theme.defaultText}20`, color: theme.correctText }}
                  >
                    +
                  </button>
                </div>
                <span className="text-sm" style={{ color: theme.textSecondary }}>WPM</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
