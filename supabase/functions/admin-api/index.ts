import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, table, data, filters, id } = await req.json();

    if (!action || !table) {
      return new Response(
        JSON.stringify({ error: "Missing action or table" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result;

    switch (action) {
      case "select": {
        let query = supabase.from(table).select(data || "*");
        if (filters) {
          for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined && value !== null) {
              query = query.eq(key, value);
            }
          }
        }
        if (table === "orders") {
          query = query.order("created_at", { ascending: false });
        } else if (table === "audit_log") {
          query = query.order("created_at", { ascending: false }).limit(100);
        }
        const { data: rows, error } = await query;
        if (error) throw error;
        result = rows;
        break;
      }

      case "insert": {
        const { data: inserted, error } = await supabase
          .from(table)
          .insert(data)
          .select()
          .single();
        if (error) throw error;
        result = inserted;
        break;
      }

      case "update": {
        if (!id) throw new Error("ID required for update");
        const { data: updated, error } = await supabase
          .from(table)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        result = updated;
        break;
      }

      case "delete": {
        if (!id) throw new Error("ID required for delete");
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("id", id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case "updateOrderStatus": {
        if (!id) throw new Error("ID required");
        const { status, changed_by } = data;
        const { data: order, error: fetchErr } = await supabase
          .from("orders")
          .select("status_history")
          .eq("id", id)
          .maybeSingle();
        if (fetchErr) throw fetchErr;

        const history = Array.isArray(order?.status_history) ? order.status_history : [];
        const newEntry = {
          status,
          changed_at: new Date().toISOString(),
          changed_by: changed_by || "Admin",
        };

        const { data: updatedOrder, error: updateErr } = await supabase
          .from("orders")
          .update({
            status,
            status_history: [...history, newEntry],
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();
        if (updateErr) throw updateErr;
        result = updatedOrder;
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin API error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
