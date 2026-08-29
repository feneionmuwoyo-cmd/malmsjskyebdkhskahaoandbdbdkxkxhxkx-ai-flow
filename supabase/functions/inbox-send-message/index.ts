import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } } });
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: auth } = await userClient.auth.getUser();
    if (!auth.user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const conversationId = typeof body.conversation_id === "string" ? body.conversation_id : "";
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!conversationId || !text || text.length > 4000) return json({ error: "conversation_and_text_required" }, 400);

    const { data: conversation } = await admin.from("inbox_conversations").select("id,workspace_id,phone_number,whatsapp_instance_name,status").eq("id", conversationId).maybeSingle();
    if (!conversation?.workspace_id || conversation.status === "closed") return json({ error: "conversation_unavailable" }, 404);
    const { data: allowed } = await admin.rpc("has_workspace_permission", { p_workspace_id: conversation.workspace_id, p_permission: "inbox.reply", p_user_id: auth.user.id });
    if (!allowed) return json({ error: "forbidden" }, 403);
    if (!conversation.whatsapp_instance_name) return json({ error: "whatsapp_instance_missing" }, 409);

    const { data: instance } = await admin.from("instances").select("instance_name,workspace_id,status").eq("instance_name", conversation.whatsapp_instance_name).eq("workspace_id", conversation.workspace_id).maybeSingle();
    if (!instance) return json({ error: "whatsapp_instance_missing" }, 409);

    const { data: pending, error: insertError } = await admin.from("messages").insert({
      user_id: auth.user.id,
      workspace_id: conversation.workspace_id,
      conversation_id: conversationId,
      phone_number: conversation.phone_number,
      whatsapp_instance_id: instance.instance_name,
      direction: "outbound",
      sender_type: "user",
      sender_user_id: auth.user.id,
      message_type: "text",
      kind: "text",
      message_text: text,
      status: "pending",
      sent_at: new Date().toISOString(),
    }).select("id,created_at,status,message_text").single();
    if (insertError || !pending) return json({ error: "message_persist_failed" }, 500);

    const evolutionUrl = (Deno.env.get("EVOLUTION_API_URL") || "https://api.muwoyo.com").replace(/\/+$/, "");
    const response = await fetch(`${evolutionUrl}/message/sendText/${encodeURIComponent(instance.instance_name)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: Deno.env.get("EVOLUTION_API_KEY") || "" },
      body: JSON.stringify({ number: conversation.phone_number, text }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      await admin.from("messages").update({ status: "failed" }).eq("id", pending.id);
      return json({ error: "message_send_failed", message_id: pending.id }, 502);
    }

    const externalId = result?.key?.id || result?.message?.key?.id || null;
    const { data: sent, error: updateError } = await admin.from("messages").update({ status: "sent", external_id: externalId }).eq("id", pending.id).select().single();
    if (updateError) return json({ error: "message_status_update_failed", message_id: pending.id }, 500);
    await admin.from("inbox_conversations").update({ last_message_at: new Date().toISOString(), last_message_preview: text.slice(0, 240), last_message_direction: "outbound", last_message_id: pending.id }).eq("id", conversationId);
    await admin.from("conversation_events").insert({ workspace_id: conversation.workspace_id, conversation_id: conversationId, event_type: "message_sent", actor_type: "user", actor_id: auth.user.id, metadata: { message_id: pending.id } });
    return json({ ok: true, message: sent });
  } catch (error) {
    console.error("inbox-send-message error", error);
    return json({ error: "internal_error" }, 500);
  }
});
