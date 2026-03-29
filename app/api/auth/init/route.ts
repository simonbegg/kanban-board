import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  console.log("Init API called");

  // Debug: Check env vars
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");

  try {
    const { userId } = await req.json();
    console.log("Initializing entitlements for user:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Check if entitlement already exists
    const { data: existing, error: checkError } = await supabaseAdmin
      .from("entitlements")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing entitlements:", checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existing) {
      console.log("Entitlements already exist for user:", userId);
      return NextResponse.json({ status: "exists" });
    }

    // Create default free plan entitlement
    const { error } = await supabaseAdmin.from("entitlements").insert({
      user_id: userId,
      plan: "free",
      board_cap: 1,
      active_cap_per_board: 10, // Reduced for testing
      archived_cap_per_user: 1000,
      subscription_status: "active",
    });

    if (error) {
      // Handle duplicate key error (race condition)
      if (error.code === "23505") {
        console.log(
          "Entitlements created by another request for user:",
          userId
        );
        return NextResponse.json({ status: "exists" });
      }

      console.error("Error creating entitlement:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Successfully created default entitlements for user:", userId);
    return NextResponse.json({ status: "created" });
  } catch (error) {
    console.error("Init API error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error as Error).message },
      { status: 500 }
    );
  }
}
