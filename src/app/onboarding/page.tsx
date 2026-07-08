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

  // Vibe Photo upload states
  const [vibePhoto, setVibePhoto] = useState<File | null>(null);
  const [vibePhotoUrl, setVibePhotoUrl] = useState<string>("");
  const [isVibeUploading, setIsVibeUploading] = useState(false);

  // Modal Flow States
  const [showModal, setShowModal] = useState(false);
  const [modalStage, setModalStage] = useState<"details" | "choice" | "email" | "upload" | "success">("details");
  const [nickname, setNickname] = useState("");
  const [university, setUniversity] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "compressing" | "uploading" | "success">("idle");
  const [modalError, setModalError] = useState("");

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
        if (parsed.vibePhotoUrl !== undefined) setVibePhotoUrl(parsed.vibePhotoUrl || "");
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

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder-project-id") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id");

  const handleVibePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsVibeUploading(true);
    try {
      // Compress file to 100-200KB range
      const compressedBlob = await compressImage(file, 1024, 1024, 0.75);
      setVibePhoto(file);

      // Offline preview
      const localUrl = URL.createObjectURL(compressedBlob);
      setVibePhotoUrl(localUrl);

      if (isSupabaseConfigured) {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const filePath = `${user.id}/vibe_${Date.now()}.jpg`;
          const { data, error } = await supabase.storage
            .from("vibe-photos")
            .upload(filePath, compressedBlob, {
              contentType: "image/jpeg",
              cacheControl: "3600",
              upsert: true
            });

          if (error) throw error;

          const { data: { publicUrl } } = supabase.storage
            .from("vibe-photos")
            .getPublicUrl(filePath);

          setVibePhotoUrl(publicUrl);
        }
      }
    } catch (err) {
      console.error("Vibe photo upload process failed:", err);
      alert("Failed to process and upload your photo. Please try again.");
    } finally {
      setIsVibeUploading(false);
    }
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
    if (step < 7) setStep(step + 1);
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
    if (step === 7) return vibePhotoUrl !== "" || isVibeUploading; // Check vibe photo uploaded
    return false;
  };

  const handleOpenVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStepValid()) return;
    setShowModal(true);
  };

  const handleEmailVerification = async () => {
    setModalError("");
    setIsSubmittingEmail(true);

    const targetEmail = verificationEmail.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setModalError("Please enter a valid email address.");
      setIsSubmittingEmail(false);
      return;
    }

    if (!isSupabaseConfigured) {
      console.warn("Using offline mock for email verification.");
      setTimeout(() => {
        setIsSubmittingEmail(false);
        setEmailSent(true);
        setModalStage("success");
      }, 1000);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithOtp({
        email: targetEmail,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      if (supabaseUser) {
        await supabase
          .from("profiles")
          .update({
            verification_method: "email",
            is_verified: false
          })
          .eq("id", supabaseUser.id);
      }

      setEmailSent(true);
      setModalStage("success");
    } catch (err: any) {
      console.error("Verification email failed:", err);
      setModalError(err.message || "Failed to send verification link.");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleDocumentUpload = async (file: File) => {
    setModalError("");
    setUploadStatus("compressing");

    if (!isSupabaseConfigured) {
      console.warn("Using offline mock for document upload.");
      setTimeout(() => {
        setUploadStatus("uploading");
        setTimeout(() => {
          setUploadStatus("success");
          setModalStage("success");
        }, 1000);
      }, 800);
      return;
    }

    try {
      const compressedBlob = await compressImage(file, 1024, 1024, 0.75);
      setUploadStatus("uploading");

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user session found");

      const fileName = `doc-${user.id}-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("student-ids")
        .upload(fileName, compressedBlob, {
          contentType: "image/jpeg",
          cacheControl: "3600"
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("profiles")
        .update({
          verification_method: "id_card",
          is_verified: false
        })
        .eq("id", user.id);

      if (dbError) throw dbError;

      setUploadStatus("success");
      setModalStage("success");
    } catch (err: any) {
      console.error("Document upload failed:", err);
      setModalError(err.message || "Failed to upload verification documents.");
      setUploadStatus("idle");
    }
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
        vibePhotoUrl,
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
            vibe_photo_url: vibePhotoUrl || null,
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

      setModalStage("choice");
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
          Step {step} of 7
        </span>
        <div className="flex space-x-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
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
            {step === 7 && "Show Your Vibe ✨"}
          </h1>
          <p className="text-xs text-knock-cream/60 mt-1.5 leading-relaxed">
            {step === 1 && "Based on monthly rent per person in PLN. Average private rooms in Kraków range from 1,200 to 2,800 PLN."}
            {step === 2 && "Matches roommates who align with your air quality and odor comfort levels."}
            {step === 3 && "Matches roommates who share quiet times, work schedules, or active hours."}
            {step === 4 && "Avoid roommate clean-up disputes. Match with someone who cleans like you."}
            {step === 5 && "Choose up to 5 tags (at least 1 recommended) to show off your hobbies, lifestyle, or apartment vibe."}
            {step === 6 && "Write a short note describing the kind of flatmate you'd love to live with."}
            {step === 7 && "No face required! Upload a cozy photo that represents your lifestyle—it could be your favorite corner of your room, a cafe you love, or your workspace. Let others get a glimpse of your style."}
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

          {/* STEP 7: SHOW YOUR VIBE */}
          {step === 7 && (
            <div className="space-y-4 py-1">
              <div
                className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 ${
                  vibePhotoUrl
                    ? "border-knock-mint/50 bg-knock-mint/5"
                    : "border-knock-cream/20 bg-knock-dark/40 hover:border-knock-cream/40"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleVibePhotoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isVibeUploading}
                />
                {isVibeUploading ? (
                  <div className="space-y-3 py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-knock-mint mx-auto" />
                    <p className="text-xs text-knock-cream/60 font-mono">Compressing & uploading lifestyle photo...</p>
                  </div>
                ) : vibePhotoUrl ? (
                  <div className="space-y-4">
                    <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden border border-knock-mint/30 shadow-md">
                      <img
                        src={vibePhotoUrl}
                        alt="Vibe preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-knock-dark/80 via-transparent to-transparent flex items-end justify-center p-2">
                        <span className="text-[10px] text-knock-mint font-mono font-semibold">100~200KB Optimized</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-knock-mint">Looks great! ✨</p>
                      <p className="text-[10px] text-knock-cream/40 mt-1 font-mono">Click or drag another image to replace</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 py-4">
                    <div className="text-3xl">📸</div>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-knock-cream">Drag & drop your lifestyle photo</p>
                      <p className="text-[10px] text-knock-cream/40 font-mono">or click to browse from device</p>
                    </div>
                    <p className="text-[9px] text-knock-cream/30 font-sans max-w-xs mx-auto leading-normal">
                      Cozy corners, workspaces, local cafes, plants, or pets preferred. Max file size: 10MB. We automatically compress it.
                    </p>
                  </div>
                )}
              </div>
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

            {step < 7 ? (
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
                disabled={!isStepValid() || isVibeUploading}
                className={`px-8 py-3 rounded-full text-xs font-semibold tracking-wider uppercase transition-all duration-300 ${
                  isStepValid() && !isVibeUploading
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
                  Continue to Verification 🛡️
                </button>
              </div>
            )}

            {/* STAGE 2: CHOICE (Option A vs Option B) */}
            {modalStage === "choice" && (
              <div className="space-y-5 animate-scale-up">
                <div className="w-12 h-12 rounded-full bg-knock-mint/10 text-knock-mint flex items-center justify-center mx-auto text-xl font-bold">
                  🎓
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-knock-cream">Verify Student Status</h2>
                  <p className="text-xs text-knock-cream/60 leading-relaxed px-4">
                    Choose how you want to verify your student status. We handle incoming/freshmen exceptions.
                  </p>
                </div>

                <div className="space-y-3 mt-4 text-left">
                  {/* Option A */}
                  <button
                    type="button"
                    onClick={() => setModalStage("email")}
                    className="w-full p-4 text-left rounded-2xl border border-knock-cream/10 bg-knock-dark/40 hover:bg-knock-mint/5 hover:border-knock-mint/50 transition-all duration-200"
                  >
                    <div className="font-semibold text-sm text-knock-cream flex items-center space-x-1.5">
                      <span>Option A: University Email</span>
                      <span className="text-[10px] bg-knock-mint/20 text-knock-mint px-2 py-0.5 rounded-full font-mono font-normal">Fastest</span>
                    </div>
                    <p className="text-[11px] text-knock-cream/50 mt-1 leading-normal">
                      Use university email domain. Magic login link will verify you instantly.
                    </p>
                  </button>

                  {/* Option B */}
                  <button
                    type="button"
                    onClick={() => setModalStage("upload")}
                    className="w-full p-4 text-left rounded-2xl border border-knock-cream/10 bg-knock-dark/40 hover:bg-knock-mint/5 hover:border-knock-mint/50 transition-all duration-200"
                  >
                    <div className="font-semibold text-sm text-knock-cream flex items-center space-x-1.5">
                      <span>Option B: Upload Documents</span>
                      <span className="text-[10px] bg-knock-cream/15 text-knock-cream/70 px-2 py-0.5 rounded-full font-mono font-normal">Flexible</span>
                    </div>
                    <p className="text-[11px] text-knock-cream/50 mt-1 leading-normal">
                      Upload Student ID card, or Acceptance Letter if you are a freshman.
                    </p>
                  </button>
                </div>

                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setModalStage("details")}
                    className="text-[11px] text-knock-cream/40 hover:text-knock-cream font-mono underline"
                  >
                    Back to Profile Details
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3A: EMAIL VERIFICATION */}
            {modalStage === "email" && (
              <div className="space-y-4 text-left animate-scale-up">
                <h2 className="text-lg font-bold text-knock-cream text-center">Verify via University Email ✉️</h2>
                <p className="text-xs text-knock-cream/60 text-center leading-normal px-2">
                  Enter your student email. We will send a magic verification link. General email domains are also allowed for testing.
                </p>

                <div className="space-y-1.5 mt-3">
                  <label className="block text-[9px] font-mono tracking-wider text-knock-cream/50 uppercase ml-0.5">
                    Student Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. name@student.uj.edu.pl"
                    value={verificationEmail}
                    onChange={(e) => setVerificationEmail(e.target.value)}
                    className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-3 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-sans"
                  />
                </div>

                {modalError && (
                  <p className="text-[11px] text-rose-400 font-mono text-center leading-normal animate-pulse">
                    ⚠️ {modalError}
                  </p>
                )}

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isSubmittingEmail || !verificationEmail}
                    onClick={handleEmailVerification}
                    className="w-full py-3 bg-knock-mint hover:bg-knock-mint/90 disabled:opacity-50 text-knock-dark font-mono font-bold rounded-xl text-xs tracking-wider uppercase transition-all"
                  >
                    {isSubmittingEmail ? "Sending Link..." : "Send Verification Link ✉️"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalStage("choice")}
                    className="w-full py-3 border border-knock-cream/10 hover:border-knock-cream/20 text-knock-cream/70 font-mono rounded-xl text-xs tracking-wider uppercase transition-all text-center"
                  >
                    Back to Options
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 3B: DOCUMENT UPLOAD */}
            {modalStage === "upload" && (
              <div className="space-y-4 animate-scale-up text-center">
                <h2 className="text-lg font-bold text-knock-cream">Upload Proof of Student Status 📂</h2>
                <p className="text-xs text-knock-cream/60 leading-normal px-2">
                  Please upload your Student ID or University Acceptance Letter (screenshot/PDF).
                </p>

                <div className="relative border-2 border-dashed border-knock-cream/20 rounded-2xl p-6 bg-knock-dark/40 hover:border-knock-cream/35 transition-all">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleDocumentUpload(file);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={uploadStatus !== "idle"}
                  />
                  {uploadStatus === "idle" && (
                    <div className="space-y-2">
                      <div className="text-2xl">📄</div>
                      <p className="text-xs font-semibold text-knock-cream">Drag and drop file here</p>
                      <p className="text-[10px] text-knock-cream/40 font-mono">or click to browse documents</p>
                    </div>
                  )}
                  {uploadStatus === "compressing" && (
                    <div className="space-y-2 py-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-knock-mint mx-auto" />
                      <p className="text-[10px] text-knock-cream/60 font-mono">Compressing file to 100~200KB...</p>
                    </div>
                  )}
                  {uploadStatus === "uploading" && (
                    <div className="space-y-2 py-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-knock-mint mx-auto" />
                      <p className="text-[10px] text-knock-cream/60 font-mono">Uploading document securely...</p>
                    </div>
                  )}
                  {uploadStatus === "success" && (
                    <div className="space-y-2 py-2">
                      <div className="text-knock-mint text-xl font-bold">✓</div>
                      <p className="text-xs text-knock-mint font-semibold">Uploaded Successfully!</p>
                    </div>
                  )}
                </div>

                {modalError && (
                  <p className="text-[11px] text-rose-400 font-mono text-center leading-normal">
                    ⚠️ {modalError}
                  </p>
                )}

                <div className="bg-knock-dark/30 border border-knock-cream/5 rounded-xl p-3 text-[10px] text-knock-cream/40 font-mono text-left leading-normal">
                  🔒 {`Your document is used strictly for verification and will be completely hard-deleted immediately after approval (GDPR Compliant).`}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setModalStage("choice")}
                    className="w-full py-3 border border-knock-cream/10 hover:border-knock-cream/20 text-knock-cream/70 font-mono rounded-xl text-xs tracking-wider uppercase transition-all"
                  >
                    Back to Options
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 4: SUCCESS */}
            {modalStage === "success" && (
              <div className="space-y-5 animate-scale-up">
                <KudosaurusMascot />
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-knock-mint">Verification Submitted!</h2>
                  <p className="text-xs text-knock-cream/70 leading-relaxed px-4">
                    {emailSent
                      ? "Check your email for the magic link! Once clicked, your profile will be fully unlocked."
                      : "We have received your document. Our team will review and verify your profile within 24 hours!"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    window.location.href = "/discover";
                  }}
                  className="w-full py-4 mt-2 bg-knock-mint hover:bg-knock-mint/90 text-knock-dark font-mono font-bold rounded-2xl text-xs tracking-wider uppercase transition-all hover:shadow-lg hover:shadow-knock-mint/15"
                >
                  Enter Discover Lobby 🚪
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
