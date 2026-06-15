import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowRight, Clock, Truck, Star, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

const featuredQO = queryOptions({
  queryKey: ["featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id,name,description,price,image_url")
      .eq("is_featured", true)
      .limit(6);
    if (error) throw error;
    return data;
  },
});

const categoriesQO = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,image_url")
      .order("sort_order");
    if (error) throw error;
    return data;
  },
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rosa Bites — Fresh food, pink love, delivered" },
      { name: "description", content: "Order pizza, burgers, biryani and more from Rosa Bites. Fresh, fast and full of flavor." },
      { property: "og:title", content: "Rosa Bites — Fresh food, delivered" },
      { property: "og:description", content: "Order fresh meals online from Rosa Bites." },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(featuredQO),
      context.queryClient.ensureQueryData(categoriesQO),
    ]);
  },
  component: Index,
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-destructive">Failed to load: {error.message}</div>
  ),
});

function Index() {
  const { data: featured } = useSuspenseQuery(featuredQO);
  const { data: categories } = useSuspenseQuery(categoriesQO);
  const { add } = useCart();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center">
            <span className="w-fit rounded-full bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary animate-fade-up">
              Fresh · Fast · Pink
            </span>
            <h1 className="mt-4 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl animate-fade-up delay-100">
              Crave it. <span className="text-primary">Tap it.</span><br />We deliver it.
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground md:text-lg animate-fade-up delay-200">
              From sizzling burgers to royal biryani — hand-picked dishes, made fresh and delivered to your door in pink-perfect packaging.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 animate-fade-up delay-300">
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition hover:opacity-90"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-pink)" }}
              >
                Order Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/menu"
                className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-background px-6 py-3 text-sm font-semibold text-primary hover:bg-accent"
              >
                Browse Menu
              </Link>
            </div>
            <div className="mt-8 flex gap-6 text-sm text-muted-foreground animate-fade-up delay-400">
              <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> 30 min delivery</div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Free over Rs.1000</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> 4.9 rating</div>
            </div>
          </div>
          <div className="relative animate-scale-in delay-200">
            <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-pulse-pink" />
            <img
              src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900"
              alt="Delicious pizza"
              className="relative aspect-square w-full rounded-3xl object-cover shadow-2xl animate-float"
              style={{ boxShadow: "var(--shadow-pink)" }}
            />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Shop by Category</h2>
            <p className="mt-1 text-muted-foreground">Pick what you crave today.</p>
          </div>
          <Link to="/menu" className="hidden text-sm font-semibold text-primary hover:underline sm:inline">
            See full menu →
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {categories.map((c, i) => (
            <Link
              key={c.id}
              to="/menu"
              search={{ category: c.id }}
              className="group overflow-hidden rounded-2xl bg-card shadow-sm transition hover:shadow-lg hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={c.image_url ?? ""}
                  alt={c.name}
                  className="h-full w-full object-cover transition group-hover:scale-110"
                />
              </div>
              <div className="p-3 text-center text-sm font-semibold text-foreground">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <h2 className="text-3xl font-bold text-foreground">Featured Dishes</h2>
        <p className="mt-1 text-muted-foreground">Customer favorites — fresh out of our kitchen.</p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((item, i) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-3xl bg-card shadow-sm transition hover:shadow-xl hover:-translate-y-1 animate-fade-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img src={item.image_url ?? ""} alt={item.name} className="h-full w-full object-cover transition duration-500 hover:scale-110" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-foreground">{item.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xl font-extrabold text-primary">Rs. {item.price}</span>
                  <button
                    onClick={() => {
                      add({ id: item.id, name: item.name, price: Number(item.price), image_url: item.image_url });
                      toast.success(`${item.name} added to cart`);
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
      </section>
    </div>
  );
}
