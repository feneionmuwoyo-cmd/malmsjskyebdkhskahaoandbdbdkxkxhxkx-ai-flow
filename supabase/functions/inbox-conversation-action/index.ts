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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: auth } = await userClient.auth.getUser();
    if (!auth.user) return json({ error: "unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const conversationId = typeof body.conversation_id === "string" ? body.conversation_id : "";
    const action = typeof body.action === "string" ? body.action : "";
    if (!conversationId || !["take_over", "resume_ai", "assign", "unassign", "change_status", "change_priority", "mark_read"].includes(action)) {
      return json({ error: "invalid_request" }, 400);
    }

    const { data: conversation, error: conversationError } = await admin
      .from("inbox_conversations")
      .select("id, workspace_id, assigned_user_id, status, mode, priority")
      .eq("id", conversationId)
      .maybeSingle();
    if (conversationError || !conversation?.workspace_id) return json({ error: "conversation_not_found" }, 404);

    const permission = action === "assign" || action === "unassign" ? "inbox.assign" : action === "mark_read" ? "inbox.view" : action === "change_status" ? "inbox.close" : "inbox.takeover";
    const { data: allowed, error: permissionError } = await admin.rpc("has_workspace_permission", {
      p_workspace_id: conversation.workspace_id,
      p_permission: permission,
      p_user_id: auth.user.id,
    });
    if (permissionError || !allowed) return json({ error: "forbidden" }, 403);

    if (action === "mark_read") {
      const messageId = typeof body.message_id === "string" ? body.message_id : null;
      await admin.from("conversation_reads").upsert({ workspace_id: conversation.workspace_id, conversation_id: conversationId, user_id: auth.user.id, last_read_message_id: messageId, last_read_at: new Date().toISOString() }, { onConflict: "conversation_id,user_id" });
      return json({ ok: true });
    }

    const updates: Record<string, unknown> = {};
    let eventType = action;
    if (action === "take_over") {
      updates.mode = "human";
      updates.assigned_user_id = auth.user.id;
      updates.assigned_to = auth.user.id;
      eventType = "human_takeover";
    } else if (action === "resume_ai") {
      updates.mode = "ai";
      eventType = "ai_resumed";
    } else if (action === "assign") {
      const assignedUserId = typeof body.assigned_user_id === "string" ? body.assigned_user_id : null;
      if (assignedUserId) {
        const { data: member } = await admin.from("workspace_members").select("user_id").eq("workspace_id", conversation.workspace_id).eq("user_id", assignedUserId).maybeSingle();
        if (!member) return json({ error: "assignee_not_in_workspace" }, 400);
      }
      updates.assigned_user_id = assignedUserId;
      updates.assigned_to = assignedUserId;
      eventType = assignedUserId ? "assigned" : "unassigned";
    } else if (action === "unassign") {
      updates.assigned_user_id = null;
      updates.assigned_to = null;
      eventType = "unassigned";
    } else if (action === "change_status") {
      if (!["open", "pending", "resolved", "closed"].includes(body.status)) return json({ error: "invalid_status" }, 400);
      updates.status = body.status;
      updates.closed_at = ["resolved", "closed"].includes(body.status) ? new Date().toISOString() : null;
      eventType = "status_changed";
    } else if (action === "change_priority") {
      if (!["low", "normal", "high", "urgent"].includes(body.priority)) return json({ error: "invalid_priority" }, 400);
      updates.priority = body.priority;
      eventType = "priority_changed";
    }

    const { data: updated, error: updateError } = await admin.from("inbox_conversations").update(updates).eq("id", conversationId).select().single();
    if (updateError) return json({ error: "conversation_update_failed" }, 500);

    await admin.from("conversation_events").insert({
      workspace_id: conversation.workspace_id,
      conversation_id: conversationId,
      event_type: eventType,
      actor_type: "user",
      actor_id: auth.user.id,
      metadata: { action, changes: updates },
    });

    if ((action === "assign" || action === "take_over") && updates.assigned_user_id && updates.assigned_user_id !== auth.user.id) {
      await admin.from("notifications").insert({
        user_id: updates.assigned_user_id,
        workspace_id: conversation.workspace_id,
        title: "Conversa atribuída",
        message: "Uma conversa foi atribuída a você.",
        type: "inbox_assigned",
        link: `/inbox?conversation=${conversationId}`,
      });
    }
    return json({ ok: true, conversation: updated });
  } catch (error) {
    console.error("inbox-conversation-action error", error);
    return json({ error: "internal_error" }, 500);
  }
});
