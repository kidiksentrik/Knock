"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project-id") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  useEffect(() => {
    const checkActiveSession = async () => {
      if (isSupabaseConfigured) {
        try {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Already logged in! Redirect straight to feed or onboarding depending on profile
            const { data: profile } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", session.user.id)
              .single();

            if (profile) {
              window.location.href = "/feed";
              return;
            } else {
              window.location.href = "/onboarding";
              return;
            }
          }
        } catch (err) {
          console.warn("Failed to check active session on landing page:", err);
        }
      }
      setCheckingSession(false);
    };
    checkActiveSession();
  }, [isSupabaseConfigured]);

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      // Offline fallback: go straight to onboarding
      window.location.href = "/onboarding";
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      alert(`Google Login failed: ${err.message || err}`);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) return;

    setIsSubmitting(true);
    setErrorMessage("");

    const ALLOWED_DOMAINS = [
      "student.uj.edu.pl",
      "student.agh.edu.pl",
      "student.uek.krakow.pl",
      "student.pk.edu.pl",
      "student.up.krakow.pl",
      "student.uken.krakow.pl",
      "student.ur.krakow.pl",
      "ur.krakow.pl"
    ];

    const DEVELOPER_TEST_EMAILS = [
      "kidiksentrik@gmail.com" // Bypass allowed for developer testing
    ];

    const emailDomain = targetEmail.split("@")[1];
    const isDeveloperBypass = DEVELOPER_TEST_EMAILS.includes(targetEmail);

    if (!ALLOWED_DOMAINS.includes(emailDomain) && !isDeveloperBypass) {
      setErrorMessage("Only Kraków university student emails are allowed (e.g. @student.uj.edu.pl).");
      setIsSubmitting(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Offline fallback: skip real OTP and go to onboarding
      setTimeout(() => {
        setIsSubmitting(false);
        window.location.href = "/onboarding";
      }, 800);
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      setEmailSent(true);
    } catch (err: any) {
      console.error("Magic link send failed:", err);
      setErrorMessage(err.message || "Failed to send login link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSupabaseConfigured && checkingSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-knock-bg text-knock-cream">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-knock-mint" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 items-center justify-between min-h-screen bg-knock-bg text-knock-cream overflow-hidden px-6 py-12">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full bg-knock-mint/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/3 -right-32 w-80 h-80 rounded-full bg-knock-sage/10 blur-[120px] pointer-events-none" />

      {/* Header / Logo */}
      <header className="relative z-10 w-full max-w-md flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-knock-mint flex items-center justify-center shadow-lg shadow-knock-mint/20">
            <span className="text-knock-dark font-bold text-lg">K</span>
          </div>
          <span className="font-bold tracking-widest text-lg font-mono uppercase">Knock</span>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-knock-card border border-knock-cream/10 text-knock-mint/90 font-mono">
          Kraków MVP
        </span>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full max-w-md flex-1 flex flex-col justify-center my-12">
        <div className="space-y-4 mb-8 animate-fade-in">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-knock-card border border-knock-cream/5 text-[11px] font-medium text-knock-cream/70 tracking-wider uppercase font-mono">
            <span>🎓 Student roommate finder</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-knock-cream leading-[1.15]">
            Find your <span className="text-transparent bg-clip-text bg-gradient-to-r from-knock-mint to-knock-sage">perfect roomie</span> in Kraków
          </h1>
          <p className="text-sm text-knock-cream/60 leading-relaxed max-w-sm font-sans">
            Vibe first. Budget second. Look beyond lists and match by lifestyle, sleep schedule, cleanliness, and smoking preferences.
          </p>
        </div>

        {/* Authentication Options */}
        <div className="space-y-3.5 animate-scale-up">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center space-x-3 bg-knock-cream hover:bg-white text-knock-dark font-semibold py-4 px-6 rounded-2xl transition-all duration-300 shadow-xl shadow-knock-dark/40 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            {/* Google Icon Mock */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.513 0-6.386-2.873-6.386-6.386 0-3.513 2.873-6.386 6.386-6.386 1.636 0 3.09.617 4.2 1.625l3.2-3.2A11.9 11.9 0 0 0 12.24 0c-6.627 0-12 5.373-12 12s5.373 12 12 12c6.262 0 11.536-4.5 11.536-11.536 0-.648-.057-1.332-.196-2.179H12.24Z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            type="button"
            onClick={() => setShowEmailModal(true)}
            className="w-full flex items-center justify-center space-x-2 bg-knock-card hover:bg-knock-card/80 border border-knock-cream/10 text-knock-cream font-medium py-4 px-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <span>Continue with Email</span>
          </button>
        </div>
      </main>

      {/* Email Login Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-knock-dark/80 backdrop-blur-md px-4">
          <div className="w-full max-w-md bg-knock-card border border-knock-cream/10 rounded-3xl p-6.5 shadow-2xl space-y-5 animate-scale-up relative">
            <button
              type="button"
              onClick={() => {
                setShowEmailModal(false);
                setEmailSent(false);
                setErrorMessage("");
                setEmail("");
              }}
              className="absolute top-4 right-4 text-knock-cream/40 hover:text-knock-cream text-sm cursor-pointer"
            >
              ✕
            </button>

            {!emailSent ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-bold text-knock-cream">🔑 Sign In / Sign Up</h3>
                  <p className="text-xs text-knock-cream/60 leading-normal">
                    Enter your university email to log in or create your student profile. We will email you a passwordless login link.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono tracking-wider text-knock-cream/50 uppercase ml-0.5">
                    Student Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@student.uj.edu.pl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-3 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-sans"
                  />
                </div>

                {errorMessage && (
                  <p className="text-[11px] text-rose-400 font-mono text-center leading-normal animate-pulse">
                    ⚠️ {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-knock-mint hover:bg-knock-mint/90 disabled:opacity-50 text-knock-dark font-mono font-bold rounded-xl text-xs tracking-wider uppercase transition-all cursor-pointer hover:shadow-lg hover:shadow-knock-mint/15 active:scale-95"
                >
                  {isSubmitting ? "Sending..." : "Send Login Link ✉️"}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-5 py-4 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-knock-mint/10 border border-knock-mint/30 flex items-center justify-center text-knock-mint text-xl mx-auto animate-bounce">
                  ✉️
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-knock-cream">Login Link Sent!</h3>
                  <p className="text-xs text-knock-cream/60 leading-relaxed px-4">
                    We sent a passwordless login link to <strong className="text-knock-cream font-mono">{email}</strong>. Check your inbox and click the link to log in!
                  </p>
                </div>
                <div className="bg-knock-dark/30 border border-knock-cream/5 rounded-xl p-3 text-[10px] text-knock-cream/40 font-mono">
                  💡 Didn&apos;t receive it? Check your spam folder or try again.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-md text-center py-6 border-t border-knock-cream/5 mt-4">
        <p className="text-[10px] text-knock-cream/30 font-mono">
          Knock App © 2026. Independent MVP Project.
        </p>
      </footer>
    </div>
  );
}
