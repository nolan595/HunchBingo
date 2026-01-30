'use client'
import { useIsMobile } from "@/hooks/useIsMobile";
export default function Home() {
  const isMobile =  useIsMobile();
  return (
    <div>
      {isMobile ? "📱 Mobile view" : "🖥️ Desktop view"}
    </div>
  );
}
