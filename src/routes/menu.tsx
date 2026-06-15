import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

const menuQO = queryOptions({
  queryKey: ["menu-all"],
  queryFn: async () => {
    const [cats, items] = await Promise.all([
      supabase.from("categories").select("id,name").order("sort_order"),
      supabase.from("menu_items").select("id,name,description,price,image_url,category_id").eq("is_available", true),
    ]);
    if (cats.error) throw cats.error;
    if (items.error) throw items.error;
    return { categories: cats.data, items: items.data };
  },
});

export const Route = createFileRoute("/menu")({
  validateSearch: z.object({ category: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Menu — Rosa Bites" },
      { name: "description", content: "Browse our full menu of pizzas, burgers, biryani, desserts and drinks." },
      { property: "og:title", content: "Menu — Rosa Bites" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(menuQO),
  errorComponent: ({ error }) => <div className="p-10 text-center text-destructive">{error.message}</div>,
  component: MenuPage,
});

function MenuPage() {
  const { data } = useSuspenseQuery(menuQO);
  const { category } = Route.useSearch();
  const { add } = useCart();

  const filtered = category ? data.items.filter((i) => i.category_id === category) : data.items;
  const activeCat = data.categories.find((c) => c.id === category);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-4xl font-extrabold text-foreground">Our Menu</h1>
      <p className="mt-2 text-muted-foreground">
        {activeCat ? `Showing ${activeCat.name}` : "Everything we cook, all in one place."}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          to="/menu"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            !category ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
          }`}
        >
          All
        </Link>
        {data.categories.map((c) => (
          <Link
            key={c.id}
            to="/menu"
            search={{ category: c.id }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              category === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-3xl bg-card shadow-sm transition hover:shadow-xl">
            <div className="aspect-[4/3] overflow-hidden">
              <img src={item.image_url ?? ""} alt={item.name} className="h-full w-full object-cover" />
            </div>
            <div className="p-5">
              <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xl font-extrabold text-primary">Rs. {item.price}</span>
                <button
                  onClick={() => {
                    add({ id: item.id, name: item.name, price: Number(item.price), image_url: item.image_url });
                    toast.success(`${item.name} added`);
                  }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <ShoppingBag className="h-4 w-4" /> Add
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}