import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Package, UtensilsCrossed, Tag } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Rosa Bites" }] }),
  component: AdminPage,
});

type Category = { id: string; name: string; image_url: string | null; sort_order: number };
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_featured: boolean;
  is_available: boolean;
};
type Order = {
  id: string;
  user_id: string;
  status: string;
  total: number;
  delivery_address: string;
  phone: string;
  notes: string | null;
  created_at: string;
  order_items: { id: string; item_name: string; quantity: number; unit_price: number }[];
};

const STATUSES = ["pending", "confirmed", "preparing", "out_for_delivery", "delivered", "cancelled"];

function AdminPage() {
  const { user, loading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"orders" | "menu" | "categories">("orders");

  useEffect(() => {
    if (loading || roleLoading) return;
    if (!user) navigate({ to: "/auth" });
  }, [user, loading, roleLoading, navigate]);

  if (loading || roleLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!user) return null;
  if (!isAdmin)
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">Not authorized</h1>
        <p className="mt-2 text-muted-foreground">You need admin access to view this page.</p>
        <p className="mt-4 text-xs text-muted-foreground">
          Your user id: <code className="rounded bg-muted px-2 py-1">{user.id}</code>
          <br />Add it to the <code>user_roles</code> table with role <code>admin</code>.
        </p>
        <Link to="/" className="mt-6 inline-block text-primary hover:underline">Back home</Link>
      </div>
    );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-4xl font-extrabold">Admin Panel</h1>
      <p className="mt-1 text-muted-foreground">Manage menu, categories, and track deliveries.</p>
      <div className="mt-6 flex gap-2 border-b border-border">
        {[
          { id: "orders" as const, label: "Orders", icon: Package },
          { id: "menu" as const, label: "Menu Items", icon: UtensilsCrossed },
          { id: "categories" as const, label: "Categories", icon: Tag },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        {tab === "orders" && <OrdersAdmin />}
        {tab === "menu" && <MenuAdmin />}
        {tab === "categories" && <CategoriesAdmin />}
      </div>
    </div>
  );
}

/* ---------- Orders ---------- */
function OrdersAdmin() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id,user_id,status,total,delivery_address,phone,notes,created_at, order_items(id,item_name,quantity,unit_price)")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setOrders((data as any) ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    load();
  }

  if (orders === null) return <div className="text-muted-foreground">Loading orders…</div>;
  if (orders.length === 0) return <div className="text-muted-foreground">No orders yet.</div>;

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id} className="rounded-2xl bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Order #{o.id.slice(0, 8)}</div>
              <div className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
              <div className="mt-1 text-sm">📞 {o.phone} · 📍 {o.delivery_address}</div>
              {o.notes && <div className="mt-1 text-xs text-muted-foreground">Note: {o.notes}</div>}
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold text-primary">Rs. {Number(o.total)}</div>
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                className="mt-2 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-semibold uppercase"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
          </div>
          <ul className="mt-4 space-y-1 text-sm">
            {o.order_items.map((it) => (
              <li key={it.id} className="flex justify-between text-foreground">
                <span>{it.item_name} × {it.quantity}</span>
                <span className="text-muted-foreground">Rs. {Number(it.unit_price) * it.quantity}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

/* ---------- Menu Items ---------- */
const EMPTY_ITEM: Omit<MenuItem, "id"> = {
  name: "", description: "", price: 0, image_url: "", category_id: null, is_featured: false, is_available: true,
};

function MenuAdmin() {
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [editing, setEditing] = useState<(Partial<MenuItem> & { id?: string }) | null>(null);

  const load = useCallback(async () => {
    const [{ data: i }, { data: c }] = await Promise.all([
      supabase.from("menu_items").select("*").order("name"),
      supabase.from("categories").select("*").order("sort_order"),
    ]);
    setItems((i as any) ?? []);
    setCats((c as any) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!editing) return;
    const payload = {
      name: editing.name ?? "",
      description: editing.description || null,
      price: Number(editing.price ?? 0),
      image_url: editing.image_url || null,
      category_id: editing.category_id || null,
      is_featured: !!editing.is_featured,
      is_available: editing.is_available !== false,
    };
    if (!payload.name) return toast.error("Name is required");
    const { error } = editing.id
      ? await supabase.from("menu_items").update(payload).eq("id", editing.id)
      : await supabase.from("menu_items").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this item?")) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  if (items === null) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setEditing({ ...EMPTY_ITEM })}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.id} className="overflow-hidden rounded-2xl bg-card shadow-sm">
            {it.image_url ? (
              <img src={it.image_url} alt={it.name} className="h-40 w-full object-cover" />
            ) : (
              <div className="grid h-40 w-full place-items-center bg-muted text-muted-foreground">No image</div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold">{it.name}</div>
                  <div className="text-sm text-primary font-semibold">Rs. {Number(it.price)}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditing(it)} className="rounded-full p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(it.id)} className="rounded-full p-2 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                {it.is_featured && <span className="rounded-full bg-accent px-2 py-0.5 font-semibold">Featured</span>}
                {!it.is_available && <span className="rounded-full bg-destructive/10 px-2 py-0.5 font-semibold text-destructive">Hidden</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Edit Item" : "Add Item"}>
          <div className="space-y-3">
            <TextField label="Name" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
            <TextField label="Description" value={editing.description ?? ""} onChange={(v) => setEditing({ ...editing, description: v })} textarea />
            <TextField label="Price (Rs.)" type="number" value={String(editing.price ?? 0)} onChange={(v) => setEditing({ ...editing, price: Number(v) })} />
            <TextField label="Image URL" value={editing.image_url ?? ""} onChange={(v) => setEditing({ ...editing, image_url: v })} />
            <label className="block">
              <span className="text-sm font-semibold">Category</span>
              <select
                value={editing.category_id ?? ""}
                onChange={(e) => setEditing({ ...editing, category_id: e.target.value || null })}
                className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
              >
                <option value="">— None —</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={!!editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_available !== false} onChange={(e) => setEditing({ ...editing, is_available: e.target.checked })} />
                Available
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-secondary">Cancel</button>
              <button onClick={save} className="rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Categories ---------- */
function CategoriesAdmin() {
  const [cats, setCats] = useState<Category[] | null>(null);
  const [editing, setEditing] = useState<(Partial<Category> & { id?: string }) | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCats((data as any) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!editing) return;
    const payload = {
      name: editing.name ?? "",
      image_url: editing.image_url || null,
      sort_order: Number(editing.sort_order ?? 0),
    };
    if (!payload.name) return toast.error("Name is required");
    const { error } = editing.id
      ? await supabase.from("categories").update(payload).eq("id", editing.id)
      : await supabase.from("categories").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category? Items in it will become uncategorized.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  }

  if (cats === null) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setEditing({ name: "", sort_order: cats.length })}
          className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>
      <ul className="space-y-2">
        {cats.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-xl bg-card p-4 shadow-sm">
            <div className="flex items-center gap-3">
              {c.image_url ? (
                <img src={c.image_url} alt={c.name} className="h-12 w-12 rounded-lg object-cover" />
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-muted text-xs text-muted-foreground">—</div>
              )}
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-xs text-muted-foreground">Sort: {c.sort_order}</div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing(c)} className="rounded-full p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
              <button onClick={() => remove(c.id)} className="rounded-full p-2 text-destructive hover:bg-secondary"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing.id ? "Edit Category" : "Add Category"}>
          <div className="space-y-3">
            <TextField label="Name" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} />
            <TextField label="Image URL" value={editing.image_url ?? ""} onChange={(v) => setEditing({ ...editing, image_url: v })} />
            <TextField label="Sort Order" type="number" value={String(editing.sort_order ?? 0)} onChange={(v) => setEditing({ ...editing, sort_order: Number(v) })} />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-secondary">Cancel</button>
              <button onClick={save} className="rounded-full px-5 py-2 text-sm font-semibold text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>Save</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ---------- Shared ---------- */
function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-xl font-bold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

function TextField({
  label, value, onChange, type = "text", textarea,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; textarea?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary"
        />
      )}
    </label>
  );
}