import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4 text-[var(--text-primary)]">
        TypeSetGo
      </h1>
      <p className="text-lg mb-8 text-[var(--text-secondary)]">
        Practice typing, improve your speed
      </p>

      {/* Placeholder for TypingPractice component */}
      <div className="w-full max-w-4xl p-8 rounded-lg bg-[var(--surface)] mb-8">
        <p className="text-center text-[var(--text-secondary)]">
          TypingPractice component will go here
        </p>
      </div>

      <Link to="/connect">
        <Button variant="outline">Connect / Multiplayer</Button>
      </Link>
    </div>
  );
}
