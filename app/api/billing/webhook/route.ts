import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

// Initialize Supabase admin client (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pro plan limits
const PRO_PLAN_LIMITS = {
  board_cap: 500, // User requested limit
  active_cap_per_board: 100, // User requested limit
  archived_cap_per_user: 200000, // User requested limit
};

// Free plan limits
const FREE_PLAN_LIMITS = {
  board_cap: 1,
  active_cap_per_board: 10, // Reduced for testing
  archived_cap_per_user: 1000,
};

/**
 * Verify Paddle webhook signature
 */
function verifyPaddleSignature(
  rawBody: string,
  signature: string | null,
  secretKey: string
): { valid: boolean; reason?: string } {
  if (!signature) {
    return { valid: false, reason: "No Paddle-Signature header found" };
  }

  try {
    // Parse the signature header: ts=TIMESTAMP;h1=HASH
    const parts: Record<string, string> = {};
    signature.split(";").forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        parts[key] = value;
      }
    });

    const timestamp = parts["ts"];
    const h1 = parts["h1"];

    console.log("Signature parts:", {
      timestamp,
      h1: h1?.substring(0, 20) + "...",
    });

    if (!timestamp || !h1) {
      return {
        valid: false,
        reason: "Invalid Paddle-Signature format - missing ts or h1",
      };
    }

    // Check timestamp is within tolerance (5 minutes for flexibility)
    const timestampSeconds = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const tolerance = 300; // 5 minutes

    if (Math.abs(now - timestampSeconds) > tolerance) {
      return {
        valid: false,
        reason: `Timestamp out of range: ${timestampSeconds} vs ${now}`,
      };
    }

    // Build signed payload: timestamp:body
    const signedPayload = `${timestamp}:${rawBody}`;

    // Compute HMAC-SHA256
    const expectedSignature = createHmac("sha256", secretKey)
      .update(signedPayload)
      .digest("hex");

    console.log("Signature comparison:", {
      expected: expectedSignature.substring(0, 20) + "...",
      received: h1.substring(0, 20) + "...",
    });

    // Compare using timing-safe comparison
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(h1, "hex");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return { valid: false, reason: "Signature length mismatch" };
    }

    const isValid = timingSafeEqual(
      new Uint8Array(expectedBuffer),
      new Uint8Array(receivedBuffer)
    );

    return {
      valid: isValid,
      reason: isValid ? undefined : "Signature mismatch",
    };
  } catch (error) {
    console.error("Error verifying signature:", error);
    return { valid: false, reason: `Verification error: ${error}` };
  }
}

/**
 * Handle subscription created/activated - upgrade user to Pro
 */
async function handleSubscriptionCreated(data: any) {
  const customerId = data.customer_id;
  const customData = data.custom_data || {};

  // Try to find user_id in custom_data (handle case sensitivity)
  let userId = customData.user_id || customData.userId || customData.USER_ID;

  console.log("Handle Subscription Created - Extracted Data:", {
    customerId,
    customData,
    userId,
  });

  if (!userId) {
    // Try to find user by email if custom_data wasn't passed
    const customerEmail = data.customer?.email;
    if (customerEmail) {
      const { data: users } = await supabaseAdmin
        .from("auth.users")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (users) {
        return upgradeUserToPro(users.id, data);
      }
    }
    console.error("No user_id in custom_data and could not find user by email");
    return;
  }

  await upgradeUserToPro(userId, data);
}

/**
 * Upgrade a user to Pro plan
 */
async function upgradeUserToPro(userId: string, subscriptionData: any) {
  const { data: updated, error } = await supabaseAdmin
    .from("entitlements")
    .upsert(
      {
        user_id: userId,
        plan: "pro",
        board_cap: PRO_PLAN_LIMITS.board_cap,
        active_cap_per_board: PRO_PLAN_LIMITS.active_cap_per_board,
        archived_cap_per_user: PRO_PLAN_LIMITS.archived_cap_per_user,
        paddle_customer_id: subscriptionData.customer_id,
        paddle_subscription_id:
          subscriptionData.id || subscriptionData.subscription_id,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
        ignoreDuplicates: false,
      }
    )
    .select();

  if (error) {
    console.error("Error upgrading user to Pro:", error);
    throw error;
  }

  console.log("User upgraded to Pro:", userId, "Limits:", updated);
}

/**
 * Handle subscription canceled - downgrade user to Free
 */
async function handleSubscriptionCanceled(data: any) {
  const subscriptionId = data.id;

  console.log("Subscription canceled:", subscriptionId);

  // Find user by subscription ID
  const { data: entitlement, error: findError } = await supabaseAdmin
    .from("entitlements")
    .select("user_id")
    .eq("paddle_subscription_id", subscriptionId)
    .single();

  if (findError || !entitlement) {
    console.error("Could not find user for subscription:", subscriptionId);
    return;
  }

  // Downgrade to Free
  const { error } = await supabaseAdmin
    .from("entitlements")
    .update({
      plan: "free",
      board_cap: FREE_PLAN_LIMITS.board_cap,
      active_cap_per_board: FREE_PLAN_LIMITS.active_cap_per_board,
      archived_cap_per_user: FREE_PLAN_LIMITS.archived_cap_per_user,
      subscription_status: "canceled",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", entitlement.user_id);

  if (error) {
    console.error("Error downgrading user to Free:", error);
    throw error;
  }

  console.log("User downgraded to Free:", entitlement.user_id);
}

/**
 * Handle transaction completed - alternative path for subscription activation
 */
async function handleTransactionCompleted(data: any) {
  // Only process subscription transactions
  if (data.subscription_id) {
    const customData = data.custom_data || {};
    const userId = customData.user_id;

    if (userId) {
      console.log(
        "Transaction completed for subscription, upgrading user:",
        userId
      );
      await upgradeUserToPro(userId, {
        customer_id: data.customer_id,
        subscription_id: data.subscription_id,
      });
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Received Paddle webhook");

    // Get raw body for signature verification
    const rawBody = await request.text();

    // DEBUG: Log raw body (be careful with secrets in prod, but useful here)
    console.log("Webhook Raw Body Preview:", rawBody.substring(0, 500));

    // Verify signature
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
    const skipVerification =
      process.env.PADDLE_SKIP_SIGNATURE_VERIFICATION === "true";

    if (webhookSecret && !skipVerification) {
      const signature = request.headers.get("paddle-signature");
      console.log("Verifying webhook signature...");

      const verification = verifyPaddleSignature(
        rawBody,
        signature,
        webhookSecret
      );

      if (!verification.valid) {
        console.error("Invalid webhook signature:", verification.reason);
        return NextResponse.json(
          { error: "Invalid signature", reason: verification.reason },
          { status: 401 }
        );
      }
      console.log("Signature verified successfully");
    } else if (skipVerification) {
      console.warn(
        "⚠️ PADDLE_SKIP_SIGNATURE_VERIFICATION is enabled - skipping signature check"
      );
    } else {
      console.warn(
        "PADDLE_WEBHOOK_SECRET not set - skipping signature verification"
      );
    }

    // Parse the webhook payload
    const event = JSON.parse(rawBody);
    const eventType = event.event_type;
    const eventData = event.data;

    console.log("Processing event type:", eventType);
    console.log(
      "Event Data Custom Data:",
      JSON.stringify(eventData.custom_data, null, 2)
    );

    // Handle different event types
    switch (eventType) {
      case "subscription.created":
      case "subscription.activated":
        await handleSubscriptionCreated(eventData);
        break;

      case "subscription.canceled":
        await handleSubscriptionCanceled(eventData);
        break;

      case "subscription.updated":
        // Handle plan changes if needed
        console.log("Subscription updated:", eventData.id);
        break;

      case "transaction.completed":
        await handleTransactionCompleted(eventData);
        break;

      default:
        console.log("Unhandled event type:", eventType);
    }

    // Always respond with 200 to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    // Still return 200 to prevent retries for processing errors
    // Paddle will retry on 5xx errors
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Paddle may send GET requests to verify the endpoint
export async function GET() {
  return NextResponse.json({ status: "Paddle webhook endpoint active" });
}
