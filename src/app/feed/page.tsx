"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { compressImage } from "@/utils/imageCompressor";

interface OnboardingData {
  minBudget: number;
  maxBudget: number;
  smoking: string;
  sleep: string;
  cleanliness: string;
  nickname: string;
  university: string;
  bio?: string;
  age?: number;
  gender?: string;
  nickname_updated_at?: number;
  tags?: string[];
  idealRoommate?: string;
  is_verified?: boolean;
  verification_method?: string;
  vibePhotoUrl?: string;
}

interface Candidate {
  id: string;
  name: string;
  age: number;
  gender: string;
  university: string;
  bio: string;
  photoUrl: string;
  minBudget: number;
  maxBudget: number;
  smoking: string;
  sleep: string;
  cleanliness: string;
  tags?: string[];
  idealRoommate?: string;
}

const KRAKOW_UNIVERSITIES = [
  { id: "uj", name: "Jagiellonian University (UJ)" },
  { id: "agh", name: "AGH University of Krakow" },
  { id: "uek", name: "Krakow University of Economics (UEK)" },
  { id: "pk", name: "Tadeusz Kościuszko University of Technology (PK)" },
  { id: "ur", name: "University of Agriculture in Krakow (UR)" },
  { id: "up", name: "Pedagogical University of Krakow (UP)" },
  { id: "other", name: "Other University in Krakow" },
];

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

const MOCK_CANDIDATES: Candidate[] = [
  {
    id: "cand-kudo",
    name: "Kudosaurus (Guide)",
    age: 1,
    gender: "Mascot",
    university: "Knock Kraków Guide",
    bio: "Hi! I am Kudosaurus, your friendly Kraków neighborhood guide. Knock on my door to get instant tips on finding flats ('flats'), universities ('student'), or safety ('security') in Kraków! 🦖✨",
    photoUrl: "/kudosaurus-full.png",
    minBudget: 500,
    maxBudget: 5000,
    smoking: "non-smoker",
    sleep: "flexible",
    cleanliness: "clean-freak",
    tags: ["coding", "foodie", "travel"],
    idealRoommate: "Anyone who wants to learn about flat hunting in Kraków!"
  },
  {
    id: "cand-1",
    name: "Mateusz",
    age: 21,
    gender: "Male",
    university: "AGH University of Krakow",
    bio: "Computer Science student. I love brewing drip coffee, coding late at night, and hiking on weekends. Looking for a neat, quiet flatmate to share an apartment near Krowodrza.",
    photoUrl: "/room_cozy.png",
    minBudget: 1300,
    maxBudget: 2200,
    smoking: "non-smoker",
    sleep: "night-owl",
    cleanliness: "weekly",
    tags: ["coding", "sports", "gaming"],
    idealRoommate: "A clean, quiet roommate who studies late and respects privacy."
  },
  {
    id: "cand-2",
    name: "Zofia",
    age: 22,
    gender: "Female",
    university: "Jagiellonian University (UJ)",
    bio: "Medical student. Pretty busy with classes. I value absolute quiet hours after 11 PM for studies and keep the common areas spotless. Let's grab coffee first!",
    photoUrl: "/room_minimal.png",
    minBudget: 1500,
    maxBudget: 2800,
    smoking: "balcony",
    sleep: "early-bird",
    cleanliness: "clean-freak",
    tags: ["reading", "cooking", "netflix"],
    idealRoommate: "A quiet study-partner who is clean-freak and sleeps early."
  },
  {
    id: "cand-3",
    name: "Karol",
    age: 20,
    gender: "Male",
    university: "Krakow University of Economics (UEK)",
    bio: "Business major. Outgoing, likes cooking shared meals. Relaxed about daily chores but always tidy up weekly. Vapes occasionally but never smoke inside.",
    photoUrl: "/room_modern.png",
    minBudget: 1000,
    maxBudget: 1800,
    smoking: "vaping",
    sleep: "flexible",
    cleanliness: "easygoing",
    tags: ["cooking", "boardgames", "music"],
    idealRoommate: "Someone social who enjoys cooking together and sharing occasional drinks!"
  }
];

// Helper to format options nicely in the UI
const getLabel = (type: string, val: string) => {
  if (type === "smoking") {
    if (val === "non-smoker") return "Non-smoker";
    if (val === "balcony") return "Balcony Only";
    if (val === "vaping") return "Vaping";
    if (val === "smoker") return "Smoker";
  }
  if (type === "sleep") {
    if (val === "early-bird") return "Early Bird";
    if (val === "night-owl") return "Night Owl";
    if (val === "flexible") return "Flexible";
  }
  if (type === "cleanliness") {
    if (val === "clean-freak") return "Clean Freak";
    if (val === "weekly") return "Weekly Clean";
    if (val === "easygoing") return "Easygoing";
  }
  return val;
};

const getUniversityName = (code: string) => {
  const found = KRAKOW_UNIVERSITIES.find(u => u.id === code);
  return found ? found.name : code;
};

const getBudgetPercent = (val: number) => {
  return ((val - 500) / 4500) * 100;
};

export default function FeedPage() {
  const [userData, setUserData] = useState<OnboardingData | null>(null);
  const [knockStatus, setKnockStatus] = useState<"idle" | "knocking" | "sent">("idle");
  const [actionLocked, setActionLocked] = useState(false);

  // Tabs states
  const [currentTab, setCurrentTab] = useState<"discover" | "hallway" | "chats" | "profile">("discover");
  const [hallwaySubTab, setHallwaySubTab] = useState<"matches" | "incoming" | "sent">("matches");

  // Interaction collections
  const [sentKnocks, setSentKnocks] = useState<string[]>([]);
  const [incomingKnocks, setIncomingKnocks] = useState<Candidate[]>([]);
  const [passedKnocks, setPassedKnocks] = useState<string[]>([]);
  const [matches, setMatches] = useState<Candidate[]>([]);
  
  // Chats simulation states
  const [chats, setChats] = useState<Record<string, Array<{sender: "user" | "candidate"; text: string; timestamp: number}>>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [notifyEnabled, setNotifyEnabled] = useState(true);
  const [toast, setToast] = useState<{ title: string; message: string; show: boolean; icon: string }>({
    title: "",
    message: "",
    show: false,
    icon: "🚪"
  });
  const [typingCandidateId, setTypingCandidateId] = useState<string | null>(null);

  // Profile Form States
  const [editNickname, setEditNickname] = useState("");
  const [editUniversity, setEditUniversity] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAge, setEditAge] = useState<number>(20);
  const [editGender, setEditGender] = useState("Male");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editIdealRoommate, setEditIdealRoommate] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [dbCandidates, setDbCandidates] = useState<Candidate[]>([]);
  
  const [editMinBudget, setEditMinBudget] = useState(1200);
  const [editMaxBudget, setEditMaxBudget] = useState(2500);
  const [editSmoking, setEditSmoking] = useState("");
  const [editSleep, setEditSleep] = useState("");
  const [editCleanliness, setEditCleanliness] = useState("");

  // Supabase Browser Client
  const supabase = createClient();

  // Verification Modal States
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "compressing" | "uploading" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);

  const isSupabaseConfigured = 
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your-project-id") &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your-supabase-anon-key");

  // State Synchronizers with LocalStorage
  const updateSentKnocks = (newSent: string[]) => {
    setSentKnocks(newSent);
    localStorage.setItem("knock_sent", JSON.stringify(newSent));
  };

  const updateIncomingKnocks = (newIncoming: Candidate[]) => {
    setIncomingKnocks(newIncoming);
    localStorage.setItem("knock_incoming", JSON.stringify(newIncoming));
  };

  const updatePassedKnocks = (newPassed: string[]) => {
    setPassedKnocks(newPassed);
    localStorage.setItem("knock_passed", JSON.stringify(newPassed));
  };

  const updateMatches = (newMatches: Candidate[]) => {
    setMatches(newMatches);
    localStorage.setItem("knock_matches", JSON.stringify(newMatches));
  };

  const updateChats = (newChats: Record<string, Array<{sender: "user" | "candidate"; text: string; timestamp: number}>>) => {
    setChats(newChats);
    localStorage.setItem("knock_chats", JSON.stringify(newChats));
  };

  const toggleNotify = () => {
    const next = !notifyEnabled;
    setNotifyEnabled(next);
    localStorage.setItem("knock_notify_enabled", String(next));
  };

  const loadGuestFallback = () => {
    try {
      const rawUser = localStorage.getItem("knock_user_onboarding");
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        setUserData(parsed);
        setEditNickname(parsed.nickname || "");
        setEditUniversity(parsed.university || "uj");
        setEditBio(parsed.bio || "");
        setEditAge(parsed.age || 20);
        setEditGender(parsed.gender || "Male");
        setEditTags(parsed.tags || []);
        setEditIdealRoommate(parsed.idealRoommate || "");
        setEditMinBudget(parsed.minBudget || 1200);
        setEditMaxBudget(parsed.maxBudget || 2500);
        setEditSmoking(parsed.smoking || "non-smoker");
        setEditSleep(parsed.sleep || "night-owl");
        setEditCleanliness(parsed.cleanliness || "weekly");
      } else {
        const fallback: OnboardingData = {
          minBudget: 1100,
          maxBudget: 2200,
          smoking: "balcony",
          sleep: "night-owl",
          cleanliness: "weekly",
          nickname: "Guest Casper",
          university: "uj",
          tags: [],
          idealRoommate: "",
          is_verified: false,
          vibePhotoUrl: ""
        };
        setUserData(fallback);
        setEditNickname(fallback.nickname);
        setEditUniversity(fallback.university);
        setEditTags(fallback.tags || []);
        setEditIdealRoommate(fallback.idealRoommate || "");
        setEditMinBudget(fallback.minBudget);
        setEditMaxBudget(fallback.maxBudget);
        setEditSmoking(fallback.smoking);
        setEditSleep(fallback.sleep);
        setEditCleanliness(fallback.cleanliness);
      }

      const localSent = localStorage.getItem("knock_sent");
      if (localSent) setSentKnocks(JSON.parse(localSent));

      const localPassed = localStorage.getItem("knock_passed");
      if (localPassed) setPassedKnocks(JSON.parse(localPassed));

      const localIncoming = localStorage.getItem("knock_incoming");
      if (localIncoming) {
        setIncomingKnocks(JSON.parse(localIncoming));
      } else {
        const zofia = MOCK_CANDIDATES.find((c) => c.id === "cand-2");
        if (zofia) {
          setIncomingKnocks([zofia]);
          localStorage.setItem("knock_incoming", JSON.stringify([zofia]));
        }
      }

      const localMatches = localStorage.getItem("knock_matches");
      if (localMatches) setMatches(JSON.parse(localMatches));

      const localChats = localStorage.getItem("knock_chats");
      if (localChats) setChats(JSON.parse(localChats));

      const localNotify = localStorage.getItem("knock_notify_enabled");
      if (localNotify !== null) setNotifyEnabled(localNotify === "true");

    } catch (err) {
      console.error("Failed to load local storage guest lists:", err);
    }
  };

  // Load state on mount
  useEffect(() => {
    // Redirection check: if total users < 30, direct to lobby
    const checkUserLimit = async () => {
      let countVal = 35; // default bypass for offline/unconfigured
      const debugCount = localStorage.getItem("knock_debug_total_users");
      if (debugCount !== null) {
        countVal = Number(debugCount);
      } else if (isSupabaseConfigured) {
        try {
          const { count, error } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true });
          if (!error && count !== null) {
            countVal = count;
          }
        } catch (e) {
          console.warn("Failed to check user limit for feed redirect:", e);
        }
      }

      if (countVal < 30) {
        window.location.href = "/discover";
      }
    };
    checkUserLimit();

    if (!isSupabaseConfigured) {
      loadGuestFallback();
      return;
    }

    // Supabase Online Mode
    let messageChannel: any = null;

    const initSupabaseSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          loadGuestFallback();
          return;
        }
        setUserId(user.id);

        // 1. Fetch user profile
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error || !profile) {
          window.location.href = "/onboarding";
          return;
        }

        // Load DB profile to states
        setUserData({
          minBudget: profile.min_budget,
          maxBudget: profile.max_budget,
          smoking: profile.smoking,
          sleep: profile.sleep,
          cleanliness: profile.cleanliness,
          nickname: profile.nickname,
          university: profile.university,
          bio: profile.bio || "",
          age: profile.age || 20,
          gender: profile.gender || "Male",
          tags: profile.tags || [],
          idealRoommate: profile.ideal_roommate || "",
          nickname_updated_at: profile.nickname_updated_at ? new Date(profile.nickname_updated_at).getTime() : undefined,
          is_verified: profile.is_verified,
          verification_method: profile.verification_method,
          vibePhotoUrl: profile.vibe_photo_url || ""
        });

        setEditNickname(profile.nickname);
        setEditUniversity(profile.university);
        setEditBio(profile.bio || "");
        setEditAge(profile.age || 20);
        setEditGender(profile.gender || "Male");
        setEditTags(profile.tags || []);
        setEditIdealRoommate(profile.ideal_roommate || "");
        setEditMinBudget(profile.min_budget);
        setEditMaxBudget(profile.max_budget);
        setEditSmoking(profile.smoking);
        setEditSleep(profile.sleep);
        setEditCleanliness(profile.cleanliness);

        // 2. Fetch Sent Swipes
        const { data: sentData } = await supabase
          .from("knocks")
          .select("receiver_id")
          .eq("sender_id", user.id);
        if (sentData) setSentKnocks(sentData.map((k) => k.receiver_id));

        // 3. Fetch Passed Swipes
        const { data: passedData } = await supabase
          .from("knocks")
          .select("receiver_id")
          .eq("sender_id", user.id)
          .eq("status", "passed");
        if (passedData) setPassedKnocks(passedData.map((k) => k.receiver_id));

        // 4. Fetch Mutual Matches
        const { data: mutualKnocks } = await supabase
          .from("knocks")
          .select("*")
          .eq("status", "mutual")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

        const matchedIds = mutualKnocks
          ? mutualKnocks.map((k) => (k.sender_id === user.id ? k.receiver_id : k.sender_id))
          : [];

        if (matchedIds.length > 0) {
          const { data: matchedProfiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", matchedIds);

          if (matchedProfiles) {
            setMatches(
              matchedProfiles.map((p) => ({
                id: p.id,
                name: p.nickname,
                age: p.age || 20,
                gender: p.gender || "Male",
                university: p.university,
                bio: p.bio || "",
                photoUrl: p.vibe_photo_url || "/room_cozy.png",
                minBudget: p.min_budget,
                maxBudget: p.max_budget,
                smoking: p.smoking,
                sleep: p.sleep,
                cleanliness: p.cleanliness,
                tags: p.tags || [],
                idealRoommate: p.ideal_roommate || ""
              }))
            );
          }
        }

        // 5. Fetch Incoming Knocks
        const { data: incomingData } = await supabase
          .from("knocks")
          .select("sender_id")
          .eq("receiver_id", user.id)
          .eq("status", "sent");

        const incomingIds = incomingData ? incomingData.map((k) => k.sender_id) : [];
        if (incomingIds.length > 0) {
          const { data: incomingProfiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", incomingIds);

          if (incomingProfiles) {
            setIncomingKnocks(
              incomingProfiles.map((p) => ({
                id: p.id,
                name: p.nickname,
                age: p.age || 20,
                gender: p.gender || "Male",
                university: p.university,
                bio: p.bio || "",
                photoUrl: p.vibe_photo_url || "/room_cozy.png",
                minBudget: p.min_budget,
                maxBudget: p.max_budget,
                smoking: p.smoking,
                sleep: p.sleep,
                cleanliness: p.cleanliness,
                tags: p.tags || [],
                idealRoommate: p.ideal_roommate || ""
              }))
            );
          }
        }

        // 6. Fetch Chat Messages history
        const { data: messagesList } = await supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order("created_at", { ascending: true });

        const chatGroup: Record<string, any[]> = {};
        if (messagesList) {
          messagesList.forEach((msg) => {
            const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
            if (!chatGroup[partnerId]) chatGroup[partnerId] = [];
            chatGroup[partnerId].push({
              sender: msg.sender_id === user.id ? "user" : "candidate",
              text: msg.text,
              timestamp: new Date(msg.created_at).getTime()
            });
          });
        }
        setChats(chatGroup);

        // 7. Subscribe to Realtime messages WebSocket
        messageChannel = supabase
          .channel("room-messages")
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "messages" },
            (payload) => {
              const newMsg = payload.new;
              if (newMsg.sender_id === user.id || newMsg.receiver_id === user.id) {
                const partnerId = newMsg.sender_id === user.id ? newMsg.receiver_id : newMsg.sender_id;
                setChats((prev) => {
                  const history = prev[partnerId] || [];
                  if (history.some((m) => m.timestamp === new Date(newMsg.created_at).getTime() && m.text === newMsg.text)) {
                    return prev;
                  }
                  return {
                    ...prev,
                    [partnerId]: [
                      ...history,
                      {
                        sender: newMsg.sender_id === user.id ? "user" : "candidate",
                        text: newMsg.text,
                        timestamp: new Date(newMsg.created_at).getTime()
                      }
                    ]
                  };
                });
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error("Supabase load session failed:", err);
      }
    };

    initSupabaseSession();

    return () => {
      if (messageChannel) {
        supabase.removeChannel(messageChannel);
      }
    };
  }, []);

  // Fetch real database roommate candidates (when userData or userId changes)
  useEffect(() => {
    if (!isSupabaseConfigured || !userData || !userId) return;

    const fetchDBCandidates = async () => {
      try {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("*")
          .neq("id", userId)
          .eq("is_verified", true);

        if (error) throw error;

        if (profiles) {
          setDbCandidates(
            profiles.map((p) => ({
              id: p.id,
              name: p.nickname,
              age: p.age || 20,
              gender: p.gender || "Male",
              university: p.university,
              bio: p.bio || "",
              photoUrl: p.vibe_photo_url || "/room_cozy.png",
              minBudget: p.min_budget,
              maxBudget: p.max_budget,
              smoking: p.smoking,
              sleep: p.sleep,
              cleanliness: p.cleanliness,
              tags: p.tags || [],
              idealRoommate: p.ideal_roommate || ""
            }))
          );
        }
      } catch (err) {
        console.error("Failed to fetch database roommate candidates:", err);
      }
    };

    fetchDBCandidates();
  }, [userData, userId]);

  const handleEmailVerification = async () => {
    setErrorMessage("");
    setIsSubmittingEmail(true);

    const targetEmail = email.trim().toLowerCase();
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
      setIsSubmittingEmail(false);
      return;
    }

    if (!isSupabaseConfigured) {
      console.warn("Using fallback mock for email signup.");
      const updatedData = {
        ...userData!,
        verification_method: "email",
        is_verified: true
      };
      setUserData(updatedData);
      localStorage.setItem("knock_user_onboarding", JSON.stringify(updatedData));
      
      setTimeout(() => {
        setEmailSent(true);
        setIsSubmittingEmail(false);
      }, 800);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nickname: userData?.nickname,
            university: userData?.university,
            minBudget: userData?.minBudget,
            maxBudget: userData?.maxBudget,
            smoking: userData?.smoking,
            sleep: userData?.sleep,
            cleanliness: userData?.cleanliness
          }
        }
      });

      if (error) throw error;
      setEmailSent(true);
    } catch (err: any) {
      console.error("Verification Magic Link failed:", err);
      setErrorMessage(err.message || "Failed to send verification link.");
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    setErrorMessage("");
    setUploadStatus("compressing");

    if (!isSupabaseConfigured) {
      console.warn("Using fallback mock for image upload.");
      setTimeout(() => {
        setUploadStatus("uploading");
        setTimeout(() => {
          const updatedData = {
            ...userData!,
            verification_method: "id_card",
            is_verified: false
          };
          setUserData(updatedData);
          localStorage.setItem("knock_user_onboarding", JSON.stringify(updatedData));
          
          setUploadStatus("success");
          setTimeout(() => {
            setShowVerificationModal(false);
            window.location.href = "/onboarding/pending";
          }, 800);
        }, 1000);
      }, 800);
      return;
    }

    try {
      const compressedBlob = await compressImage(file, 1024, 1024, 0.75);
      setUploadStatus("uploading");
      
      const fileName = `id-card-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("student-ids")
        .upload(fileName, compressedBlob, {
          contentType: "image/jpeg",
          cacheControl: "3600"
        });

      if (uploadError) throw uploadError;

      const updatedData = {
        ...userData!,
        verification_method: "id_card",
        is_verified: false
      };
      setUserData(updatedData);
      localStorage.setItem("knock_user_onboarding", JSON.stringify(updatedData));

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("profiles").upsert({
            id: user.id,
            nickname: userData?.nickname,
            university: userData?.university,
            min_budget: userData?.minBudget,
            max_budget: userData?.maxBudget,
            smoking: userData?.smoking,
            sleep: userData?.sleep,
            cleanliness: userData?.cleanliness,
            tags: userData?.tags || [],
            ideal_roommate: userData?.idealRoommate || null,
            vibe_photo_url: userData?.vibePhotoUrl || null,
            is_verified: false,
            verification_method: "id_card"
          });
        }
      } catch (dbErr) {
        console.warn("Profiles DB write skipped.", dbErr);
      }

      setUploadStatus("success");
      setTimeout(() => {
        setShowVerificationModal(false);
        window.location.href = "/onboarding/pending";
      }, 800);
    } catch (err: any) {
      console.error("Upload failed:", err);
      setErrorMessage(err.message || "Failed to upload ID card photo.");
      setUploadStatus("idle");
    }
  };

  // Dynamic Matching Score Engine
  const calculateMatchScore = (cand: Candidate) => {
    if (!userData) return 0;
    let score = 0;

    // 1. Budget Compatibility (max 25%)
    const userAvg = (userData.minBudget + userData.maxBudget) / 2;
    const candAvg = (cand.minBudget + cand.maxBudget) / 2;
    const budgetDiff = Math.abs(userAvg - candAvg);
    if (budgetDiff < 400) score += 25;
    else if (budgetDiff < 800) score += 18;
    else if (budgetDiff < 1200) score += 10;
    else score += 5;

    // 2. Smoking Compatibility (max 25%)
    if (userData.smoking === cand.smoking) {
      score += 25;
    } else {
      if (userData.smoking === "non-smoker" && cand.smoking === "smoker") score += 5;
      else if (userData.smoking === "smoker" && cand.smoking === "non-smoker") score += 5;
      else if (userData.smoking === "non-smoker" && (cand.smoking === "balcony" || cand.smoking === "vaping")) score += 15;
      else score += 20;
    }

    // 3. Sleep Rhythm Compatibility (max 25%)
    if (userData.sleep === cand.sleep) {
      score += 25;
    } else {
      if (userData.sleep === "early-bird" && cand.sleep === "night-owl") score += 5;
      else if (userData.sleep === "night-owl" && cand.sleep === "early-bird") score += 5;
      else if (userData.sleep === "flexible" || cand.sleep === "flexible") score += 18;
      else score += 12;
    }

    // 4. Cleanliness Compatibility (max 25%)
    if (userData.cleanliness === cand.cleanliness) {
      score += 25;
    } else {
      if (userData.cleanliness === "clean-freak" && cand.cleanliness === "easygoing") score += 5;
      else if (userData.cleanliness === "easygoing" && cand.cleanliness === "clean-freak") score += 5;
      else if (userData.cleanliness === "weekly" || cand.cleanliness === "weekly") score += 18;
      else score += 12;
    }

    return score;
  };

  // Match Trigger Logic
  const triggerMatch = (candidate: Candidate) => {
    // Save to match lists
    const currentMatches = JSON.parse(localStorage.getItem("knock_matches") || "[]");
    if (!currentMatches.some((c: Candidate) => c.id === candidate.id)) {
      const nextMatches = [...matches.filter(m => m.id !== candidate.id), candidate];
      updateMatches(nextMatches);
    }

    // Remove from sent
    const currentSent = JSON.parse(localStorage.getItem("knock_sent") || "[]");
    updateSentKnocks(currentSent.filter((id: string) => id !== candidate.id));

    // Remove from incoming
    const currentIncoming = JSON.parse(localStorage.getItem("knock_incoming") || "[]");
    updateIncomingKnocks(currentIncoming.filter((c: Candidate) => c.id !== candidate.id));

    // Initialize chat session
    const currentChats = JSON.parse(localStorage.getItem("knock_chats") || "{}");
    if (!currentChats[candidate.id]) {
      const greeting = candidate.id === "cand-kudo"
        ? "Roar! 🦖 Welcome Kraków student! I'm Kudosaurus. I'm here to help. Ask me about Kraków 'flats', 'universities', or flat 'safety'!"
        : `Hey! Thanks for the Knock 🚪. It's a match! Let's find out if we make good flatmates.`;
        
      currentChats[candidate.id] = [
        {
          sender: "candidate",
          text: greeting,
          timestamp: Date.now()
        }
      ];
      updateChats(currentChats);
    }

    // Show simulated Match Toast
    const notifySetting = localStorage.getItem("knock_notify_enabled") !== "false";
    if (notifySetting) {
      setToast({
        show: true,
        title: "New Match on Knock! 🚪",
        message: `Matched with ${candidate.name}! Open Chats to talk.`,
        icon: "🚪"
      });
      setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 4000);
    }
  };

  // Knock Event
  const handleKnock = async () => {
    if (actionLocked || !currentCandidate) return;

    // Verify student status
    if (!userData?.is_verified && !userData?.verification_method) {
      setShowVerificationModal(true);
      return;
    }

    // Check review lock
    if (userData?.is_verified === false && userData?.verification_method === "id_card") {
      alert("Verification Pending: Your Student ID card photo is currently under manual review. Sending a 'Knock' will be unlocked once approved!");
      return;
    }

    setActionLocked(true);
    setKnockStatus("knocking");

    const candidate = currentCandidate;
    const isMutual = incomingKnocks.some((c) => c.id === candidate.id);

    if (isSupabaseConfigured && userId) {
      try {
        if (isMutual) {
          // Update candidate's sent knock to mutual status
          await supabase
            .from("knocks")
            .update({ status: "mutual" })
            .eq("sender_id", candidate.id)
            .eq("receiver_id", userId);
        } else {
          // Insert a new knock row
          await supabase
            .from("knocks")
            .insert({
              sender_id: userId,
              receiver_id: candidate.id,
              status: "sent"
            });
        }
      } catch (err) {
        console.error("Failed to save knock swipe in database:", err);
      }
    }

    setTimeout(() => {
      setKnockStatus("sent");
      
      setTimeout(() => {
        setKnockStatus("idle");
        setActionLocked(false);

        // Remove from feed
        if (isMutual) {
          triggerMatch(candidate);
        } else {
          // Normal knock tracking
          if (!sentKnocks.includes(candidate.id)) {
            const nextSent = [...sentKnocks, candidate.id];
            updateSentKnocks(nextSent);
          }

          // Kudosaurus Bot matches in 1 second
          if (candidate.id === "cand-kudo") {
            setTimeout(() => {
              triggerMatch(candidate);
            }, 1000);
          } else if (!isSupabaseConfigured) {
            // Simulated Match after 5 seconds (only when offline)
            setTimeout(() => {
              const freshSent = JSON.parse(localStorage.getItem("knock_sent") || "[]");
              if (freshSent.includes(candidate.id)) {
                triggerMatch(candidate);
              }
            }, 5000);
          }
        }
      }, 1200);
    }, 1000);
  };

  // Pass Event
  const handlePass = async () => {
    if (actionLocked || !currentCandidate) return;
    setActionLocked(true);
    
    const candidate = currentCandidate;

    if (isSupabaseConfigured && userId) {
      try {
        await supabase
          .from("knocks")
          .insert({
            sender_id: userId,
            receiver_id: candidate.id,
            status: "passed"
          });
      } catch (err) {
        console.error("Failed to save pass swipe in database:", err);
      }
    }

    setTimeout(() => {
      updatePassedKnocks([...passedKnocks, candidate.id]);
      setActionLocked(false);
    }, 300);
  };

  // Hallway Handlers
  const handleKnockBack = (cand: Candidate) => {
    triggerMatch(cand);
  };

  const handleDeclineIncoming = (cand: Candidate) => {
    const nextIncoming = incomingKnocks.filter(c => c.id !== cand.id);
    updateIncomingKnocks(nextIncoming);
  };

  // Chat Submissions & Simulated Answers
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatId) return;

    const textMsg = chatInput.trim();
    setChatInput("");

    if (isSupabaseConfigured && userId) {
      try {
        // Insert user message in database
        await supabase
          .from("messages")
          .insert({
            sender_id: userId,
            receiver_id: activeChatId,
            text: textMsg
          });
      } catch (err) {
        console.error("Failed to send message to database:", err);
      }
    } else {
      // Local storage offline logic
      const currentMessages = chats[activeChatId] || [];
      const newUserMsg = {
        sender: "user" as const,
        text: textMsg,
        timestamp: Date.now()
      };
      const nextChats = {
        ...chats,
        [activeChatId]: [...currentMessages, newUserMsg]
      };
      updateChats(nextChats);
    }

    // Trigger typing state for bots (Kudosaurus & mockup accounts)
    const isMockBot = activeChatId.startsWith("cand-");
    if (isMockBot) {
      setTypingCandidateId(activeChatId);

      const delay = activeChatId === "cand-kudo" ? 1200 : 2000;
      setTimeout(async () => {
        setTypingCandidateId(null);
        
        let reply = "";
        const lower = textMsg.toLowerCase();

        if (activeChatId === "cand-kudo") {
          if (lower.includes("flat") || lower.includes("rent") || lower.includes("방") || lower.includes("월세")) {
            reply = "Finding a flat in Kraków can be competitive! Area tips: Krowodrza is great for AGH, Stare Miasto/Kazimierz is lively but expensive, and Ruczaj is close to UJ campus. Try OLX, Otodom, or student Facebook groups! 🦖";
          } else if (lower.includes("university") || lower.includes("student") || lower.includes("학교") || lower.includes("대학")) {
            reply = "Kraków has amazing student vibes! UJ, AGH, UEK, PK, and UR students all mingle. Remember to check if your flat has a good tram connection (like the fast tram lines 50 or 52) to your campus! 🚋";
          } else if (lower.includes("security") || lower.includes("safety") || lower.includes("보안") || lower.includes("안전")) {
            reply = "Your safety is our top priority! Knock verifies all profiles. Never pay a deposit before seeing a flat in person or signing a lease. Keep your ID photos private! 🛡️";
          } else if (lower.includes("hi") || lower.includes("hello") || lower.includes("안녕")) {
            reply = "Hi there! I am Kudosaurus. I'm here to help you navigate roommates and flats in Kraków. Ask me about 'flats', 'universities', or 'safety'! 🦕";
          } else {
            reply = "Roar! That sounds interesting. Did you know that average private rooms in Kraków range from 1,200 to 2,800 PLN? Let me know if you want tips on 'flats' or 'safety'! 🦖";
          }
        } else if (activeChatId === "cand-1") { // Mateusz
          if (lower.includes("hi") || lower.includes("hello") || lower.includes("안녕")) {
            reply = "Hey! Thanks for the knock. I'm coding right now but down to chat. Are you studying CS as well, or something else?";
          } else if (lower.includes("coffee") || lower.includes("커피")) {
            reply = "Ah, coffee! I brew my own V60 drip coffee every morning. Essential for late-night debugging. What's your go-to caffeine source?";
          } else if (lower.includes("flat") || lower.includes("room") || lower.includes("방")) {
            reply = "I'm looking for a place around Krowodrza because it's super close to AGH. Have you started looking for flats yet?";
          } else {
            reply = "Haha nice! I value a chill atmosphere. I usually code till late but I'm quiet. Does that match your schedule?";
          }
        } else if (activeChatId === "cand-2") { // Zofia
          if (lower.includes("hi") || lower.includes("hello") || lower.includes("안녕")) {
            reply = "Hello! Nice to match with you. I'm usually in class or studying at the library, but I'll reply when I can! What university are you at?";
          } else if (lower.includes("flat") || lower.includes("room") || lower.includes("방")) {
            reply = "I have class early most days, so I'm looking for a quiet place where we can study and sleep peacefully. What's your sleep schedule like?";
          } else {
            reply = "That sounds good! Since medical school is quite intense, I just hope we can keep the kitchen/bathroom clean and have quiet hours after 11 PM. Let's meet up for coffee to chat details?";
          }
        } else if (activeChatId === "cand-3") { // Karol
          if (lower.includes("hi") || lower.includes("hello") || lower.includes("안녕")) {
            reply = "Hey! What's up? Thanks for matching. I'm just hanging out. Do you like cooking or eating out in Kraków?";
          } else if (lower.includes("cook") || lower.includes("food") || lower.includes("요리") || lower.includes("음식")) {
            reply = "I love making pasta and sharing meals! It's much cheaper and more fun. Let know if you're down to share a kitchen!";
          } else {
            reply = "Cool! I'm pretty easygoing about daily chores as long as we tidy up weekly. Would love to grab a beer or coffee in Kazimierz to see if the vibe fits!";
          }
        } else {
          reply = "Hey! That sounds cool. Let's grab coffee or beer in Kraków sometime soon to chat roommate details! ☕🍻";
        }

        if (isSupabaseConfigured && userId) {
          try {
            // Write bot response to database
            await supabase
              .from("messages")
              .insert({
                sender_id: activeChatId,
                receiver_id: userId,
                text: reply
              });
          } catch (err) {
            console.error("Failed to write bot message to database:", err);
          }
        } else {
          // Offline local state append
          const updatedMessages = JSON.parse(localStorage.getItem("knock_chats") || "{}")[activeChatId] || [];
          const newCandMsg = {
            sender: "candidate" as const,
            text: reply,
            timestamp: Date.now()
          };
          const latestChats = {
            ...JSON.parse(localStorage.getItem("knock_chats") || "{}"),
            [activeChatId]: [...updatedMessages, newCandMsg]
          };
          updateChats(latestChats);
        }
      }, delay);
    }
  };

  // Nickname cooldown helper (30 days)
  const getNicknameCooldownDays = () => {
    if (!userData || !userData.nickname_updated_at) return 0;
    const elapsed = Date.now() - userData.nickname_updated_at;
    const cooldownMs = 30 * 24 * 60 * 60 * 1000;
    if (elapsed < cooldownMs) {
      return Math.ceil((cooldownMs - elapsed) / (24 * 60 * 60 * 1000));
    }
    return 0;
  };

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    // Check if nickname changed and validate cooldown
    const nicknameChanged = editNickname.trim() !== userData.nickname;
    if (nicknameChanged) {
      const cooldownDaysLeft = getNicknameCooldownDays();
      if (cooldownDaysLeft > 0) {
        alert(`You can only change your nickname once every 30 days! ${cooldownDaysLeft} days remaining.`);
        return;
      }
    }

    // Enforce university locks
    const isUnivLocked = !!(userData.is_verified || userData.verification_method);
    const targetUniv = isUnivLocked ? userData.university : editUniversity;

    if (isSupabaseConfigured && userId) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({
            nickname: editNickname.trim(),
            university: targetUniv,
            bio: editBio,
            age: Number(editAge) || 20,
            gender: editGender,
            tags: editTags,
            ideal_roommate: editIdealRoommate,
            min_budget: editMinBudget,
            max_budget: editMaxBudget,
            smoking: editSmoking,
            sleep: editSleep,
            cleanliness: editCleanliness,
            nickname_updated_at: nicknameChanged ? new Date().toISOString() : (userData.nickname_updated_at ? new Date(userData.nickname_updated_at).toISOString() : undefined)
          })
          .eq("id", userId);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to save profile in database:", err);
      }
    }

    const updatedData = {
      ...userData,
      nickname: editNickname.trim(),
      university: targetUniv,
      bio: editBio,
      age: Number(editAge) || 20,
      gender: editGender,
      tags: editTags,
      idealRoommate: editIdealRoommate,
      minBudget: editMinBudget,
      maxBudget: editMaxBudget,
      smoking: editSmoking,
      sleep: editSleep,
      cleanliness: editCleanliness,
      // Update nickname cooldown timestamp if changed
      nickname_updated_at: nicknameChanged ? Date.now() : (userData.nickname_updated_at || undefined)
    };

    setUserData(updatedData);
    localStorage.setItem("knock_user_onboarding", JSON.stringify(updatedData));

    // Show visual confirmation toast
    setToast({
      show: true,
      title: "Settings Saved 💾",
      message: "Profile saved successfully! 💾",
      icon: "💾"
    });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  // Logout Flow
  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out? This will reset all your mock swipes and profile data.")) {
      localStorage.removeItem("knock_user_onboarding");
      localStorage.removeItem("knock_sent");
      localStorage.removeItem("knock_passed");
      localStorage.removeItem("knock_incoming");
      localStorage.removeItem("knock_matches");
      localStorage.removeItem("knock_chats");
      localStorage.removeItem("knock_notify_enabled");

      if (isSupabaseConfigured) {
        try {
          await supabase.auth.signOut();
        } catch (err) {
          console.error("Supabase signOut error:", err);
        }
      }
      window.location.href = "/";
    }
  };

  // Empty State Resets
  const handleResetSwipes = () => {
    updateSentKnocks([]);
    updatePassedKnocks([]);
    updateMatches([]);
    updateIncomingKnocks([MOCK_CANDIDATES[2]]); // Seed Zofia again
    updateChats({});
    setToast({ 
      show: true, 
      title: "Swipes Reset 🔄",
      message: "Swipes and matches have been reset! 🔄",
      icon: "🔄"
    });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
  };

  // Share profile Mock
  const handleShareProfile = () => {
    if (!userData) return;
    const url = `${window.location.origin}/user/${userData.nickname || "casper"}`;
    navigator.clipboard.writeText(url).then(() => {
      setToast({ 
        show: true, 
        title: "Link Copied 🔗",
        message: "Profile link copied to clipboard! 🔗",
        icon: "🔗"
      });
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
    }).catch(() => {
      alert(`Here is your custom profile link: ${url}`);
    });
  };

  // Available candidate pool (excluding swiped, passed, and matched candidates)
  const candidatePool = isSupabaseConfigured ? dbCandidates : MOCK_CANDIDATES;
  const availableCandidates = candidatePool.filter((cand) => {
    if (matches.some((m) => m.id === cand.id)) return false;
    if (sentKnocks.includes(cand.id)) return false;
    if (passedKnocks.includes(cand.id)) return false;
    return true;
  });

  const currentCandidate = availableCandidates[0];
  const isPoolExhausted = availableCandidates.length === 0;
  const matchScore = currentCandidate ? calculateMatchScore(currentCandidate) : 0;

  if (!userData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-knock-bg text-knock-cream py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-knock-mint" />
      </div>
    );
  }

  const cooldownDaysLeft = getNicknameCooldownDays();
  const isUniversityLocked = !!(userData.is_verified || userData.verification_method);

  return (
    <div className="flex flex-col min-h-screen bg-knock-bg text-knock-cream animate-fade-in">
      
      {/* Dynamic Push Toast Notification Overlay */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-slide-down">
          <div className="bg-knock-card/95 backdrop-blur-md border border-knock-mint/30 rounded-2xl p-4 shadow-2xl flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-knock-mint flex items-center justify-center text-lg shadow-lg shadow-knock-mint/20 flex-shrink-0">
              {toast.icon || "🚪"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-knock-mint">{toast.title || "Notification"}</p>
              <p className="text-[11px] text-knock-cream/80 truncate">{toast.message}</p>
            </div>
            <button 
              onClick={() => setToast({ ...toast, show: false })}
              className="text-knock-cream/40 hover:text-knock-cream text-xs flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Premium Minimal Header */}
      <header className="sticky top-0 z-30 w-full bg-knock-bg/85 backdrop-blur-md border-b border-knock-cream/10 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-knock-mint flex items-center justify-center shadow-lg shadow-knock-mint/20">
              <span className="text-knock-dark font-bold text-lg">K</span>
            </div>
            <span className="font-bold tracking-widest text-base font-mono uppercase">Knock</span>
          </div>

          <div 
            onClick={() => {
              setCurrentTab("profile");
              setActiveChatId(null);
            }}
            className="flex items-center space-x-3 text-right cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div>
              <p className="text-xs font-semibold text-knock-cream">{userData.nickname || "Casper"}</p>
              <p className="text-[10px] font-mono text-knock-mint uppercase">
                {userData.university ? `${userData.university.toUpperCase()} Verified` : "Student"}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-knock-card border border-knock-mint/30 flex items-center justify-center font-bold text-sm text-knock-mint">
              {(userData.nickname || "C")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <div className="max-w-md mx-auto mt-4 flex items-center justify-between border-t border-knock-cream/5 pt-3">
          <div className="flex-1 flex space-x-1.5">
            <button 
              onClick={() => {
                setCurrentTab("discover");
                setActiveChatId(null);
              }}
              className={`flex-1 text-center pb-1.5 text-[11px] font-semibold font-mono tracking-wide transition-all ${
                currentTab === "discover"
                  ? "text-knock-mint border-b border-knock-mint"
                  : "text-knock-cream/40 hover:text-knock-cream/70"
              }`}
            >
              DISCOVER
            </button>
            <button 
              onClick={() => {
                setCurrentTab("hallway");
                setActiveChatId(null);
              }}
              className={`flex-1 text-center pb-1.5 text-[11px] font-semibold font-mono tracking-wide transition-all ${
                currentTab === "hallway"
                  ? "text-knock-mint border-b border-knock-mint"
                  : "text-knock-cream/40 hover:text-knock-cream/70"
              }`}
            >
              HALLWAY
            </button>
            <button 
              onClick={() => {
                setCurrentTab("chats");
              }}
              className={`flex-1 text-center pb-1.5 text-[11px] font-semibold font-mono tracking-wide transition-all ${
                currentTab === "chats"
                  ? "text-knock-mint border-b border-knock-mint"
                  : "text-knock-cream/40 hover:text-knock-cream/70"
              }`}
            >
              CHATS
            </button>
            <button 
              onClick={() => {
                setCurrentTab("profile");
                setActiveChatId(null);
              }}
              className={`flex-1 text-center pb-1.5 text-[11px] font-semibold font-mono tracking-wide transition-all ${
                currentTab === "profile"
                  ? "text-knock-mint border-b border-knock-mint"
                  : "text-knock-cream/40 hover:text-knock-cream/70"
              }`}
            >
              PROFILE
            </button>
          </div>
          
          <button
            onClick={toggleNotify}
            className={`p-2 rounded-xl transition-all duration-200 ml-3 flex items-center justify-center flex-shrink-0 ${
              notifyEnabled 
                ? "text-knock-mint bg-knock-mint/10 border border-knock-mint/20 hover:bg-knock-mint/20" 
                : "text-knock-cream/30 bg-knock-card border border-knock-cream/10 hover:bg-knock-card/80"
            }`}
            title={notifyEnabled ? "Mute Match Simulations (Alerts On)" : "Unmute Match Simulations (Alerts Off)"}
          >
            {notifyEnabled ? "🔔" : "🔕"}
          </button>
        </div>
      </header>

      {/* Verification Warning Banner for Unverified Users */}
      {currentTab !== "profile" && !userData.is_verified && !userData.verification_method && (
        <div className="bg-knock-mint/10 border-b border-knock-mint/20 px-6 py-2.5 text-center text-[10px] text-knock-cream/80 font-mono tracking-wide animate-fade-in">
          💡 Verify student status to unlock sending &apos;Knock&apos; to {currentCandidate?.name || "potential roommates"}!{" "}
          <button
            onClick={() => setShowVerificationModal(true)}
            className="text-knock-mint underline font-bold uppercase tracking-wider ml-1 cursor-pointer hover:text-white transition-colors"
          >
            Verify Now
          </button>
        </div>
      )}

      {/* Pending Manual Verification Warning Banner */}
      {currentTab !== "profile" && userData.is_verified === false && userData.verification_method === "id_card" && (
        <div className="bg-knock-mint/10 border-b border-knock-mint/20 px-6 py-2.5 text-center text-[10px] text-knock-mint font-mono tracking-wide animate-pulse">
          ⏳ Student ID verification is pending manual review. Browsing is unlocked, but sending knocks is locked.
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col justify-center">

        {/* 1. DISCOVER TAB */}
        {currentTab === "discover" && (
          <>
            {!isPoolExhausted ? (
              <div className="space-y-5 animate-scale-up">
                {/* Candidate Card */}
                <div className="bg-knock-card border border-knock-cream/10 rounded-3xl overflow-hidden shadow-2xl relative">
                  
                  {/* Room Image with overlay matching score */}
                  <div className="relative aspect-[4/3] w-full bg-knock-dark overflow-hidden">
                    <img
                      src={currentCandidate.photoUrl}
                      alt={`${currentCandidate.name}'s flat`}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-knock-dark/80 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Dynamic Matching score badge */}
                    <div className="absolute top-4 right-4 bg-knock-dark/80 backdrop-blur-md border border-knock-mint/30 px-3 py-1.5 rounded-2xl flex items-center space-x-1.5 shadow-[0_0_15px_rgba(95,227,161,0.15)] animate-pulse">
                      <span className="text-[10px] font-mono text-knock-cream/70">SYNC</span>
                      <span className="text-xs font-bold font-mono text-knock-mint">{matchScore}% Match</span>
                    </div>
                  </div>

                  {/* Bio & Details */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-baseline space-x-2">
                        <h2 className="text-xl font-bold text-knock-cream">{currentCandidate.name}</h2>
                        <span className="text-xs text-knock-cream/60 font-mono">{currentCandidate.age}, {currentCandidate.gender}</span>
                      </div>
                      <p className="text-[11px] font-mono text-knock-mint">{currentCandidate.university}</p>
                    </div>

                    <p className="text-xs text-knock-cream/70 leading-relaxed font-sans">
                      {currentCandidate.bio}
                    </p>

                    {/* Interest Tags */}
                    {currentCandidate.tags && currentCandidate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {currentCandidate.tags.map((tagId) => {
                          const found = INTEREST_TAGS.find((t) => t.id === tagId);
                          const label = found ? found.label : tagId;
                          return (
                            <span 
                              key={tagId} 
                              className="text-[9px] font-semibold font-mono bg-knock-mint/10 text-knock-mint px-2.5 py-1 rounded-lg border border-knock-mint/20 tracking-wide"
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Ideal Roommate Description */}
                    {currentCandidate.idealRoommate && (
                      <div className="bg-knock-dark/30 border border-knock-cream/5 rounded-2xl p-3.5 space-y-1">
                        <h4 className="text-[8px] font-mono text-knock-cream/40 uppercase tracking-wider">🎯 Ideal Roommate</h4>
                        <p className="text-[11px] text-knock-cream/80 italic font-sans leading-relaxed">
                          &ldquo;{currentCandidate.idealRoommate}&rdquo;
                        </p>
                      </div>
                    )}

                    {/* Big 4 Lifestyle Comparison Grid (2x2 Table) */}
                    <div className="border-t border-knock-cream/10 pt-4 space-y-3">
                      <h3 className="text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase">
                        Lifestyle Match Grid (Big 4)
                      </h3>

                      <div className="grid grid-cols-2 gap-3.5">
                        {/* Grid Cell 1: Budget */}
                        <div className="bg-knock-dark/40 border border-knock-cream/5 p-3 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-knock-cream/40 uppercase">Budget</span>
                            {Math.abs(((userData.minBudget + userData.maxBudget)/2) - ((currentCandidate.minBudget + currentCandidate.maxBudget)/2)) < 500 ? (
                              <span className="text-[10px]">🟢</span>
                            ) : (
                              <span className="text-[10px]">⚪</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-knock-cream font-mono">
                            {currentCandidate.minBudget}~{currentCandidate.maxBudget} PLN
                          </p>
                          <p className="text-[9px] text-knock-cream/50 font-mono">
                            You: {userData.minBudget}~{userData.maxBudget} PLN
                          </p>
                        </div>

                        {/* Grid Cell 2: Smoking */}
                        <div className="bg-knock-dark/40 border border-knock-cream/5 p-3 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-knock-cream/40 uppercase">Smoking</span>
                            {userData.smoking === currentCandidate.smoking ? (
                              <span className="text-[10px]">🟢</span>
                            ) : (
                              <span className="text-[10px]">⚪</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-knock-cream font-mono truncate">
                            {getLabel("smoking", currentCandidate.smoking)}
                          </p>
                          <p className="text-[9px] text-knock-cream/50 font-mono truncate">
                            You: {getLabel("smoking", userData.smoking)}
                          </p>
                        </div>

                        {/* Grid Cell 3: Sleep */}
                        <div className="bg-knock-dark/40 border border-knock-cream/5 p-3 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-knock-cream/40 uppercase">Sleep Rhythm</span>
                            {userData.sleep === currentCandidate.sleep ? (
                              <span className="text-[10px]">🟢</span>
                            ) : (
                              <span className="text-[10px]">⚪</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-knock-cream font-mono truncate">
                            {getLabel("sleep", currentCandidate.sleep)}
                          </p>
                          <p className="text-[9px] text-knock-cream/50 font-mono truncate">
                            You: {getLabel("sleep", userData.sleep)}
                          </p>
                        </div>

                        {/* Grid Cell 4: Cleanliness */}
                        <div className="bg-knock-dark/40 border border-knock-cream/5 p-3 rounded-2xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-knock-cream/40 uppercase">Cleanliness</span>
                            {userData.cleanliness === currentCandidate.cleanliness ? (
                              <span className="text-[10px]">🟢</span>
                            ) : (
                              <span className="text-[10px]">⚪</span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-knock-cream font-mono truncate">
                            {getLabel("cleanliness", currentCandidate.cleanliness)}
                          </p>
                          <p className="text-[9px] text-knock-cream/50 font-mono truncate">
                            You: {getLabel("cleanliness", userData.cleanliness)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Pass and Knock */}
                <div className="flex items-center space-x-3.5 px-1">
                  <button
                    type="button"
                    onClick={handlePass}
                    disabled={actionLocked}
                    className="w-16 h-16 rounded-2xl bg-knock-card border border-knock-cream/10 text-knock-cream/60 hover:text-knock-cream hover:border-knock-cream/30 flex items-center justify-center text-lg active:scale-95 transition-all duration-200 disabled:opacity-40"
                  >
                    ✕
                  </button>

                  {userData.is_verified === false && userData.verification_method === "id_card" ? (
                    <button
                      type="button"
                      onClick={() => alert("Verification Pending: Your Student ID card photo is currently under manual review. Sending a 'Knock' will be unlocked once approved!")}
                      className="flex-1 py-5 rounded-2xl text-xs font-bold font-mono tracking-wider uppercase bg-knock-cream/10 text-knock-cream/40 border border-knock-cream/5 cursor-not-allowed"
                    >
                      Pending Verification 🔒
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleKnock}
                      disabled={actionLocked}
                      className={`flex-1 py-5 rounded-2xl text-xs font-bold font-mono tracking-wider uppercase transition-all duration-300 ${
                        knockStatus === "sent"
                          ? "bg-knock-mint text-knock-dark shadow-[0_0_20px_rgba(95,227,161,0.2)]"
                          : knockStatus === "knocking"
                          ? "bg-knock-mint/70 text-knock-dark cursor-wait"
                          : "bg-knock-cream hover:bg-white text-knock-dark hover:shadow-lg active:scale-98"
                      }`}
                    >
                      {knockStatus === "idle" && "Knock 🚪"}
                      {knockStatus === "knocking" && "Knocking..."}
                      {knockStatus === "sent" && "Sent! 🚪"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* EMPTY STATE - KUDOSAURUS MASCOT CAMEO */
              <div className="text-center py-8 space-y-6 animate-scale-up">
                <div className="relative w-28 h-28 mx-auto">
                  <img
                    src="/kudosaurus-full.png"
                    alt="Kudosaurus Mascot"
                    className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(95,227,161,0.2)]"
                  />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-knock-cream">
                    All doors are knocked on!
                  </h2>
                  <p className="text-xs text-knock-cream/60 leading-relaxed max-w-xs mx-auto">
                    Kudosaurus has checked every roommate candidate in Kraków. Reset swipes to search again, or share your profile to invite others!
                  </p>
                </div>

                <div className="pt-4 space-y-3 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentTab("profile");
                      setActiveChatId(null);
                    }}
                    className="block w-full py-4 bg-knock-card hover:bg-knock-card/85 border border-knock-cream/10 text-knock-cream font-mono font-semibold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer"
                  >
                    Adjust Match Settings ⚙️
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSwipes}
                    className="block w-full py-4 bg-knock-card hover:bg-knock-card/85 border border-knock-cream/10 text-knock-cream font-mono font-semibold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300"
                  >
                    Reset Swipes & Chats 🔄
                  </button>
                  <button
                    type="button"
                    onClick={handleShareProfile}
                    className="block w-full py-4 bg-knock-cream hover:bg-white text-knock-dark font-mono font-semibold rounded-2xl text-xs tracking-wider uppercase transition-all duration-300"
                  >
                    Share My Profile Link 🔗
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* 2. THE HALLWAY TAB */}
        {currentTab === "hallway" && (
          <div className="space-y-4 animate-scale-up">
            
            {/* Sub-navigation tabs */}
            <div className="flex bg-knock-dark/60 p-1 rounded-xl border border-knock-cream/10">
              <button
                onClick={() => setHallwaySubTab("matches")}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg font-mono tracking-wide transition-all ${
                  hallwaySubTab === "matches"
                    ? "bg-knock-card text-knock-mint shadow-md"
                    : "text-knock-cream/50 hover:text-knock-cream/80"
                }`}
              >
                Matches ({matches.length})
              </button>
              <button
                onClick={() => setHallwaySubTab("incoming")}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg font-mono tracking-wide transition-all ${
                  hallwaySubTab === "incoming"
                    ? "bg-knock-card text-knock-mint shadow-md"
                    : "text-knock-cream/50 hover:text-knock-cream/80"
                }`}
              >
                Incoming ({incomingKnocks.length})
              </button>
              <button
                onClick={() => setHallwaySubTab("sent")}
                className={`flex-1 py-2 text-center text-xs font-semibold rounded-lg font-mono tracking-wide transition-all ${
                  hallwaySubTab === "sent"
                    ? "bg-knock-card text-knock-mint shadow-md"
                    : "text-knock-cream/50 hover:text-knock-cream/80"
                }`}
              >
                Sent ({sentKnocks.length})
              </button>
            </div>

            {/* Sub-tab Views */}
            {hallwaySubTab === "matches" && (
              <div className="space-y-3">
                {matches.length === 0 ? (
                  <div className="text-center py-16 bg-knock-card/40 border border-knock-cream/5 rounded-3xl space-y-3">
                    <span className="text-3xl">🤝</span>
                    <p className="text-xs text-knock-cream/50 font-mono">No mutual matches yet. Keep knocking!</p>
                  </div>
                ) : (
                  matches.map(cand => (
                    <div 
                      key={cand.id}
                      onClick={() => {
                        setActiveChatId(cand.id);
                        setCurrentTab("chats");
                      }}
                      className="bg-knock-card border border-knock-cream/10 rounded-2xl p-4 flex items-center justify-between hover:border-knock-mint/40 hover:scale-[1.01] transition-all cursor-pointer shadow-lg"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-knock-dark border border-knock-mint/20">
                          <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-knock-cream">{cand.name}</h4>
                          <p className="text-[10px] text-knock-mint font-mono">{cand.university}</p>
                        </div>
                      </div>
                      <span className="text-xs text-knock-mint font-mono flex items-center space-x-1.5 bg-knock-mint/5 border border-knock-mint/10 px-3 py-1.5 rounded-xl">
                        <span>Chat</span>
                        <span>💬</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {hallwaySubTab === "incoming" && (
              <div className="space-y-3">
                {incomingKnocks.length === 0 ? (
                  <div className="text-center py-16 bg-knock-card/40 border border-knock-cream/5 rounded-3xl space-y-3">
                    <span className="text-3xl">🔔</span>
                    <p className="text-xs text-knock-cream/50 font-mono">No pending knocks from other students.</p>
                  </div>
                ) : (
                  incomingKnocks.map(cand => (
                    <div 
                      key={cand.id}
                      className="bg-knock-card border border-knock-cream/10 rounded-2xl p-4 flex flex-col space-y-3.5 shadow-lg"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-knock-dark border border-knock-mint/20">
                          <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-baseline space-x-2">
                            <h4 className="text-sm font-bold text-knock-cream">{cand.name}</h4>
                            <span className="text-[10px] text-knock-cream/50 font-mono">{cand.age}, {cand.gender}</span>
                          </div>
                          <p className="text-[10px] text-knock-mint font-mono">{cand.university}</p>
                        </div>
                      </div>
                      <p className="text-xs text-knock-cream/70 italic">&ldquo;{cand.bio}&rdquo;</p>
                      
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => handleDeclineIncoming(cand)}
                          className="flex-1 py-2 rounded-xl bg-knock-dark text-knock-cream/50 hover:text-knock-cream hover:bg-knock-dark/80 text-[11px] font-semibold font-mono border border-knock-cream/5 uppercase transition-colors"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleKnockBack(cand)}
                          className="flex-1 py-2 rounded-xl bg-knock-mint text-knock-dark hover:bg-knock-mint/90 text-[11px] font-bold font-mono uppercase shadow-lg shadow-knock-mint/10 transition-colors"
                        >
                          Knock Back 🚪
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {hallwaySubTab === "sent" && (
              <div className="space-y-3">
                {sentKnocks.length === 0 ? (
                  <div className="text-center py-16 bg-knock-card/40 border border-knock-cream/5 rounded-3xl space-y-3">
                    <span className="text-3xl">⏳</span>
                    <p className="text-xs text-knock-cream/50 font-mono">No sent knocks yet.</p>
                  </div>
                ) : (
                  sentKnocks.map(id => {
                    const cand = MOCK_CANDIDATES.find(c => c.id === id);
                    if (!cand) return null;
                    return (
                      <div 
                        key={cand.id}
                        className="bg-knock-card border border-knock-cream/10 rounded-2xl p-4 flex items-center justify-between shadow-lg"
                      >
                        <div className="flex items-center space-x-3.5">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-knock-dark border border-knock-cream/10">
                            <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-knock-cream">{cand.name}</h4>
                            <p className="text-[10px] text-knock-cream/50 font-mono">{cand.university}</p>
                          </div>
                        </div>
                        <span className="text-[10px] text-knock-mint font-mono bg-knock-mint/10 border border-knock-mint/20 px-3 py-1 rounded-full animate-pulse">
                          Waiting... ⏳
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. CHATS TAB */}
        {currentTab === "chats" && (
          <div className="space-y-4 animate-scale-up flex flex-col flex-1">
            {!activeChatId ? (
              // Chat Threads list
              <div className="space-y-3">
                {matches.length === 0 ? (
                  <div className="text-center py-16 bg-knock-card/40 border border-knock-cream/5 rounded-3xl space-y-3">
                    <span className="text-3xl">💬</span>
                    <p className="text-xs text-knock-cream/50 font-mono">No conversations yet. Knock on matches in the Hallway!</p>
                  </div>
                ) : (
                  matches.map(cand => {
                    const history = chats[cand.id] || [];
                    const lastMsg = history[history.length - 1];
                    return (
                      <div
                        key={cand.id}
                        onClick={() => setActiveChatId(cand.id)}
                        className="bg-knock-card border border-knock-cream/10 rounded-2xl p-4 flex items-center justify-between hover:border-knock-mint/40 hover:scale-[1.01] transition-all cursor-pointer shadow-lg"
                      >
                        <div className="flex items-center space-x-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-knock-dark border border-knock-mint/20 flex-shrink-0">
                            <img src={cand.photoUrl} alt={cand.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-baseline">
                              <h4 className="text-sm font-bold text-knock-cream">{cand.name}</h4>
                              {lastMsg && (
                                <span className="text-[9px] text-knock-cream/30 font-mono">
                                  {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-knock-cream/55 truncate pr-4 mt-0.5">
                              {typingCandidateId === cand.id ? (
                                <span className="text-knock-mint animate-pulse font-mono text-[10px]">Typing...</span>
                              ) : lastMsg ? (
                                lastMsg.text
                              ) : (
                                "No messages yet."
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              // Chat Room View
              (() => {
                const activeCand = MOCK_CANDIDATES.find(c => c.id === activeChatId) || matches.find(c => c.id === activeChatId);
                if (!activeCand) return null;
                const messages = chats[activeChatId] || [];

                return (
                  <div className="flex flex-col flex-1 bg-knock-card/30 border border-knock-cream/10 rounded-3xl overflow-hidden h-[480px]">
                    {/* Chat Header */}
                    <div className="bg-knock-card border-b border-knock-cream/10 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0">
                        <button
                          onClick={() => setActiveChatId(null)}
                          className="text-knock-cream/50 hover:text-knock-cream text-lg pr-1.5 focus:outline-none"
                        >
                          ←
                        </button>
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-knock-dark border border-knock-mint/20 flex-shrink-0">
                          <img src={activeCand.photoUrl} alt={activeCand.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-knock-cream leading-tight truncate">{activeCand.name}</h4>
                          <p className="text-[9px] text-knock-mint font-mono leading-none mt-0.5 truncate">{activeCand.university}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1.5 bg-knock-dark/60 px-2.5 py-1 rounded-lg border border-knock-cream/5">
                        <span className="w-1.5 h-1.5 rounded-full bg-knock-mint animate-ping" />
                        <span className="text-[8px] font-mono text-knock-cream/50 uppercase">Active</span>
                      </div>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
                      {messages.map((msg, index) => {
                        const isUser = msg.sender === "user";
                        return (
                          <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                              isUser
                                ? "bg-knock-mint text-knock-dark rounded-tr-none font-medium"
                                : "bg-knock-card border border-knock-cream/10 text-knock-cream rounded-tl-none"
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              <span className={`block text-[8px] mt-1 text-right ${isUser ? "text-knock-dark/40" : "text-knock-cream/30"}`}>
                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Typing simulation */}
                      {typingCandidateId === activeChatId && (
                        <div className="flex justify-start">
                          <div className="bg-knock-card border border-knock-cream/10 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-knock-cream/55 font-mono flex items-center space-x-1.5">
                            <span className="w-1 h-1 bg-knock-mint/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1 h-1 bg-knock-mint/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1 h-1 bg-knock-mint/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Input bar */}
                    <form onSubmit={handleSendMessage} className="bg-knock-card border-t border-knock-cream/10 p-3 flex space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={typingCandidateId === activeChatId ? "Dino is typing..." : "Type your message..."}
                        disabled={typingCandidateId === activeChatId}
                        className="flex-1 bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-knock-mint/50 text-knock-cream placeholder:text-knock-cream/20 font-sans"
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || typingCandidateId === activeChatId}
                        className="bg-knock-mint text-knock-dark font-mono font-bold text-xs uppercase px-5 py-3 rounded-xl hover:bg-knock-mint/90 active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
                      >
                        Send
                      </button>
                    </form>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* 4. PROFILE TAB */}
        {currentTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-scale-up">
            
            {/* Header / Avatar Cameo */}
            <div className="text-center space-y-2 py-2 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-knock-card border-2 border-knock-mint flex items-center justify-center font-bold text-3xl text-knock-mint mx-auto shadow-xl shadow-knock-dark/30">
                {(editNickname || "C")[0].toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-knock-cream">{editNickname || "Casper"}</h3>
                <p className="text-xs text-knock-mint font-mono uppercase tracking-wider">
                  {editUniversity ? `${getUniversityName(editUniversity)}` : "Kraków Student"}
                </p>
              </div>
            </div>

            {/* Section 1: Profile Basic Info */}
            <div className="bg-knock-card border border-knock-cream/10 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold font-mono text-knock-mint uppercase tracking-wider border-b border-knock-cream/5 pb-2">
                📝 Profile Details
              </h3>
              
              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase ml-0.5">
                      Nickname
                    </label>
                    {cooldownDaysLeft > 0 && (
                      <span className="text-[9px] text-amber-400 font-mono">
                        Cooldown: {cooldownDaysLeft} days left
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    disabled={cooldownDaysLeft > 0}
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className={`w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-knock-mint/50 font-sans ${
                      cooldownDaysLeft > 0 
                        ? "text-knock-cream/40 cursor-not-allowed opacity-70" 
                        : "text-knock-cream"
                    }`}
                  />
                  {cooldownDaysLeft > 0 && (
                    <p className="text-[10px] text-knock-cream/40 mt-1 font-mono leading-relaxed">
                      ⚠️ Nicknames can only be changed once every 30 days. 
                      {!isSupabaseConfigured && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = { ...userData, nickname_updated_at: undefined };
                            setUserData(updated);
                            localStorage.setItem("knock_user_onboarding", JSON.stringify(updated));
                            setToast({ 
                              show: true,
                              title: "Bypass Success 🧪",
                              message: "Testing: Nickname cooldown bypassed! 🧪",
                              icon: "🧪"
                            });
                            setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2000);
                          }}
                          className="text-[9px] text-knock-mint underline font-mono ml-2 cursor-pointer inline-block"
                        >
                          [Bypass Cooldown (Testing)]
                        </button>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase ml-0.5">
                      Kraków University
                    </label>
                    {isUniversityLocked && (
                      <span className="text-[9px] text-knock-mint font-mono uppercase tracking-wider">
                        Verified & Locked 🔒
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <select
                      value={editUniversity}
                      disabled={isUniversityLocked}
                      onChange={(e) => setEditUniversity(e.target.value)}
                      className={`w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-knock-mint/50 font-sans appearance-none ${
                        isUniversityLocked 
                          ? "text-knock-cream/40 cursor-not-allowed opacity-70" 
                          : "text-knock-cream"
                      }`}
                    >
                      {KRAKOW_UNIVERSITIES.map((u) => (
                        <option key={u.id} value={u.id} className="bg-knock-dark text-knock-cream">
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isUniversityLocked && (
                    <p className="text-[10px] text-knock-cream/40 mt-1 font-mono leading-relaxed">
                      🔒 Locked: University is verified/pending student status. Contact support to update.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase mb-1 ml-0.5">
                      Age
                    </label>
                    <select
                      value={editAge}
                      onChange={(e) => setEditAge(Number(e.target.value))}
                      className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-2.5 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-mono appearance-none"
                    >
                      {Array.from({ length: 23 }, (_, i) => 18 + i).map((a) => (
                        <option key={a} value={a} className="bg-knock-dark text-knock-cream">
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase mb-1 ml-0.5">
                      Gender
                    </label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-2.5 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-sans appearance-none"
                    >
                      <option value="Male" className="bg-knock-dark text-knock-cream">Male</option>
                      <option value="Female" className="bg-knock-dark text-knock-cream">Female</option>
                      <option value="Non-binary" className="bg-knock-dark text-knock-cream">Non-binary</option>
                      <option value="Other" className="bg-knock-dark text-knock-cream">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase mb-1 ml-0.5">
                    Flatmate Bio / Introduction
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell potential roommates about your hobbies, classes, or flat preferences..."
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-2.5 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-sans resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase mb-1 ml-0.5">
                    Ideal Roommate Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe what kind of person you would love to share a flat with..."
                    value={editIdealRoommate}
                    onChange={(e) => setEditIdealRoommate(e.target.value)}
                    className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-2.5 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-sans resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase ml-0.5">
                      My Vibe Tags (Up to 5)
                    </label>
                    <span className="text-[10px] font-mono text-knock-mint font-bold">{editTags.length} / 5</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {INTEREST_TAGS.map((tag) => {
                      const isSelected = editTags.includes(tag.id);
                      return (
                        <button
                          type="button"
                          key={tag.id}
                          onClick={() => {
                            if (isSelected) {
                              setEditTags(editTags.filter((t) => t !== tag.id));
                            } else {
                              if (editTags.length >= 5) {
                                alert("You can select up to 5 interest tags!");
                                return;
                              }
                              setEditTags([...editTags, tag.id]);
                            }
                          }}
                          className={`py-2 px-1.5 rounded-xl border text-[9px] font-semibold font-mono text-center transition-all duration-200 ${
                            isSelected
                              ? "bg-knock-mint/20 border-knock-mint text-knock-mint shadow-md"
                              : "bg-knock-dark/40 border-knock-cream/10 hover:border-knock-cream/20 text-knock-cream/70"
                          }`}
                        >
                          {tag.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Lifestyle Grid (Big 4) */}
            <div className="bg-knock-card border border-knock-cream/10 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold font-mono text-knock-mint uppercase tracking-wider border-b border-knock-cream/5 pb-2">
                🏠 Lifestyle & Match Preferences
              </h3>

              <div className="space-y-4">
                {/* Min/Max Rent Budget Sliders */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-knock-cream/50 mb-1 ml-0.5">
                      <span>MIN RENT BUDGET</span>
                      <span className="text-knock-mint font-bold">{editMinBudget.toLocaleString()} PLN</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="100"
                      value={editMinBudget}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditMinBudget(val);
                        if (val > editMaxBudget) setEditMaxBudget(val);
                      }}
                      style={{
                        background: `linear-gradient(to right, #5FE3A1 ${getBudgetPercent(editMinBudget)}%, #132F26 ${getBudgetPercent(editMinBudget)}%)`
                      }}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-knock-mint"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-mono text-knock-cream/50 mb-1 ml-0.5">
                      <span>MAX RENT BUDGET</span>
                      <span className="text-knock-mint font-bold">{editMaxBudget.toLocaleString()} PLN</span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="5000"
                      step="100"
                      value={editMaxBudget}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditMaxBudget(val);
                        if (val < editMinBudget) setEditMinBudget(val);
                      }}
                      style={{
                        background: `linear-gradient(to right, #5FE3A1 ${getBudgetPercent(editMaxBudget)}%, #132F26 ${getBudgetPercent(editMaxBudget)}%)`
                      }}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none accent-knock-mint"
                    />
                  </div>
                </div>

                {/* Smoking, Sleep, Cleanliness dropdowns */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase mb-1 ml-0.5">
                      Smoking Preference
                    </label>
                    <select
                      value={editSmoking}
                      onChange={(e) => setEditSmoking(e.target.value)}
                      className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-2.5 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-sans appearance-none"
                    >
                      <option value="non-smoker" className="bg-knock-dark text-knock-cream">Non-smoker (No smoking inside)</option>
                      <option value="balcony" className="bg-knock-dark text-knock-cream">Balcony Only (Smoke outside)</option>
                      <option value="vaping" className="bg-knock-dark text-knock-cream">Vaping / E-cigarettes</option>
                      <option value="smoker" className="bg-knock-dark text-knock-cream">Active Smoker</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase mb-1 ml-0.5">
                      Sleep Rhythm
                    </label>
                    <select
                      value={editSleep}
                      onChange={(e) => setEditSleep(e.target.value)}
                      className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-2.5 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-sans appearance-none"
                    >
                      <option value="early-bird" className="bg-knock-dark text-knock-cream">Early Bird (Wake/sleep early)</option>
                      <option value="night-owl" className="bg-knock-dark text-knock-cream">Night Owl (Late studies/activities)</option>
                      <option value="flexible" className="bg-knock-dark text-knock-cream">Flexible Rhythm (Adapts to schedule)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono tracking-wider text-knock-cream/50 uppercase mb-1 ml-0.5">
                      Cleanliness Standard
                    </label>
                    <select
                      value={editCleanliness}
                      onChange={(e) => setEditCleanliness(e.target.value)}
                      className="w-full bg-knock-dark/60 border border-knock-cream/10 rounded-xl px-4 py-2.5 text-xs text-knock-cream focus:outline-none focus:border-knock-mint/50 font-sans appearance-none"
                    >
                      <option value="clean-freak" className="bg-knock-dark text-knock-cream">Clean Freak (Spotless, clean instantly)</option>
                      <option value="weekly" className="bg-knock-dark text-knock-cream">Weekly Balanced (Regular tidy ups)</option>
                      <option value="easygoing" className="bg-knock-dark text-knock-cream">Easygoing / Chill (Not stressed by clutter)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Account Settings & Verification */}
            <div className="bg-knock-card border border-knock-cream/10 rounded-3xl p-5 space-y-4 shadow-xl">
              <h3 className="text-xs font-bold font-mono text-knock-mint uppercase tracking-wider border-b border-knock-cream/5 pb-2">
                ⚙️ Account & Application Settings
              </h3>

              <div className="space-y-4">
                {/* Verification Status */}
                <div className="flex items-center justify-between bg-knock-dark/40 border border-knock-cream/5 p-3 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-mono text-knock-cream/50 uppercase">Student Status</p>
                    {userData.is_verified ? (
                      <p className="text-xs font-bold text-knock-mint mt-0.5">Verified Account 🛡️</p>
                    ) : userData.verification_method === "id_card" ? (
                      <p className="text-xs font-bold text-amber-400 mt-0.5">ID Verification Pending ⏳</p>
                    ) : (
                      <p className="text-xs font-bold text-knock-cream/60 mt-0.5">Unverified Student 🔒</p>
                    )}
                  </div>
                  
                  {!userData.is_verified && !userData.verification_method && (
                    <button
                      type="button"
                      onClick={() => setShowVerificationModal(true)}
                      className="bg-knock-mint hover:bg-knock-mint/90 text-knock-dark text-[10px] font-bold font-mono uppercase px-3.5 py-2 rounded-xl transition-all shadow-md cursor-pointer"
                    >
                      Verify Now
                    </button>
                  )}
                </div>

                {/* Notifications switch */}
                <div className="flex items-center justify-between bg-knock-dark/40 border border-knock-cream/5 p-3 rounded-2xl">
                  <div>
                    <p className="text-[10px] font-mono text-knock-cream/50 uppercase">Match Alerts</p>
                    <p className="text-[11px] text-knock-cream/70 mt-0.5">Simulate background matching toasts</p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleNotify}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative border cursor-pointer ${
                      notifyEnabled 
                        ? "bg-knock-mint/20 border-knock-mint" 
                        : "bg-knock-dark border-knock-cream/20"
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 rounded-full transition-all duration-300 absolute top-0.5 ${
                        notifyEnabled 
                          ? "bg-knock-mint left-[26px]" 
                          : "bg-knock-cream/30 left-[4px]"
                      }`}
                    />
                  </button>
                </div>

                {/* Save and Logout button row */}
                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex-1 py-4 rounded-2xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs font-semibold uppercase tracking-wider transition-colors active:scale-98 cursor-pointer"
                  >
                    Logout 🚪
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 rounded-2xl bg-knock-mint hover:bg-knock-mint/90 text-knock-dark font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-knock-mint/10 active:scale-98 cursor-pointer"
                  >
                    Save Profile 💾
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* Student Verification Choice Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-knock-dark/85 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]">
          <div className="w-full max-w-md bg-knock-card border border-knock-cream/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-center">
            
            {/* Close Button */}
            <button
              onClick={() => setShowVerificationModal(false)}
              className="absolute top-4 right-4 text-knock-cream/40 hover:text-knock-cream transition-colors text-sm font-bold"
            >
              ✕
            </button>

            {/* Ambient Background Glowing Orb */}
            <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-knock-mint/10 blur-2xl pointer-events-none" />

            <div className="space-y-6 animate-[fadeIn_0.2s_ease-out] text-center">
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-full bg-knock-mint/10 text-knock-mint flex items-center justify-center mx-auto text-lg mb-1">
                  🛡️
                </div>
                <h2 className="text-xl font-bold text-knock-cream">Verify Your Student Status</h2>
                <p className="text-xs text-knock-cream/60 px-2 leading-relaxed">
                  To send a &apos;Knock&apos; to {currentCandidate?.name || "roommates"}, please verify that you are a student in Kraków.
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] p-3 rounded-xl text-left font-mono leading-normal">
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Option A: Email verification */}
              <div className="bg-knock-dark/40 border border-knock-cream/10 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">📧</span>
                  <h3 className="text-xs font-bold text-knock-cream uppercase tracking-wide">Option A: Verify via University Email</h3>
                </div>
                <p className="text-[10px] text-knock-cream/50 leading-normal">
                  Instantly verify using your student student email (ends with .edu.pl, etc.).
                </p>

                {!emailSent ? (
                  <div className="space-y-2 mt-1">
                    <input
                      type="email"
                      placeholder="yourname@university.edu.pl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-knock-dark/80 border border-knock-cream/10 rounded-xl px-3 py-2 text-xs text-knock-cream placeholder:text-knock-cream/25 focus:outline-none focus:border-knock-mint/45 font-sans"
                    />
                    <button
                      type="button"
                      disabled={!email || isSubmittingEmail}
                      onClick={handleEmailVerification}
                      className={`w-full py-3 mt-1 rounded-xl text-xs font-bold font-mono tracking-wider uppercase transition-all duration-300 ${
                        email && !isSubmittingEmail
                          ? "bg-knock-mint text-knock-dark hover:shadow-lg"
                          : "bg-knock-cream/10 text-knock-cream/30 cursor-not-allowed"
                      }`}
                    >
                      {isSubmittingEmail ? "Sending..." : "Send Verification Link"}
                    </button>
                  </div>
                ) : (
                  <div className="bg-knock-mint/10 border border-knock-mint/30 rounded-xl p-3 text-center space-y-1.5 animate-[fadeIn_0.2s_ease-out]">
                    <p className="text-[11px] font-semibold text-knock-mint">✉️ Verification Link Sent!</p>
                    <p className="text-[10px] text-knock-cream/70 leading-normal">
                      Please check your inbox at <span className="underline">{email}</span> and click the link to verify and start matching.
                    </p>
                    {!isSupabaseConfigured && (
                      <Link
                        href="/onboarding/success"
                        className="mt-3 block text-center py-2 border border-dashed border-knock-mint/40 text-[9px] text-knock-mint font-mono rounded-lg hover:bg-knock-mint/10 transition-colors"
                      >
                        🧪 [Testing Mock: Bypass to Success Page]
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center justify-between text-[10px] font-mono tracking-widest text-knock-cream/30 uppercase my-2">
                <div className="h-px bg-knock-cream/10 flex-1" />
                <span className="px-3">OR</span>
                <div className="h-px bg-knock-cream/10 flex-1" />
              </div>

              {/* Option B: ID Card Camera Capture */}
              <div className="bg-knock-dark/40 border border-knock-cream/10 rounded-2xl p-4 text-left space-y-3">
                <div className="flex items-center space-x-2">
                  <span className="text-base">🪪</span>
                  <h3 className="text-xs font-bold text-knock-cream uppercase tracking-wide">Option B: Capture Student ID Card</h3>
                </div>
                <p className="text-[10px] text-knock-cream/50 leading-normal">
                  Erasmus or no university email yet? Use your device camera to take a photo of your Student ID or Acceptance Letter.
                </p>

                <div className="mt-1">
                  {uploadStatus === "idle" && (
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById("mobile-camera-input-feed-custom");
                        if (fileInput) fileInput.click();
                      }}
                      className="w-full py-4 rounded-xl text-xs font-bold font-mono tracking-wider uppercase bg-knock-cream hover:bg-white text-knock-dark hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
                    >
                      <span>Take Photo of ID 📷</span>
                    </button>
                  )}

                  <input
                    id="mobile-camera-input-feed-custom"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                  />

                  {(uploadStatus === "compressing" || uploadStatus === "uploading") && (
                    <div className="flex flex-col items-center justify-center p-5 border border-knock-cream/10 rounded-xl bg-knock-dark/30 space-y-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-knock-mint" />
                      <span className="text-[10px] text-knock-mint font-mono font-medium tracking-wide animate-pulse uppercase">
                        {uploadStatus === "compressing" ? "COMPRESSING IMAGE..." : "UPLOADING TO STORAGE..."}
                      </span>
                    </div>
                  )}

                  {uploadStatus === "success" && (
                    <div className="bg-knock-mint/10 border border-knock-mint/30 rounded-xl p-3 text-center space-y-1">
                      <p className="text-[10px] font-semibold text-knock-mint">🎉 Upload Successful!</p>
                      <p className="text-[9px] text-knock-cream/60">Redirecting to pending dashboard...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-8 py-6 text-center text-[10px] text-knock-cream/30 font-mono border-t border-knock-cream/5 flex-shrink-0">
        Knock App © 2026. Designed for Kraków Students.
      </footer>
    </div>
  );
}
