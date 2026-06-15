import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — Rosa Bites" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, total } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div
          className="mx-auto grid h-20 w-20 place-items-center rounded-full text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          <ShoppingBag className="h-9 w-9" />
        </div>
        <h1 className="mt-6 text-3xl font-bold text-foreground">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">Pick something delicious from our menu.</p>
        <Link
          to="/menu"
          className="mt-6 inline-block rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground"
          style={{ background: "var(--gradient-primary)" }}
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl font-extrabold text-foreground">Your Cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr,360px]">
        <ul className="space-y-4">
          {items.map((it) => (
            <li key={it.id} className="flex gap-4 rounded-2xl bg-card p-4 shadow-sm">
              <img src={it.image_url ?? ""} alt={it.name} className="h-24 w-24 rounded-xl object-cover" />
              <div className="flex flex-1 flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-foreground">{it.name}</h3>
                    <p className="text-sm text-primary">Rs. {it.price}</p>
                  </div>
                  <button onClick={() => remove(it.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary p-1">
                    <button
                      onClick={() => setQty(it.id, it.quantity - 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-background text-primary"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{it.quantity}</span>
                    <button
                      onClick={() => setQty(it.id, it.quantity + 1)}
                      className="grid h-7 w-7 place-items-center rounded-full bg-background text-primary"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="font-bold text-foreground">Rs. {it.price * it.quantity}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl bg-card p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground">Order Summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>Rs. {total}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Delivery</span><span>{total >= 1000 ? "Free" : "Rs. 99"}</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-extrabold text-foreground">
            <span>Total</span><span className="text-primary">Rs. {total >= 1000 ? total : total + 99}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-6 block w-full rounded-full px-6 py-3 text-center text-sm font-semibold text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            Proceed to Checkout
          </Link>
        </aside>
      </div>
    </div>
  );
}