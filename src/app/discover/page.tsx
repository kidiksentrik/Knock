"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface BlurProfile {
  nickname: string;
  vibePhotoUrl: string;
  matchRate: number;
  university: string;
}

const MOCK_BLUR_PROFILES: BlurProfile[] = [
  { nickname: "Jan", vibePhotoUrl: "/room_cozy.png", matchRate: 94, university: "AGH" },
  { nickname: "Anna", vibePhotoUrl: "/room_minimal.png", matchRate: 91, university: "UJ" },
  { nickname: "Kamil", vibePhotoUrl: "/room_modern.png", matchRate: 88, university: "UEK" }
];

export default function DiscoverLobbyPage() {
  const [totalUsers, setTotalUsers] = useState<number>(5);
  const [realUsersCount, setRealUsersCount] = useState<number>(0);
  const [blurProfiles, setBlurProfiles] = useState<BlurProfile[]>(MOCK_BLUR_PROFILES);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [showToast, setShowToast] = useState(false);

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project-id") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  const supabase = createClient();

  useEffect(() => {
    const fetchLobbyState = async () => {
      let countVal = 5;

      if (isSupabaseConfigured) {
        try {
          const { count, error } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true });
          if (!error && count !== null) {
            countVal = count;
          }
        } catch (e) {
          console.warn("Failed to fetch user count from Supabase profiles:", e);
        }
      }

      setRealUsersCount(isSupabaseConfigured ? countVal : 5);
      setTotalUsers(countVal);

      // Fetch profiles for the blur stacks
      if (isSupabaseConfigured) {
        try {
          const { data: profiles, error } = await supabase
            .from("profiles")
            .select("nickname, vibe_photo_url, university")
            .not("vibe_photo_url", "is", null)
            .limit(3);

          if (!error && profiles && profiles.length > 0) {
            const mapped: BlurProfile[] = profiles.map((p, idx) => ({
              nickname: p.nickname || `Student ${idx + 1}`,
              vibePhotoUrl: p.vibe_photo_url || MOCK_BLUR_PROFILES[idx % 3].vibePhotoUrl,
              matchRate: 90 + Math.floor(Math.random() * 8), // 90%~97%
              university: (p.university || "uj").toUpperCase()
            }));
            setBlurProfiles(mapped);
          }
        } catch (e) {
          console.warn("Failed to load real vibe profiles:", e);
        }
      }

      setLoading(false);
    };

    fetchLobbyState();
  }, [isSupabaseConfigured]);

  // Automatic redirect if Tier 3
  useEffect(() => {
    if (!loading && totalUsers >= 30) {
      triggerToast("Matching Engine Unlocked! Entering feed... 🚀");
      setTimeout(() => {
        window.location.href = "/feed";
      }, 1000);
    }
  }, [totalUsers, loading]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const handleShare = () => {
    const originUrl = window.location.origin;
    navigator.clipboard.writeText(originUrl)
      .then(() => {
        triggerToast("Main link copied! Share with friends to open doors faster! 🚪✨");
      })
      .catch((err) => {
        console.error("Clipboard copy failed: ", err);
        triggerToast("Failed to copy link. Please copy manually!");
      });
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-knock-bg text-knock-cream">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-knock-mint" />
      </div>
    );
  }

  // Percentage calculations
  const progressPercent = Math.min((totalUsers / 30) * 100, 100);

  return (
    <main className="relative flex flex-col flex-1 items-center justify-center min-h-screen bg-knock-bg text-knock-cream overflow-hidden px-4 py-8 md:py-16">
      {/* Background Ambience */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-knock-mint/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] rounded-full bg-knock-sage/5 blur-[80px] pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-knock-card border border-knock-cream/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        
        {/* Tier Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-20 h-20 mx-auto">
            <img
              src="/kudosaurus-full.png"
              alt="Kudosaurus Guide"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-knock-cream">
              {totalUsers < 10 ? "Building Kraków Rooms... 🛠️" : "Unlock Krakow's Vibe Lobby 🔐"}
            </h1>
            <p className="text-xs text-knock-cream/60 leading-relaxed px-2">
              {totalUsers < 10 
                ? "Connecting student spaces. Be the first to build the roommate scene in Kraków."
                : "Real students are matching based on vibe sync, budget compatibility, and clean habits."
              }
            </p>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-[10px] font-mono tracking-wider text-knock-cream/50 px-1">
            <span>Progress to Match Engine</span>
            <span className="text-knock-mint font-semibold">{totalUsers} / 30 Rooms Building</span>
          </div>
          <div className="w-full h-3.5 bg-knock-dark/80 rounded-full overflow-hidden border border-knock-cream/5 p-0.5">
            <div
              style={{ width: `${progressPercent}%` }}
              className="h-full bg-gradient-to-r from-knock-mint to-knock-sage rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(95,227,161,0.3)]"
            />
          </div>
        </div>

        {/* TIER 1: STATISTICS & INSIGHTS (< 10 Users) */}
        {totalUsers < 10 && (
          <div className="space-y-4 animate-scale-up">
            <div className="bg-knock-dark/60 border border-knock-cream/5 rounded-2xl p-4.5 space-y-4">
              <h3 className="text-xs font-mono font-bold tracking-wider text-knock-mint uppercase">
                🎓 Kraków Student Insights
              </h3>

              {/* Stat 1: Sleep Habits */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-knock-cream/80">
                  <span>🦉 Night Owls vs Early Birds</span>
                  <span className="text-knock-sage font-mono">60% Night / 40% Early</span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-knock-dark/50">
                  <div className="h-full bg-knock-mint w-[60%]" title="Night Owls" />
                  <div className="h-full bg-knock-cream/30 w-[40%]" title="Early Birds" />
                </div>
              </div>

              {/* Stat 2: Rent Budget */}
              <div className="flex items-center justify-between border-t border-knock-cream/5 pt-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💰</span>
                  <div className="text-left">
                    <p className="text-[10px] font-mono text-knock-cream/40">AVERAGE MONTHLY RENT</p>
                    <p className="text-xs font-bold text-knock-cream">1,850 PLN / mo</p>
                  </div>
                </div>
                <span className="text-[9px] bg-knock-cream/10 text-knock-cream/70 px-2 py-0.5 rounded-md font-mono">
                  Room Only
                </span>
              </div>

              {/* Stat 3: Smoking Preferences */}
              <div className="flex items-center justify-between border-t border-knock-cream/5 pt-3">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">🚭</span>
                  <div className="text-left">
                    <p className="text-[10px] font-mono text-knock-cream/40">AIR QUALITY SYNC</p>
                    <p className="text-xs font-bold text-knock-cream">88% Non-Smokers</p>
                  </div>
                </div>
                <span className="text-[9px] bg-knock-mint/20 text-knock-mint px-2 py-0.5 rounded-md font-mono font-semibold">
                  Cozy Vibe
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TIER 2: BLURRED STACKS & FOMO (10 <= totalUsers < 30) */}
        {totalUsers >= 10 && totalUsers < 30 && (
          <div className="space-y-4 animate-scale-up relative">
            <h3 className="text-xs font-mono font-bold tracking-wider text-knock-mint uppercase text-center mb-1">
              ✨ Waiting in the lobby...
            </h3>

            {/* Blurred Stack Container */}
            <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-knock-cream/5 bg-knock-dark/40 p-4 flex items-center justify-center">
              
              {/* Stack Cards */}
              <div className="relative w-full h-full flex justify-center items-center">
                {blurProfiles.map((profile, idx) => {
                  // Stack layout transformation
                  const scale = 1 - (blurProfiles.length - 1 - idx) * 0.05;
                  const translateY = (blurProfiles.length - 1 - idx) * -12;
                  const rotate = (idx % 2 === 0 ? 1 : -1) * (blurProfiles.length - 1 - idx) * 2;
                  
                  return (
                    <div
                      key={idx}
                      style={{
                        transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
                        zIndex: idx,
                        filter: "blur(10px)"
                      }}
                      className="absolute w-56 h-44 rounded-2xl overflow-hidden border border-knock-cream/10 bg-knock-card shadow-lg transition-all duration-300"
                    >
                      <img
                        src={profile.vibePhotoUrl}
                        alt="lifestyle vibe preview"
                        className="w-full h-2/3 object-cover opacity-75"
                      />
                      <div className="p-3 space-y-1 bg-knock-card/90">
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span>{profile.nickname} ({profile.university})</span>
                          <span className="text-knock-mint font-mono">{profile.matchRate}% Sync</span>
                        </div>
                        <div className="h-1 bg-knock-cream/10 rounded-full w-4/5" />
                        <div className="h-1 bg-knock-cream/10 rounded-full w-2/3" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Padlock and FOMO Overlay */}
              <div className="absolute inset-0 bg-knock-dark/60 backdrop-blur-[4px] flex flex-col justify-center items-center p-6 text-center z-10">
                <div className="w-11 h-11 bg-knock-mint/15 rounded-full flex items-center justify-center text-knock-mint border border-knock-mint/20 mb-3 shadow-[0_0_15px_rgba(95,227,161,0.15)]">
                  🔒
                </div>
                <h4 className="text-xs font-bold text-knock-cream">Lobby Locked Until 30 Users</h4>
                <p className="text-[10px] text-knock-cream/60 leading-normal max-w-xs mt-1.5">
                  A roommate with <strong className="text-knock-mint">92% lifestyle sync</strong> is waiting for you in Kraków! Invite friends to unlock matching.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TIER 3: MATCH ENGINE REDIRECT (totalUsers >= 30) */}
        {totalUsers >= 30 && (
          <div className="py-6 text-center space-y-4 animate-scale-up">
            <div className="w-14 h-14 bg-knock-mint/20 text-knock-mint border border-knock-mint/30 rounded-full flex items-center justify-center mx-auto text-xl animate-bounce">
              ⚡
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-knock-mint">Matching Engine Activated!</h3>
              <p className="text-xs text-knock-cream/60">
                Lobby threshold reached. Entering the active Discover Feed...
              </p>
            </div>
          </div>
        )}

        {/* Task 4: Invitation Link & Viral loop (Always Visible at bottom) */}
        <div className="mt-8 pt-5 border-t border-knock-cream/10 text-center space-y-4">
          <div className="bg-knock-dark/40 border border-knock-cream/5 rounded-xl p-3 flex items-start space-x-2 text-left">
            <span className="text-sm pt-0.5">⚡</span>
            <p className="text-[10px] text-knock-cream/60 leading-relaxed font-mono">
              We will send a lightning-fast invitation link to your registered email the exact second the doors open.
            </p>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="w-full py-3.5 bg-knock-cream hover:bg-white text-knock-dark font-mono font-bold rounded-2xl text-xs tracking-wider uppercase transition-all duration-200 active:scale-95 cursor-pointer shadow-lg hover:shadow-knock-mint/5"
          >
            Share to open the doors faster! 🚪
          </button>
        </div>

      </div>

      {/* Custom Toast Alert */}
      {showToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-knock-card border border-knock-mint text-knock-cream text-xs font-semibold px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 animate-slide-down max-w-sm text-center">
          <span>🔔</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="mt-8 text-center text-[10px] text-knock-cream/30 font-mono">
        Knock App © 2026. Waiting room count is synced live with Kraków db.
      </div>
    </main>
  );
}
