import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

// Initialize Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Free plan limits (same as in webhook)
const FREE_PLAN_LIMITS = {
  board_cap: 1,
  active_cap_per_board: 10,
  archived_cap_per_user: 1000,
};

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = createServerComponentClient({ cookies });
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { cancelNow = false } = body;

    // Get user's entitlements including subscription ID
    const { data: entitlements, error: entError } = await supabaseAdmin
      .from("entitlements")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (entError || !entitlements) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      );
    }

    if (entitlements.plan !== "pro") {
      return NextResponse.json(
        { error: "You are not on a Pro plan" },
        { status: 400 }
      );
    }

    const subscriptionId = entitlements.paddle_subscription_id;
    const paddleApiKey = process.env.PADDLE_API_KEY;

    // If no Paddle subscription or no API key configured, downgrade directly
    // This handles testing scenarios and legacy upgrades
    if (!subscriptionId || !paddleApiKey) {
      if (!subscriptionId) {
        console.log("No Paddle subscription found, downgrading directly");
      } else {
        console.log(
          "Paddle API key not configured, downgrading directly without Paddle API call"
        );
      }

      const effectiveDate = new Date();
      const courtesyUntil = new Date();
      courtesyUntil.setDate(courtesyUntil.getDate() + 14);

      await supabaseAdmin
        .from("entitlements")
        .update({
          plan: "free",
          ...FREE_PLAN_LIMITS,
          subscription_status: "canceled",
          paddle_subscription_id: null, // Clear the subscription ID
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return NextResponse.json({
        success: true,
        effectiveDate: effectiveDate.toISOString(),
        courtesyUntil: courtesyUntil.toISOString(),
        message:
          "Your Pro plan has been cancelled. You have been downgraded to the Free plan.",
      });
    }

    // Call Paddle API to cancel subscription (only if we have both subscription ID and API key)
    const paddleEnvironment =
      process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox";
    const paddleApiUrl =
      paddleEnvironment === "production"
        ? "https://api.paddle.com"
        : "https://sandbox-api.paddle.com";

    // Determine effective_from based on cancelNow
    const effectiveFrom = cancelNow ? "immediately" : "next_billing_period";

    console.log(
      `Cancelling subscription ${subscriptionId} with effective_from: ${effectiveFrom}`
    );

    const paddleResponse = await fetch(
      `${paddleApiUrl}/subscriptions/${subscriptionId}/cancel`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${paddleApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          effective_from: effectiveFrom,
        }),
      }
    );

    const paddleData = await paddleResponse.json();

    if (!paddleResponse.ok) {
      console.error("Paddle API error:", paddleData);
      return NextResponse.json(
        { error: paddleData.error?.detail || "Failed to cancel subscription" },
        { status: paddleResponse.status }
      );
    }

    console.log("Paddle cancellation response:", paddleData);

    // Calculate dates
    const effectiveDate = cancelNow
      ? new Date()
      : new Date(
          paddleData.data?.current_billing_period?.ends_at || Date.now()
        );

    const courtesyUntil = new Date(effectiveDate);
    courtesyUntil.setDate(courtesyUntil.getDate() + 14);

    // Update entitlements to reflect scheduled cancellation
    // Note: The actual downgrade will happen via webhook when Paddle confirms
    if (cancelNow) {
      // Immediate cancellation - downgrade now
      await supabaseAdmin
        .from("entitlements")
        .update({
          plan: "free",
          ...FREE_PLAN_LIMITS,
          subscription_status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      // Scheduled cancellation - mark as pending cancellation
      await supabaseAdmin
        .from("entitlements")
        .update({
          subscription_status: "pending_cancellation",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      effectiveDate: effectiveDate.toISOString(),
      courtesyUntil: courtesyUntil.toISOString(),
      message: cancelNow
        ? "Your Pro plan has been cancelled immediately. You have been downgraded to the Free plan."
        : `Your Pro plan will be cancelled at the end of your billing period. You'll have full access until then.`,
    });
  } catch (error) {
    console.error("Subscription cancellation error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
