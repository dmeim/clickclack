import { useUser, useClerk, SignInButton } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { LegacyTheme } from "@/types/theme";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function UserButton() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);
  const lastSyncedKeyRef = useRef<string | null>(null);
  const { legacyTheme } = useTheme();

  // Fallback theme for when context is loading
  const theme: LegacyTheme = legacyTheme ?? {
    cursor: "#3cb5ee",
    defaultText: "#4b5563",
    upcomingText: "#4b5563",
    correctText: "#d1d5db",
    incorrectText: "#ef4444",
    ghostCursor: "#a855f7",
    buttonUnselected: "#3cb5ee",
    buttonSelected: "#0097b2",
    accentColor: "#a855f7",
    accentMuted: "rgba(168, 85, 247, 0.3)",
    accentSubtle: "rgba(168, 85, 247, 0.1)",
    backgroundColor: "#323437",
    surfaceColor: "#2c2e31",
    elevatedColor: "#37383b",
    overlayColor: "rgba(0, 0, 0, 0.5)",
    textPrimary: "#d1d5db",
    textSecondary: "#4b5563",
    textMuted: "rgba(75, 85, 99, 0.6)",
    textInverse: "#ffffff",
    borderDefault: "rgba(75, 85, 99, 0.3)",
    borderSubtle: "rgba(75, 85, 99, 0.15)",
    borderFocus: "#3cb5ee",
    statusSuccess: "#22c55e",
    statusSuccessMuted: "rgba(34, 197, 94, 0.3)",
    statusError: "#ef4444",
    statusErrorMuted: "rgba(239, 68, 68, 0.3)",
    statusWarning: "#f59e0b",
    statusWarningMuted: "rgba(245, 158, 11, 0.3)",
  };

  // Sync user to Convex when they sign in
  useEffect(() => {
    if (isSignedIn && user) {
      const email = user.primaryEmailAddress?.emailAddress ?? "";
      const username = user.username ?? user.firstName ?? "User";
      const avatarUrl = user.imageUrl;
      const syncKey = `${user.id}:${email}:${username}:${avatarUrl}`;

      if (lastSyncedKeyRef.current === syncKey) {
        return;
      }

      const syncUser = async () => {
        try {
          await getOrCreateUser({
            clerkId: user.id,
            email,
            username,
            avatarUrl,
          });
          lastSyncedKeyRef.current = syncKey;
        } catch (error) {
          console.error("Failed to sync user to Convex:", error);
        }
      };
      syncUser();
    } else if (!isSignedIn) {
      lastSyncedKeyRef.current = null;
    }
  }, [isSignedIn, user, getOrCreateUser]);

  // Loading state
  if (!isLoaded) {
    return (
      <div
        className="flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${theme.surfaceColor}80` }}
      >
        <div
          className="h-5 w-5 rounded-full animate-pulse"
          style={{ backgroundColor: theme.buttonUnselected }}
        />
      </div>
    );
  }

  // Signed out state
  if (!isSignedIn) {
    return (
      <SignInButton mode="modal">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 transition hover:bg-gray-700/50"
          style={{ color: theme.buttonUnselected }}
          title="Sign In"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            <polyline points="10 17 15 12 10 7" />
            <line x1="15" y1="12" x2="3" y2="12" />
          </svg>
          <span className="text-sm font-medium hidden sm:inline">Sign In</span>
        </button>
      </SignInButton>
    );
  }

  // Signed in state - show avatar dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg transition hover:bg-gray-800/50 focus:outline-none"
          title={user?.username ?? user?.firstName ?? "Account"}
        >
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt="Avatar"
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium"
              style={{ backgroundColor: theme.buttonSelected, color: theme.backgroundColor }}
            >
              {(user?.username ?? user?.firstName ?? "U")[0].toUpperCase()}
            </div>
          )}
          <span
            className="text-sm font-medium hidden sm:inline max-w-[100px] truncate"
            style={{ color: theme.textPrimary }}
          >
            {user?.username ?? user?.firstName ?? "User"}
          </span>
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
            style={{ color: theme.buttonUnselected }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48"
        style={{ backgroundColor: theme.surfaceColor, borderColor: theme.borderSubtle }}
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>
            {user?.username ?? user?.firstName ?? "User"}
          </p>
          <p className="text-xs truncate" style={{ color: theme.textSecondary }}>
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>
        <DropdownMenuSeparator style={{ backgroundColor: theme.borderSubtle }} />
        <DropdownMenuItem
          onClick={() => openUserProfile()}
          className="cursor-pointer"
          style={{ color: theme.textPrimary }}
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
            className="mr-2"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Account
        </DropdownMenuItem>
        <DropdownMenuSeparator style={{ backgroundColor: theme.borderSubtle }} />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer"
          style={{ color: theme.statusError }}
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
            className="mr-2"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
