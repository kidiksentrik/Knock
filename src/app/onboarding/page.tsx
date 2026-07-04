"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { compressImage } from "@/utils/imageCompressor";

const SMOKING_OPTIONS = [
  { id: "non-smoker", label: "Non-smoker", desc: "No smoking of any kind in the flat" },
  { id: "balcony", label: "Balcony Only", desc: "Smoke only outside or on the balcony" },
  { id: "vaping", label: "Vaping / E-cigarettes", desc: "Vape inside is okay, no traditional tobacco" },
  { id: "smoker", label: "Active Smoker", desc: "Smoke traditional cigarettes regularly" },
];

const SLEEP_OPTIONS = [
  { id: "early-bird", label: "Early Bird", desc: "Sleep early, wake up early (e.g. 10 PM - 6 AM)" },
  { id: "night-owl", label: "Night Owl", desc: "Sleep late, wake up late (e.g. 2 AM - 10 AM)" },
  { id: "flexible", label: "Flexible Rhythm", desc: "Varies depending on class schedule or work" },
];

const CLEANLINESS_OPTIONS = [
  { id: "clean-freak", label: "Clean Freak", desc: "Spotless space, everything organized immediately" },
  { id: "weekly", label: "Weekly Balanced", desc: "Clean up once/twice a week, keep it tidy daily" },
  { id: "easygoing", label: "Easygoing / Chill", desc: "Clean when needed, not stressed about minor clutter" },
];

const KRAKOW_UNIVERSITIES = [
  { id: "uj", name: "Jagiellonian University (UJ)" },
  { id: "agh", name: "AGH University of Krakow" },
  { id: "uek", name: "Krakow University of Economics (UEK)" },
  { id: "pk", name: "Tadeusz Kościuszko University of Technology (PK)" },
  { id: "ur", name: "University of Agriculture in Krakow (UR)" },
  { id: "up", name: "Pedagogical University of Krakow (UP)" },
  { id: "other", name: "Other University in Krakow" },
];

// Kudosaurus (90% Chic + 10% Cute Dinosaur Fairy Mascot)
const KudosaurusMascot = () => (
  <div className="w-28 h-28 mx-auto">
    <img
      src="/kudosaurus-full.png"
      alt="Kudosaurus Mascot"
      className="w-full h-full object-contain"
    />
  </div>
);




const INTEREST_TAGS = [
  { id: "cooking", label: "Cooking 🍳" },
  { id: "netflix", label: "Netflix 🎬" },
  { id: "coding", label: "Coding 💻" },
  { id: "foodie", label: "Good Food/Cafes ☕" },
  { id: "boardgames", label: "Boardgames 🎲" },
  { id: "sports", label: "Sports/Gym 🏋️" },
  { id: "music", label: "Music 🎵" },
  { id: "travel", label: "Travel ✈️" },
  { id: "reading", label: "Reading 📚" },
  { id: "gaming", label: "Gaming 🎮" },
  { id: "pets", label: "Pet Friendly 🐾" },
  { id: "art", label: "Art & Design 🎨" }
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [minBudget, setMinBudget] = useState(1200);
  const [maxBudget, setMaxBudget] = useState(2500);
  const [smoking, setSmoking] = useState("");
  const [sleep, setSleep] = useState("");
  const [cleanliness, setCleanliness] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [idealRoommate, setIdealRoommate] = useState("");

  // Modal Flow States
  const [showModal, setShowModal] = useState(false);
  const [modalStage, setModalStage] = useState<"details" | "choice">("details");
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");

  // Supabase User Session state
  const [supabaseUser, setSupabaseUser] = useState<any>(null);
  const [hasOnboardingData, setHasOnboardingData] = useState(false);

  useEffect(() => {
    // 1. Restore previous onboarding data if present
    try {
      const raw = localStorage.getItem("knock_user_onboarding");
      if (raw) {
        setHasOnboardingData(true);
        const parsed = JSON.parse(raw);
        if (parsed.minBudget !== undefined) setMinBudget(parsed.minBudget);
        if (parsed.maxBudget !== undefined) setMaxBudget(parsed.maxBudget);
        if (parsed.smoking !== undefined) setSmoking(parsed.smoking);
        if (parsed.sleep !== undefined) setSleep(parsed.sleep);
        if (parsed.cleanliness !== undefined) setCleanliness(parsed.cleanliness);
        if (parsed.tags !== undefined) setTags(parsed.tags || []);
        if (parsed.idealRoommate !== undefined) setIdealRoommate(parsed.idealRoommate || "");
        if (parsed.nickname !== undefined) setNickname(parsed.nickname || "");
        if (parsed.university !== undefined) setUniversity(parsed.university || "");
      }
    } catch (e) {
      console.error("Failed to restore existing onboarding session details:", e);
    }

    // 2. Check Supabase user session
    const checkUser = async () => {
      const isSupabaseConfigured =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project-id") &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

      if (isSupabaseConfigured) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setSupabaseUser(user);
          }
        } catch (err) {
          console.warn("Supabase user session check failed in onboarding:", err);
        }
      }
    };
    checkUser();
  }, []);

  // Auto handle slide track styles
  const getBudgetPercent = (val: number) => {
    return ((val - 500) / 4500) * 100;
  };

  const handleTagToggle = (tagId: string) => {
    if (tags.includes(tagId)) {
      setTags(tags.filter((t) => t !== tagId));
    } else {
      if (tags.length >= 5) {
        alert("You can select up to 5 interest tags!");
        return;
      }
      setTags([...tags, tagId]);
    }
  };

  const handleNext = () => {
    if (step < 6) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStepValid = () => {
    if (step === 1) return maxBudget >= minBudget;
    if (step === 2) return smoking !== "";
    if (step === 3) return sleep !== "";
    if (step === 4) return cleanliness !== "";
    if (step === 5) return true; // Optional tags, up to 5
    if (step === 6) return true; // Optional description
    return false;
  };

  const handleOpenVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid()) return;
    setShowModal(true);
    setModalStage("details");
  };

  const handleFinishDetails = async () => {
    try {
      const onboardingData = {
        minBudget,
        maxBudget,
        smoking,
        sleep,
        cleanliness,
        nickname,
        university,
        tags,
        idealRoommate,
        is_verified: false,
        verification_method: null
      };
      localStorage.setItem("knock_user_onboarding", JSON.stringify(onboardingData));

      if (supabaseUser) {
        try {
          const supabase = createClient();
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: supabaseUser.id,
            nickname: nickname.trim(),
            university: university || "uj",
            min_budget: minBudget,
            max_budget: maxBudget,
            smoking,
            sleep,
            cleanliness,
            tags,
            ideal_roommate: idealRoommate || null,
            is_verified: false,
            verification_method: null
          });

          if (profileError) {
            console.error("Failed to upsert onboarding profile to database:", profileError);
          }
        } catch (dbErr) {
          console.warn("DB Upsert skipped in onboarding:", dbErr);
        }
      }

      window.location.href = "/feed";
    } catch (err) {
      console.error("Failed to save onboarding details:", err);
    }
  };

  return (
    <main className="relative flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-16 min-h-screen bg-knock-bg text-knock-cream">
      {/* Background Ambience */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-knock-mint/5 blur-[100px] pointer-events-none" />

      {/* Go Back button (visible if user has already onboarded) */}
      {hasOnboardingData && (
        <div className="w-full max-w-md mb-4 flex justify-start px-2">
          <Link
            href="/feed"
            className="text-[11px] font-semibold font-mono text-knock-cream/50 hover:text-knock-mint transition-colors flex items-center space-x-1.5"
          >
            <span>← Go Back to Feed</span>
          </Link>
        </div>
      )}

      {/* Progress Indicators */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between px-2">
        <span className="text-xs font-mono font-semibold tracking-wider text-knock-mint uppercase">
          Step {step} of 6
        </span>
        <div className="flex space-x-1.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? "w-7 bg-knock-mint" : "w-2 bg-knock-cream/20"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Container Card */}
      <div className="w-full max-w-md bg-knock-card border border-knock-cream/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        {/* Step Headings */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-knock-cream">
            {step === 1 && "Select your monthly rent budget"}
            {step === 2 && "Select your smoking preference"}
            {step === 3 && "Select your typical sleep schedule"}
            {step === 4 && "How tidy do you keep your space?"}
            {step === 5 && "Select your interests & vibe tags"}
            {step === 6 && "Describe your ideal roommate"}
          </h1>
          <p className="text-xs text-knock-cream/60 mt-1.5 leading-relaxed">
            {step === 1 && "Based on monthly rent per person in PLN. Average private rooms in Kraków range from 1,200 to 2,800 PLN."}
            {step === 2 && "Matches roommates who align with your air quality and odor comfort levels."}
            {step === 3 && "Matches roommates who share quiet times, work schedules, or active hours."}
            {step === 4 && "Avoid roommate clean-up disputes. Match with someone who cleans like you."}
            {step === 5 && "Choose up to 5 tags (at least 1 recommended) to show off your hobbies, lifestyle, or apartment vibe."}
            {step === 6 && "Write a short note describing the kind of flatmate you'd love to live with."}
          </p>
        </div>

        {/* Input Controls */}
        <form onSubmit={handleOpenVerification}>
          
          {/* STEP 1: BUDGET SLIDERS */}
          {step === 1 && (
            <div className="space-y-6 py-2">
              <div className="space-y-5">
                {/* Min Budget Slider */}
                <div>
                  <div className="flex justify-between text-[11px] text-knock-cream/70 mb-2 font-mono">
                    <span>MIN RENT BUDGET</span>
                    <span className="text-knock-mint font-semibold">{minBudget.toLocaleString()} PLN</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="100"
                      value={minBudget}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMinBudget(val);
                        if (val > maxBudget) setMaxBudget(val);
                      }}
                      style={{
                        background: `linear-gradient(to right, #5FE3A1 ${getBudgetPercent(minBudget)}%, #132F26 ${getBudgetPercent(minBudget)}%)`
                      }}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-knock-mint"
                    />
                  </div>
                </div>

                {/* Max Budget Slider */}
                <div>
                  <div className="flex justify-between text-[11px] text-knock-cream/70 mb-2 font-mono">
                    <span>MAX RENT BUDGET</span>
                    <span className="text-knock-mint font-semibold">{maxBudget.toLocaleString()} PLN</span>
                  </div>
                  <div className="relative">
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="100"
                      value={maxBudget}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setMaxBudget(val);
                        if (val < minBudget) setMinBudget(val);
                      }}
                      style={{
                        background: `linear-gradient(to right, #5FE3A1 ${getBudgetPercent(maxBudget)}%, #132F26 ${getBudgetPercent(maxBudget)}%)`
                      }}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-knock-mint"
                    />
                  </div>
                </div>
              </div>

              {/* Range Badge Display */}
              <div className="bg-knock-dark/60 border border-knock-cream/5 rounded-2xl p-4 flex justify-between items-center text-xs font-mono">
                <span className="text-knock-cream/50">MATCH RANGE</span>
                <span className="text-knock-mint font-bold text-sm">
                  {minBudget.toLocaleString()} ~ {maxBudget.toLocaleString()} PLN / mo
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: SMOKING */}
          {step === 2 && (
            <div className="space-y-2.5 py-1">
              {SMOKING_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => setSmoking(option.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                    smoking === option.id
                      ? "bg-knock-mint/10 border-knock-mint text-knock-cream shadow-[0_0_15px_rgba(95,227,161,0.15)] scale-[1.01]"
                      : "bg-knock-dark/40 border-knock-cream/10 hover:border-knock-cream/30 text-knock-cream/80"
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center justify-between">
                    <span>{option.label}</span>
                    {smoking === option.id && <span className="w-2 h-2 rounded-full bg-knock-mint animate-ping" />}
                  </div>
                  <div className="text-[11px] text-knock-cream/50 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 3: SLEEP PATTERN */}
          {step === 3 && (
            <div className="space-y-2.5 py-1">
              {SLEEP_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => setSleep(option.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                    sleep === option.id
                      ? "bg-knock-mint/10 border-knock-mint text-knock-cream shadow-[0_0_15px_rgba(95,227,161,0.15)] scale-[1.01]"
                      : "bg-knock-dark/40 border-knock-cream/10 hover:border-knock-cream/30 text-knock-cream/80"
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center justify-between">
                    <span>{option.label}</span>
                    {sleep === option.id && <span className="w-2 h-2 rounded-full bg-knock-mint animate-ping" />}
                  </div>
                  <div className="text-[11px] text-knock-cream/50 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 4: CLEANLINESS */}
          {step === 4 && (
            <div className="space-y-2.5 py-1">
              {CLEANLINESS_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => setCleanliness(option.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 ${
                    cleanliness === option.id
                      ? "bg-knock-mint/10 border-knock-mint text-knock-cream shadow-[0_0_15px_rgba(95,227,161,0.15)] scale-[1.01]"
                      : "bg-knock-dark/40 border-knock-cream/10 hover:border-knock-cream/30 text-knock-cream/80"
                  }`}
                >
                  <div className="font-semibold text-sm flex items-center justify-between">
                    <span>{option.label}</span>
                    {cleanliness === option.id && <span className="w-2 h-2 rounded-full bg-knock-mint animate-ping" />}
                  </div>
                  <div className="text-[11px] text-knock-cream/50 mt-1">{option.desc}</div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 5: INTEREST TAGS */}
          {step === 5 && (
            <div className="space-y-4 py-1">
              <div className="flex justify-between text-[11px] font-mono text-knock-cream/50 px-0.5">
                <span>INTERESTS SELECTED</span>
                <span className="text-knock-mint font-bold">{tags.length} / 5</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {INTEREST_TAGS.map((tag) => {
                  const isSelected = tags.includes(tag.id);
                  return (
                    <button
                      type="button"
                      key={tag.id}
                      onClick={() => handleTagToggle(tag.id)}
                      className={`py-3 px-4 rounded-xl border text-xs font-semibold font-mono text-center transition-all duration-200 ${
                        isSelected
                          ? "bg-knock-mint/20 border-knock-mint text-knock-mint shadow-md animate-[scaleUp_0.15s_ease-out]"
                          : "bg-knock-dark/40 border-knock-cream/10 hover:border-knock-cream/20 text-knock-cream/70"
                      }`}
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 6: IDEAL ROOMMATE */}
          {step === 6 && (
            <div className="space-y-3 py-1">
              <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase mb-1 ml-0.5">
                Ideal Roommate Description
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Someone quiet during weekdays, keeps the kitchen clean, and is down for a beer/coffee on weekends..."
                value={idealRoommate}
                onChange={(e) => setIdealRoommate(e.target.value)}
                className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-2xl p-4 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-sans resize-none leading-relaxed"
              />
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-knock-cream/10">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase text-knock-cream/60 hover:text-knock-cream transition-colors duration-200"
              >
                Back
              </button>
            ) : (
              <div /> // Spacer
            )}

            {step < 6 ? (
              <button
                type="button"
                disabled={!isStepValid()}
                onClick={handleNext}
                className={`px-8 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                  isStepValid()
                    ? "bg-knock-cream text-knock-dark hover:bg-knock-mint hover:shadow-lg active:scale-95 cursor-pointer"
                    : "bg-knock-cream/10 text-knock-cream/30 cursor-not-allowed"
                }`}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isStepValid()}
                className={`px-8 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                  isStepValid()
                    ? "bg-knock-mint text-knock-dark hover:bg-knock-mint/90 hover:shadow-lg active:scale-95 cursor-pointer"
                    : "bg-knock-mint/10 text-knock-cream/30 cursor-not-allowed"
                }`}
              >
                Save & Finish
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-[10px] text-knock-cream/30 font-mono">
        Knock App © 2026. Designed for Kraków Students.
      </div>

      {/* STUDENT ID VERIFICATION & KUDOSAURUS MASCOT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-knock-dark/85 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-md bg-knock-card border border-knock-cream/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center">
            {/* Ambient Background Glowing Orb */}
            <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-knock-mint/10 blur-2xl pointer-events-none" />

            {/* STAGE 1: NICKNAME & UNIVERSITY SELECTION */}
            {modalStage === "details" && (
              <div className="space-y-5">
                <div className="w-12 h-12 rounded-full bg-knock-mint/10 text-knock-mint flex items-center justify-center mx-auto text-xl font-bold">
                  🛡️
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-knock-cream">Student Verification</h2>
                  <p className="text-xs text-knock-cream/60 leading-relaxed px-4">
                    Knock is a secure platform restricted to students. Please provide your profile details to unlock verification.
                  </p>
                </div>

                <div className="space-y-3.5 text-left mt-2">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/60 uppercase mb-1.5 ml-1">
                      Nickname / Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Casper"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-knock-mint/50 text-knock-cream placeholder:text-knock-cream/20 font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/60 uppercase mb-1.5 ml-1">
                      Kraków University
                    </label>
                    <select
                      value={university}
                      onChange={(e) => setUniversity(e.target.value)}
                      className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-knock-mint/50 text-knock-cream font-sans appearance-none"
                    >
                      <option value="" disabled>Select your university</option>
                      {KRAKOW_UNIVERSITIES.map((u) => (
                        <option key={u.id} value={u.id} className="bg-knock-dark text-knock-cream">
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!nickname.trim() || !university}
                  onClick={handleFinishDetails}
                  className={`w-full py-4 mt-2 rounded-2xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                    nickname.trim() && university
                      ? "bg-knock-cream text-knock-dark hover:bg-knock-mint hover:shadow-lg"
                      : "bg-knock-cream/10 text-knock-cream/30 cursor-not-allowed"
                  }`}
                >
                  Enter Discover Feed 🚪
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

