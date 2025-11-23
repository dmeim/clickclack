import TypingPractice from "@/components/TypingPractice";
import { headers } from "next/headers";

export default async function Home() {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  let ipLog = "IP: unknown";

  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips.length > 1) {
      ipLog = `Client: ${ips[0]} | Proxy: ${ips.slice(1).join(", ")}`;
    } else {
      ipLog = `IP: ${ips[0]}`;
    }
  } else {
    // Fallback if needed, though usually headers are present in production
    ipLog = "IP: unknown"; 
  }
  
  console.log(`[VISIT] 🌍 Visitor on site | ${ipLog}`);

  return <TypingPractice />;
}
