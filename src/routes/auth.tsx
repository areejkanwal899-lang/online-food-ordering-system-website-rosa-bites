import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign in — Rosa Bites" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Account created! Welcome 🌸");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div
        className="mx-auto grid h-14 w-14 place-items-center rounded-full text-primary-foreground"
        style={{ background: "var(--gradient-primary)" }}
      >
        <UtensilsCrossed className="h-6 w-6" />
      </div>
      <h1 className="mt-4 text-center text-3xl font-extrabold text-foreground">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "Sign in to track your orders." : "Sign up in seconds — no email confirmation needed."}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl bg-card p-6 shadow-sm">
        {mode === "signup" && (
          <label className="block">
            <span className="text-sm font-semibold">Full name</span>
            <input
              value={name} onChange={(e) => setName(e.target.value)} required
              className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        )}
        <label className="block">
          <span className="text-sm font-semibold">Email</span>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">Password</span>
          <input
            type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}
            className="mt-1 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm outline-none focus:border-primary"
          />
        </label>
        <button
          type="submit" disabled={loading}
          className="w-full rounded-full px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          style={{ background: "var(--gradient-primary)" }}
        >
          {loading ? "Please wait..." : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="mt-4 text-center text-sm text-muted-foreground hover:text-primary"
      >
        {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}