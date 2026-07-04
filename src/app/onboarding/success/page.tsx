"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function OnboardingSuccessPage() {
  const [nickname, setNickname] = useState("Casper");

  useEffect(() => {
    try {
      const data = localStorage.getItem("knock_user_onboarding");
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.nickname) setNickname(parsed.nickname);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-8 min-h-screen bg-knock-bg text-knock-cream">
      {/* Background Ambience */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-knock-mint/5 blur-[100px] pointer-events-none" />

      {/* Container Card */}
      <div className="w-full max-w-md bg-knock-card border border-knock-cream/10 rounded-3xl p-8 shadow-2xl relative text-center space-y-6 animate-[scaleUp_0.3s_ease-out]">
        
        {/* Kudosaurus Full Mascot Cameo */}
        <div className="w-32 h-32 mx-auto">
          <img
            src="/kudosaurus-full.png"
            alt="Kudosaurus Mascot"
            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(95,227,161,0.2)]"
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-knock-cream">
            Welcome to Knock, {nickname}!
          </h1>
          <p className="text-xs text-knock-cream/60 leading-relaxed px-4">
            Your student status has been successfully verified via your university email. You're ready to find your roommate in Kraków!
          </p>
        </div>

        <div className="bg-knock-dark/40 border border-knock-cream/5 rounded-2xl p-4 text-[10px] text-knock-cream/40 font-mono tracking-wide leading-relaxed">
          🔒 Image security: Verification successful. Captured ID card photos are deleted from our servers instantly for your privacy.
        </div>

        <Link
          href="/feed"
          className="block w-full py-4 bg-knock-cream hover:bg-white text-knock-dark font-mono font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 hover:shadow-lg active:scale-95"
        >
          Enter Discover Feed 🚪
        </Link>
      </div>

      <div className="mt-8 text-center text-[10px] text-knock-cream/30 font-mono">
        Knock App © 2026. Designed for Kraków Students.
      </div>
    </main>
  );
}
