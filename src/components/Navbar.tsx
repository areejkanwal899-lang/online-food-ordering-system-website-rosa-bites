import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, UtensilsCrossed, User, LogOut } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { count } = useCart();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div
            className="grid h-10 w-10 place-items-center rounded-full text-primary-foreground"
            style={{ background: "var(--gradient-primary)" }}
          >
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-primary">Rosa Bites</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-foreground/80 hover:text-primary">Home</Link>
          <Link to="/menu" className="text-sm font-medium text-foreground/80 hover:text-primary">Menu</Link>
          {user && (
            <Link to="/orders" className="text-sm font-medium text-foreground/80 hover:text-primary">My Orders</Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm font-bold text-primary hover:opacity-80">Admin</Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-accent"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-primary-foreground">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate({ to: "/" });
              }}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-accent"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              style={{ background: "var(--gradient-primary)" }}
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}