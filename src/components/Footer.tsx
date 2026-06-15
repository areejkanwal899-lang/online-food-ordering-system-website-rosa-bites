import { Link } from "@tanstack/react-router";
import { UtensilsCrossed, Instagram, Facebook, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className="grid h-9 w-9 place-items-center rounded-full text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <UtensilsCrossed className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-primary">Rosa Bites</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Fresh, hot meals delivered to your door. Made with love in pink.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/" className="hover:text-primary">Home</Link></li>
            <li><Link to="/menu" className="hover:text-primary">Menu</Link></li>
            <li><Link to="/cart" className="hover:text-primary">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>hello@rosabites.com</li>
            <li>+92 300 1234567</li>
            <li>Mon–Sun · 11am – 11pm</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Follow</h4>
          <div className="mt-3 flex gap-3">
            <a href="#" className="grid h-9 w-9 place-items-center rounded-full bg-background text-primary hover:bg-accent"><Instagram className="h-4 w-4" /></a>
            <a href="#" className="grid h-9 w-9 place-items-center rounded-full bg-background text-primary hover:bg-accent"><Facebook className="h-4 w-4" /></a>
            <a href="#" className="grid h-9 w-9 place-items-center rounded-full bg-background text-primary hover:bg-accent"><Twitter className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Rosa Bites. All rights reserved.
      </div>
    </footer>
  );
}