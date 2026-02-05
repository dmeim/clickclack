import type { SettingsState } from "@/lib/typing-constants";
import type { LegacyTheme } from "@/types/theme";
import { getRandomSoundUrl } from "@/lib/sounds";
import type { SoundManifest } from "@/lib/sounds";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SettingsState;
  onUpdateSettings: (updates: Partial<SettingsState>) => void;
  soundManifest: SoundManifest | null;
  theme: LegacyTheme;
}

export default function SoundSettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  soundManifest,
  theme,
}: SoundSettingsModalProps) {
  const playPreview = (category: string, pack: string) => {
    const soundUrl = getRandomSoundUrl(soundManifest, category, pack);
    if (!soundUrl) return;
    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      console.error("Preview error", e);
    }
  };

  // Helper to safely get keys
  const getPacks = (category: string) => {
    if (!soundManifest) return [];
    return soundManifest[category] ? Object.keys(soundManifest[category]) : [];
  };

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
            Sound Settings
          </DialogTitle>
          <DialogDescription style={{ color: theme.textSecondary }}>
            Customize the audio feedback for typing, warnings, and errors.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          {/* Master Toggle */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => onUpdateSettings({ soundEnabled: false })}
              className="group relative inline-flex items-center justify-center px-6 py-2 font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: !settings.soundEnabled ? `${theme.buttonSelected}30` : `${theme.defaultText}20`,
                color: !settings.soundEnabled ? theme.correctText : theme.defaultText,
                boxShadow: !settings.soundEnabled ? `0 0 0 2px ${theme.buttonSelected}` : "none",
              }}
            >
              Off
            </button>

            <button
              onClick={() => onUpdateSettings({ soundEnabled: true })}
              className="group relative inline-flex items-center justify-center px-6 py-2 font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{
                backgroundColor: settings.soundEnabled ? `${theme.buttonSelected}30` : `${theme.defaultText}20`,
                color: settings.soundEnabled ? theme.correctText : theme.defaultText,
                boxShadow: settings.soundEnabled ? `0 0 0 2px ${theme.buttonSelected}` : "none",
              }}
            >
              On
              {settings.soundEnabled && (
                <div
                  className="absolute bottom-0 left-0 h-1 w-full scale-x-100 rounded-b-lg transition-transform duration-200"
                  style={{ backgroundColor: theme.buttonSelected }}
                ></div>
              )}
            </button>
          </div>

          {/* Sound Selection Dropdowns */}
          <div
            className={`space-y-4 transition-opacity duration-200 ${!settings.soundEnabled ? "opacity-50 pointer-events-none" : ""}`}
          >
            {/* Typing Sound */}
            <div className="flex flex-col gap-2">
              <label className="text-sm" style={{ color: theme.textSecondary }}>Typing Sound</label>
              <div className="flex items-center gap-2">
                <select
                  value={settings.typingSound}
                  onChange={(e) =>
                    onUpdateSettings({ typingSound: e.target.value })
                  }
                  className="w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: `${theme.backgroundColor}80`,
                    color: theme.correctText,
                    ["--tw-ring-color" as string]: theme.buttonSelected,
                  }}
                >
                  {getPacks("typing").map((pack) => (
                    <option key={pack} value={pack}>
                      {pack.charAt(0).toUpperCase() + pack.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => playPreview("typing", settings.typingSound)}
                  className="p-2 rounded hover:opacity-75 transition"
                  style={{ color: theme.textSecondary }}
                  title="Preview sound"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Warning Sound */}
            <div className="flex flex-col gap-2">
              <label className="text-sm" style={{ color: theme.textSecondary }}>Warning Sound</label>
              <div className="flex items-center gap-2">
                <select
                  value={settings.warningSound}
                  onChange={(e) =>
                    onUpdateSettings({ warningSound: e.target.value })
                  }
                  className="w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: `${theme.backgroundColor}80`,
                    color: theme.correctText,
                    ["--tw-ring-color" as string]: theme.buttonSelected,
                  }}
                >
                  {getPacks("warning").map((pack) => (
                    <option key={pack} value={pack}>
                      {pack.charAt(0).toUpperCase() + pack.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => playPreview("warning", settings.warningSound)}
                  className="p-2 rounded hover:opacity-75 transition"
                  style={{ color: theme.textSecondary }}
                  title="Preview sound"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error Sound (Placeholder) */}
            <div className="flex flex-col gap-2">
              <label className="text-sm" style={{ color: theme.textSecondary }}>Error Sound</label>
              <div className="flex items-center gap-2">
                <select
                  value={settings.errorSound}
                  onChange={(e) =>
                    onUpdateSettings({ errorSound: e.target.value })
                  }
                  className="w-full rounded px-3 py-2 text-sm focus:outline-none focus:ring-2"
                  style={{
                    backgroundColor: `${theme.backgroundColor}80`,
                    color: theme.correctText,
                    ["--tw-ring-color" as string]: theme.buttonSelected,
                  }}
                  disabled={getPacks("error").length === 0}
                >
                  <option value="">None</option>
                  {getPacks("error").map((pack) => (
                    <option key={pack} value={pack}>
                      {pack.charAt(0).toUpperCase() + pack.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    settings.errorSound &&
                    playPreview("error", settings.errorSound)
                  }
                  className={`p-2 rounded hover:opacity-75 transition ${!settings.errorSound ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ color: theme.textSecondary }}
                  title="Preview sound"
                  disabled={!settings.errorSound}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
