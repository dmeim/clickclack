import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Host() {
  const [searchParams] = useSearchParams();
  const hostName = searchParams.get("name") || "Host";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-4 text-[var(--text-primary)]">
        Host Room
      </h1>
      <p className="text-lg mb-8 text-[var(--text-secondary)]">
        Hosting as: {hostName}
      </p>

      {/* Placeholder for host controls and participant list */}
      <div className="w-full max-w-2xl p-8 rounded-lg bg-[var(--surface)] mb-8">
        <p className="text-center text-[var(--text-secondary)]">
          Host controls and Convex integration will go here
        </p>
      </div>

      <Link to="/connect">
        <Button variant="ghost">← Back to Connect</Button>
      </Link>
    </div>
  );
}
