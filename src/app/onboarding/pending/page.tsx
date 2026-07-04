"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function OnboardingPendingPage() {
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
        
        {/* Waiting Verification Shield Icon */}
        <div className="w-16 h-16 rounded-full bg-knock-cream/5 border border-knock-cream/10 text-knock-cream/60 flex items-center justify-center mx-auto text-2xl animate-pulse">
          ⏳
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold tracking-tight text-knock-cream">
            Verification Pending, {nickname}
          </h1>
          <p className="text-xs text-knock-cream/60 leading-relaxed px-2">
            We are verifying your ID. You can browse roommate profiles right now, but sending a &apos;Knock&apos; will be unlocked once approved!
          </p>
        </div>

        <div className="bg-knock-dark/40 border border-knock-cream/5 rounded-2xl p-4 text-[10px] text-knock-cream/40 font-mono tracking-wide leading-normal text-left space-y-1.5">
          <p>📝 **Status**: Pending Manual Review</p>
          <p>🔒 **Privacy**: ID card documents are processed securely and will be permanently hard-deleted from our storage once approved.</p>
        </div>

        <Link
          href="/feed"
          className="block w-full py-4 bg-knock-cream hover:bg-white text-knock-dark font-mono font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 hover:shadow-lg active:scale-95"
        >
          Browse Roommate Profiles 🚪
        </Link>

        {/* Testing Mock: Admin Bypass Button */}
        <button
          type="button"
          onClick={async () => {
            try {
              const data = localStorage.getItem("knock_user_onboarding");
              if (data) {
                const parsed = JSON.parse(data);
                parsed.is_verified = true;
                localStorage.setItem("knock_user_onboarding", JSON.stringify(parsed));
              }

              const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project-id");
              if (isSupabaseConfigured) {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                  await supabase
                    .from("profiles")
                    .update({ is_verified: true })
                    .eq("id", user.id);
                }
              }

              alert("Testing: Admin approved verification! 🛡️");
              window.location.href = "/onboarding/success";
            } catch (e) {
              console.error(e);
            }
          }}
          className="block w-full text-center py-3 bg-knock-mint/10 border border-dashed border-knock-mint/30 hover:bg-knock-mint/20 text-knock-mint font-mono text-[10px] uppercase rounded-2xl tracking-wider transition-colors cursor-pointer mt-3"
        >
          🧪 [Testing Mock: Approve Verification (Admin)]
        </button>
      </div>

      <div className="mt-8 text-center text-[10px] text-knock-cream/30 font-mono">
        Knock App © 2026. Designed for Kraków Students.
      </div>
    </main>
  );
}
