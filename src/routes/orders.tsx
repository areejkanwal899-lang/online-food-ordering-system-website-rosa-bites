import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Package } from "lucide-react";

const TRACK_STEPS = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered"];

function Tracker({ status }: { status: string }) {
  if (status === "cancelled") {
    return <div className="mt-4 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">Order cancelled</div>;
  }
  const current = Math.max(0, TRACK_STEPS.indexOf(status));
  return (
    <div className="mt-4 flex items-center gap-1">
      {TRACK_STEPS.map((step, i) => (
        <div key={step} className="flex flex-1 flex-col items-center">
          <div className="flex w-full items-center">
            {i > 0 && <div className={`h-1 flex-1 ${i <= current ? "bg-primary" : "bg-muted"}`} />}
            <div className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
              i <= current ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>{i + 1}</div>
            {i < TRACK_STEPS.length - 1 && <div className={`h-1 flex-1 ${i < current ? "bg-primary" : "bg-muted"}`} />}
          </div>
          <span className={`mt-1 text-[10px] font-semibold uppercase ${i <= current ? "text-primary" : "text-muted-foreground"}`}>
            {step.replace(/_/g, " ")}
          </span>
        </div>
      ))}
    </div>
  );
}

type OrderRow = {
  id: string;
  status: string;
  total: number;
  delivery_address: string;
  phone: string;
  created_at: string;
  order_items: { id: string; item_name: string; quantity: number; unit_price: number }[];
};

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "My Orders — Rosa Bites" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth" }); return; }
    supabase
      .from("orders")
      .select("id,status,total,delivery_address,phone,created_at, order_items(id,item_name,quantity,unit_price)")
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders((data as any) ?? []));
  }, [user, loading, navigate]);

  if (loading || orders === null) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-secondary text-primary">
          <Package className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-3xl font-bold">No orders yet</h1>
        <p className="mt-2 text-muted-foreground">Place your first order to see it here.</p>
        <Link to="/menu" className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl font-extrabold">My Orders</h1>
      <ul className="mt-8 space-y-4">
        {orders.map((o) => (
          <li key={o.id} className="rounded-2xl bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Order #{o.id.slice(0, 8)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {new Date(o.created_at).toLocaleString()}
                </div>
              </div>
              <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
                {o.status.replace(/_/g, " ")}
              </span>
            </div>
            <Tracker status={o.status} />
            <ul className="mt-4 space-y-1 text-sm">
              {o.order_items.map((it) => (
                <li key={it.id} className="flex justify-between text-foreground">
                  <span>{it.item_name} × {it.quantity}</span>
                  <span className="text-muted-foreground">Rs. {Number(it.unit_price) * it.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
              <div className="text-xs text-muted-foreground">
                📍 {o.delivery_address} · 📞 {o.phone}
              </div>
              <div className="text-lg font-extrabold text-primary">Rs. {Number(o.total)}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}