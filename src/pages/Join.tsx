import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Join() {
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") || "Guest";
  const code = searchParams.get("code") || "";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">
        Join Room
      </h1>
      <p className="text-lg mb-2 text-[var(--text-secondary)]">Name: {name}</p>
      {code && (
        <p className="text-lg mb-8 text-[var(--text-secondary)]">
          Room Code: {code}
        </p>
      )}

      {/* Placeholder for join form and participant view */}
      <div className="w-full max-w-2xl p-8 rounded-lg bg-[var(--surface)] mb-8">
        <p className="text-center text-[var(--text-secondary)]">
          Join form and Convex integration will go here
        </p>
      </div>

      <Link to="/connect">
        <Button variant="ghost">← Back to Connect</Button>
      </Link>
    </div>
  );
}
