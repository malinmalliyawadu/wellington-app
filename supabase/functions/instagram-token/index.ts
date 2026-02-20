import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const INSTAGRAM_APP_ID = Deno.env.get("INSTAGRAM_APP_ID") ?? "";
const INSTAGRAM_APP_SECRET = Deno.env.get("INSTAGRAM_APP_SECRET") ?? "";
const REDIRECT_URI = "https://wellyapp.nz/auth/instagram/callback";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify the user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("[instagram-token] Auth failed:", authError?.message ?? "no user");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!INSTAGRAM_APP_SECRET) {
      console.error("[instagram-token] INSTAGRAM_APP_SECRET not set in secrets");
      return new Response(JSON.stringify({ error: "Instagram integration not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code } = (await req.json()) as { code: string };
    if (!code) {
      return new Response(JSON.stringify({ error: "Authorization code is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exchange code for short-lived token
    const tokenForm = new URLSearchParams();
    tokenForm.append("client_id", INSTAGRAM_APP_ID);
    tokenForm.append("client_secret", INSTAGRAM_APP_SECRET);
    tokenForm.append("grant_type", "authorization_code");
    tokenForm.append("redirect_uri", REDIRECT_URI);
    tokenForm.append("code", code);

    const tokenRes = await fetch("https://api.instagram.com/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenForm.toString(),
    });

    if (!tokenRes.ok) {
      const tokenErr = await tokenRes.text();
      console.error("[instagram-token] Token exchange failed:", tokenRes.status, tokenErr);
      return new Response(JSON.stringify({ error: "Failed to exchange Instagram authorization code" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken: string = tokenData.access_token;
    const igUserId: string = String(tokenData.user_id);

    // Exchange short-lived token for long-lived token (60 days)
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token` +
        `?grant_type=ig_exchange_token` +
        `&client_secret=${INSTAGRAM_APP_SECRET}` +
        `&access_token=${shortLivedToken}`
    );

    if (!longLivedRes.ok) {
      const llErr = await longLivedRes.text();
      console.error("[instagram-token] Long-lived token exchange failed:", longLivedRes.status, llErr);
      return new Response(JSON.stringify({ error: "Failed to get long-lived Instagram token" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const longLivedData = await longLivedRes.json();
    const accessToken: string = longLivedData.access_token;
    const expiresIn: number = longLivedData.expires_in;

    // Fetch Instagram username
    const profileRes = await fetch(
      `https://graph.instagram.com/me?fields=username&access_token=${accessToken}`
    );

    if (!profileRes.ok) {
      return new Response(JSON.stringify({ error: "Failed to fetch Instagram profile" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileData = await profileRes.json();
    const igUsername: string = profileData.username;

    const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Upsert connection in database
    const { data, error } = await supabase
      .from("instagram_connections")
      .upsert(
        {
          user_id: user.id,
          instagram_user_id: igUserId,
          instagram_username: igUsername,
          access_token: accessToken,
          token_expires_at: tokenExpiresAt,
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      console.error("[instagram-token] DB upsert failed:", error.message);
      return new Response(JSON.stringify({ error: "Failed to save Instagram connection" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        instagramUserId: data.instagram_user_id,
        instagramUsername: data.instagram_username,
        accessToken: data.access_token,
        tokenExpiresAt: data.token_expires_at,
        connectedAt: data.connected_at,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[instagram-token] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
