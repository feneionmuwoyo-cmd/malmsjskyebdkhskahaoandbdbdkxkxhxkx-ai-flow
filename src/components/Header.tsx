import { Link } from "@tanstack/react-router";
import logo from "@/assets/feneion-logo.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function Header() {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="glass">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 md:h-24">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="feneion"
              className="h-12 w-auto md:h-16"
              draggable={false}
            />
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            {!loading && user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">Dashboard</Button>
                </Link>
                <Button variant="outline" size="sm" onClick={signOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/login">
                  <Button size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow">
                    Get started
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
