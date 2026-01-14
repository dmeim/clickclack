import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Connect() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-8 text-[var(--text-primary)]">
        Connect
      </h1>

      <div className="flex gap-4">
        <Link to="/connect/host">
          <Button>Host a Room</Button>
        </Link>
        <Link to="/connect/join">
          <Button variant="outline">Join a Room</Button>
        </Link>
      </div>

      <Link to="/" className="mt-8">
        <Button variant="ghost">← Back to Practice</Button>
      </Link>
    </div>
  );
}
