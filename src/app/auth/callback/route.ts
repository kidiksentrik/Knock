import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    
    // Exchange the verification code for an active user session
    const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!exchangeError) {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Check if user already has a profile record in database
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .single();

        if (existingProfile) {
          // Returning user: redirect straight to feed
          return NextResponse.redirect(`${requestUrl.origin}/feed`);
        }

        // New user or guest verifying onboarding
        const meta = user.user_metadata;
        if (meta?.nickname) {
          // Has onboarding metadata, upsert profile and verify them
          const { error: profileError } = await supabase.from("profiles").upsert({
            id: user.id,
            nickname: meta.nickname,
            university: meta.university || "uj",
            min_budget: Number(meta.minBudget) || 1200,
            max_budget: Number(meta.maxBudget) || 2500,
            smoking: meta.smoking || "non-smoker",
            sleep: meta.sleep || "night-owl",
            cleanliness: meta.cleanliness || "weekly",
            tags: meta.tags || [],
            ideal_roommate: meta.idealRoommate || null,
            is_verified: true, // E-mail verified
            verification_method: "email",
          });

          if (profileError) {
            console.error("Callback: Failed to upsert user profile into database:", profileError);
          }
          return NextResponse.redirect(`${requestUrl.origin}/onboarding/success`);
        } else {
          // Signed up directly from landing page (no onboarding metadata yet), redirect to onboarding
          return NextResponse.redirect(`${requestUrl.origin}/onboarding`);
        }
      }
    } else {
      console.error("Callback: Session code exchange failed:", exchangeError);
    }
  }

  // Redirect to feed upon completion/failure
  return NextResponse.redirect(`${requestUrl.origin}/feed`);
}
