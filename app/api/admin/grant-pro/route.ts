import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase";

/**
 * Grant Pro plan to a user (Admin only)
 * POST /api/admin/grant-pro
 * Body: { userId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Verify requester is admin (you can implement your own admin check)
    // For now, we'll use a simple admin check - in production, use proper RBAC
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Simple admin check (replace with your actual admin logic)
    const isAdmin =
      user.email?.toLowerCase() === "simon@teamtwobees.com" ||
      user.email?.toLowerCase() === "simon@threelanes.app" ||
      user.email?.endsWith("@threelanes.app") ||
      user.email?.endsWith("@teamtwobees.com");

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { userId, email } = await request.json();

    // Look up user by email if provided instead of userId
    let targetUserId = userId;

    if (!targetUserId && email) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();

      if (profileError || !profile) {
        return NextResponse.json(
          { error: `User not found with email: ${email}` },
          { status: 404 }
        );
      }

      targetUserId = profile.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Either userId or email is required" },
        { status: 400 }
      );
    }

    // Grant Pro plan
    const { data, error } = await supabase
      .from("entitlements")
      .upsert({
        user_id: targetUserId,
        plan: "pro",
        status: "active",
        board_cap: 500,
        active_cap_per_board: 100,
        archive_retention_days: 36500, // ~100 years = indefinite
        archived_cap_per_user: 200000,
        current_period_end: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(), // 30 days from now
        cancel_at_period_end: false,
        enforcement_state: "none",
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error granting Pro:", error);
      return NextResponse.json(
        { error: "Failed to grant Pro plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pro plan granted successfully",
      entitlements: data,
    });
  } catch (err) {
    console.error("Error in grant-pro:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Get list of users and their plans (Admin only)
 * GET /api/admin/grant-pro
 */
export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Verify admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin =
      user.email?.toLowerCase() === "simon@teamtwobees.com" ||
      user.email?.toLowerCase() === "simon@threelanes.app" ||
      user.email?.endsWith("@threelanes.app") ||
      user.email?.endsWith("@teamtwobees.com");

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Create admin client with service role key to bypass RLS
    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all entitlements first (admin has access to this table)
    const { data: entitlements, error: entitlementsError } = await supabaseAdmin
      .from("entitlements")
      .select("user_id")
      .order("created_at", { ascending: false });

    if (entitlementsError) {
      console.error("Error fetching entitlements:", entitlementsError);
      return NextResponse.json(
        { error: "Failed to fetch entitlements" },
        { status: 500 }
      );
    }

    console.log("=== BACKEND DEBUG START ===");
    console.log("Found entitlements user IDs:", entitlements?.length || 0);
    console.log(
      "Entitlement user IDs:",
      entitlements?.map((e) => e.user_id)
    );

    // Get profiles for users with entitlements (using admin client to bypass RLS)
    const userIds = (entitlements || []).map((e) => e.user_id);
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        email,
        full_name,
        created_at
      `
      )
      .in("id", userIds)
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("Error fetching users:", profilesError);
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    console.log("Found profiles:", profiles?.length || 0);
    console.log(
      "Profile IDs:",
      profiles?.map((p) => ({ id: p.id, email: p.email }))
    );

    // Get full entitlements details for all users
    const { data: fullEntitlements, error: fullEntitlementsError } =
      await supabaseAdmin
        .from("entitlements")
        .select("*")
        .in("user_id", userIds);

    if (fullEntitlementsError) {
      console.error("Error fetching full entitlements:", fullEntitlementsError);
      return NextResponse.json(
        { error: "Failed to fetch full entitlements" },
        { status: 500 }
      );
    }

    console.log("Found full entitlements:", fullEntitlements?.length || 0);
    console.log(
      "Full entitlement user IDs:",
      fullEntitlements?.map((e) => ({ user_id: e.user_id, plan: e.plan }))
    );

    // Create default entitlements for users who don't have them
    const usersWithoutEntitlements = (profiles || []).filter(
      (profile) =>
        !(fullEntitlements || []).some((e) => e.user_id === profile.id)
    );

    console.log("Users without entitlements:", usersWithoutEntitlements.length);
    console.log(
      "Missing entitlement emails:",
      usersWithoutEntitlements.map((u) => u.email)
    );

    if (usersWithoutEntitlements.length > 0) {
      console.log(
        "Creating default entitlements for users:",
        usersWithoutEntitlements.length
      );

      const { error: insertError } = await supabaseAdmin
        .from("entitlements")
        .insert(
          usersWithoutEntitlements.map((profile) => ({
            user_id: profile.id,
            plan: "free",
            board_cap: 1,
            active_cap_per_board: 100,
            archive_retention_days: 90,
            archived_cap_per_user: 1000,
          }))
        );

      if (insertError) {
        console.error("Error creating default entitlements:", insertError);
        // Continue anyway - we'll show the users but without entitlements
      }
    }

    // Combine profiles with entitlements and get usage stats for each user
    const usersWithStats = await Promise.all(
      (profiles || []).map(async (profile) => {
        const entitlement = (fullEntitlements || []).find(
          (e) => e.user_id === profile.id
        );

        // Get usage stats using admin client to bypass RLS
        const { data: boards } = await supabaseAdmin
          .from("boards")
          .select("id")
          .eq("user_id", profile.id);

        console.log(
          `User ${profile.email}: Found ${boards?.length || 0} boards`
        );

        const { data: tasks } = await supabaseAdmin
          .from("tasks")
          .select("archived")
          .in("board_id", boards?.map((b) => b.id) || []);

        console.log(
          `User ${profile.email}: Found ${tasks?.length || 0} total tasks`
        );

        const activeTasks = tasks?.filter((t) => !t.archived).length || 0;
        const archivedTasks = tasks?.filter((t) => t.archived).length || 0;

        return {
          user_id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          created_at: profile.created_at,
          plan: entitlement?.plan || "free",
          board_cap: entitlement?.board_cap || 1,
          active_cap_per_board: entitlement?.active_cap_per_board || 100,
          archive_retention_days: entitlement?.archive_retention_days || 90,
          archived_cap_per_user: entitlement?.archived_cap_per_user || 1000,
          updated_at: entitlement?.updated_at || profile.created_at,
          usage: {
            boards: boards?.length || 0,
            activeTasks,
            archivedTasks,
          },
        };
      })
    );

    console.log("Processing users for final response...");
    console.log("Final users count:", usersWithStats.length);
    console.log(
      "Final users:",
      usersWithStats.map((u) => ({
        email: u.email,
        plan: u.plan,
        user_id: u.user_id,
      }))
    );
    console.log("=== BACKEND DEBUG END ===");

    return NextResponse.json({
      success: true,
      users: usersWithStats,
    });
  } catch (err) {
    console.error("Error in grant-pro GET:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
