import { createClient } from "npm:@supabase/supabase-js@2";
import { enrichSingleEvent } from "../_shared/enrichEvent.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth: verify user JWT (any authenticated user can enrich)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: missing Authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use service role to read/write events (bypasses RLS for synced events)
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify the user token is valid
    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const {
      data: { user },
      error: authError,
    } = await anonClient.auth.getUser(authHeader.slice(7));
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { eventId, regenerate } = await req.json();
    if (!eventId) {
      return new Response(JSON.stringify({ error: "eventId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiDescription = await enrichSingleEvent(
      supabase,
      eventId,
      regenerate ?? false
    );

    if (!aiDescription) {
      return new Response(
        JSON.stringify({ error: "Failed to enrich event" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ aiDescription }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("enrich-event-description error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
