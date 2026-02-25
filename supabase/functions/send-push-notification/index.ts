import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const NOTIFICATION_TYPE_MAP: Record<string, { prefsKey: string; message: (name: string) => string }> = {
  like: { prefsKey: "likes", message: (name) => `${name} liked your post` },
  comment: { prefsKey: "comments", message: (name) => `${name} commented on your post` },
  follow: { prefsKey: "follows", message: (name) => `${name} started following you` },
  guide_like: { prefsKey: "guide_likes", message: (name) => `${name} liked your guide` },
  guide_comment: { prefsKey: "guide_comments", message: (name) => `${name} commented on your guide` },
  event_attendance: { prefsKey: "event_attendance", message: (name) => `${name} is going to your event` },
  comment_reply: { prefsKey: "comment_replies", message: (name) => `${name} replied to your comment` },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record;

    if (!record) {
      return new Response(JSON.stringify({ error: "No record in payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { recipient_id, actor_id, type, post_id, event_id } = record;

    // Check recipient's notification preferences
    const { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", recipient_id)
      .maybeSingle();

    // If prefs exist and push is globally disabled, skip
    if (prefs && !prefs.push_enabled) {
      return new Response(JSON.stringify({ skipped: "push_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check type-specific preference
    const typeConfig = NOTIFICATION_TYPE_MAP[type];
    if (!typeConfig) {
      return new Response(JSON.stringify({ skipped: "unknown_type" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (prefs && prefs[typeConfig.prefsKey] === false) {
      return new Response(JSON.stringify({ skipped: "type_disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get recipient's push tokens
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", recipient_id);

    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ skipped: "no_tokens" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up actor display name
    const { data: actor } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", actor_id)
      .single();

    const actorName = actor?.display_name ?? "Someone";
    const body = typeConfig.message(actorName);

    // Build push notification data payload for navigation
    const data: Record<string, string> = { type, actorId: actor_id };
    if (post_id) data.postId = post_id;
    if (event_id) data.eventId = event_id;

    // Send to Expo Push API
    const messages = tokens.map((t: { token: string }) => ({
      to: t.token,
      sound: "default",
      title: "Welly",
      body,
      data,
    }));

    const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushResponse.json();

    return new Response(JSON.stringify({ sent: messages.length, result: pushResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-push-notification error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
