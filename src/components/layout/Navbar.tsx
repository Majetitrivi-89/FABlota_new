import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ShoppingCart, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import NotificationBell from "@/components/notifications/NotificationBell";
const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, signOut, isLoading } = useAuth();
  const { cartCount } = useCart();
  const appType = import.meta.env.VITE_APP_TYPE;

  const isLoggedIn = !!user;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = isLoggedIn
    ? userRole === "manufacturer"
      ? [
          { href: "/manufacturer", label: "Products" },
          { href: "/manufacturer/orders", label: "Orders" },
        ]
      : [
          { href: "/shop", label: "Shop" },
          { href: "/brand-builder", label: "Build Brand" },
          { href: "/orders", label: "Orders" },
        ]
    : [
        { href: "/#features", label: "Features" },
        { href: "/#how-it-works", label: "How It Works" },
        { href: "/#categories", label: "Categories" },
      ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <nav className="glass-card border-b border-border/30">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="relative">
                <span className="font-serif text-2xl font-bold text-gradient-gold">
                  FABlota
                </span>
                <span className="absolute -bottom-1 left-0 text-[8px] tracking-widest text-muted-foreground">
                  FASHION OF ALL BRANDS
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    location.pathname === link.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-4">
              {isLoading ? (
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : isLoggedIn ? (
                <>
                  <NotificationBell />
                  {userRole === "retailer" && (
                    <Link to="/cart" className="relative">
                      <Button variant="ghost" size="icon">
                        <ShoppingCart className="h-5 w-5" />
                      </Button>
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  )}
                  <Link to="/profile">
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  {(!appType || appType === 'retailer') && (
                    <>
                      <Link to="/retailer/login"><Button variant="ghost">Login</Button></Link>
                      <Link to="/retailer/signup"><Button variant="hero">Get Started</Button></Link>
                    </>
                  )}
                  {appType === 'manufacturer' && (
                    <>
                      <Link to="/manufacturer/login"><Button variant="ghost">Login</Button></Link>
                      <Link to="/manufacturer/signup"><Button variant="hero">Get Started</Button></Link>
                    </>
                  )}
                  {appType === 'admin' && (
                    <Link to="/super-admin"><Button variant="ghost">Admin Panel</Button></Link>
                  )}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 text-foreground"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border/30"
            >
              <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={cn(
                      "text-sm font-medium py-2 transition-colors",
                      location.pathname === link.href
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-border/30">
                  {isLoggedIn ? (
                    <>
                      {userRole === "retailer" && (
                        <Link to="/cart" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full justify-start">
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Cart ({cartCount})
                          </Button>
                        </Link>
                      )}
                      <Button variant="outline" onClick={handleLogout} className="w-full">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <>
                      {(!appType || appType === 'retailer') && (
                        <>
                          <Link to="/retailer/login" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full">Login</Button>
                          </Link>
                          <Link to="/retailer/signup" onClick={() => setIsOpen(false)}>
                            <Button variant="hero" className="w-full">Get Started</Button>
                          </Link>
                        </>
                      )}
                      {appType === 'manufacturer' && (
                        <>
                          <Link to="/manufacturer/login" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full">Login</Button>
                          </Link>
                          <Link to="/manufacturer/signup" onClick={() => setIsOpen(false)}>
                            <Button variant="hero" className="w-full">Get Started</Button>
                          </Link>
                        </>
                      )}
                      {appType === 'admin' && (
                        <Link to="/super-admin" onClick={() => setIsOpen(false)}>
                          <Button variant="ghost" className="w-full">Admin Panel</Button>
                        </Link>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;
