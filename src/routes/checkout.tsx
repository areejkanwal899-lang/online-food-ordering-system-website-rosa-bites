import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Rosa Bites" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, total, clear } = useCart();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "" });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name,phone,address").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) setForm((f) => ({ ...f, name: data.full_name ?? "", phone: data.phone ?? "", address: data.address ?? "" }));
    });
  }, [user]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold text-foreground">Please sign in to checkout</h1>
        <p className="mt-2 text-muted-foreground">We need your account to track your order.</p>
        <Link
          to="/auth"
          className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link to="/menu" className="mt-4 inline-block text-primary hover:underline">Back to menu</Link>
      </div>
    );
  }

  const delivery = total >= 1000 ? 0 : 99;
  const grandTotal = total + delivery;

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!form.phone || !form.address) return toast.error("Phone and address required");
    setSubmitting(true);

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        total: grandTotal,
        delivery_address: form.address,
        phone: form.phone,
        notes: form.notes || null,
      })
      .select("id")
      .single();

    if (error || !order) {
      setSubmitting(false);
      return toast.error(error?.message ?? "Failed to place order");
    }

    const orderItems = items.map((it) => ({
      order_id: order.id,
      menu_item_id: it.id,
      item_name: it.name,
      quantity: it.quantity,
      unit_price: it.price,
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) {
      setSubmitting(false);
      return toast.error(itemsErr.message);
    }

    await supabase.from("profiles").update({ full_name: form.name, phone: form.phone, address: form.address }).eq("id", user.id);

    clear();
    toast.success("Order placed! 🎉");
    navigate({ to: "/orders" });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-extrabold text-foreground">Checkout</h1>
      <form onSubmit={placeOrder} className="mt-8 grid gap-8 lg:grid-cols-[1fr,360px]">
        <div className="space-y-4 rounded-3xl bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold">Delivery Details</h2>
          <Field label="Full Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
          <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} required textarea />
          <Field label="Notes (optional)" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} textarea />
        </div>

        <aside className="h-fit rounded-3xl bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold">Summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((it) => (
              <li key={it.id} className="flex justify-between text-muted-foreground">
                <span>{it.name} × {it.quantity}</span>
                <span>Rs. {it.price * it.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>Subtotal</span><span>Rs. {total}</span></div>
            <div className="flex justify-between"><span>Delivery</span><span>{delivery === 0 ? "Free" : `Rs. ${delivery}`}</span></div>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-lg font-extrabold">
            <span>Total</span><span className="text-primary">Rs. {grandTotal}</span>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            style={{ background: "var(--gradient-primary)" }}
          >
            {submitting ? "Placing..." : "Place Order"}
          </button>
          <p className="mt-2 text-center text-xs text-muted-foreground">Cash on Delivery</p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label, value, onChange, required, textarea,
}: { label: string; value: string; onChange: (v: string) => void; required?: boolean; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-foreground">{label}{required && <span className="text-primary"> *</span>}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={3}
          className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      )}
    </label>
  );
}