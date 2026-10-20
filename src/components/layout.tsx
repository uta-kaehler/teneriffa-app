import { Link, useLocation } from "wouter";
import { Compass, Map, PenLine, BookOpen, Menu, Mountain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/heute", label: "Heute", icon: Compass, match: (p: string) => p === "/heute" || p.startsWith("/light") },
    { href: "/", label: "Karte", icon: Map, match: (p: string) => p === "/" || p.startsWith("/karte") },
    { href: "/vibe", label: "Schreiben", icon: PenLine, match: (p: string) => p.startsWith("/vibe") },
    { href: "/logbuch", label: "Logbuch", icon: BookOpen, match: (p: string) => p.startsWith("/logbuch") },
    { href: "/ausfluege", label: "Touren", icon: Mountain, match: (p: string) => p.startsWith("/ausfluege") },
    { href: "/mehr", label: "Mehr", icon: Menu, match: (p: string) => p.startsWith("/mehr") || p.startsWith("/guachinches") },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col w-full max-w-md mx-auto border-x border-border/40 bg-background relative shadow-2xl">
      <main className="flex-1 overflow-y-auto pb-24 scroll-smooth">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 w-full max-w-md bg-background border-t border-border/50 px-2 py-3 flex justify-between items-center z-[1100]">
        {navItems.map((item) => {
          const isActive = item.match(location);
          return (
            <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-1 group flex-1">
              <item.icon
                size={20}
                strokeWidth={isActive ? 2 : 1.5}
                className={`transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}
              />
              <span className={`text-[9px] uppercase tracking-widest transition-colors duration-300 ${isActive ? 'text-primary font-medium' : 'text-muted-foreground group-hover:text-foreground'}`}>
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-4 w-1 h-1 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
