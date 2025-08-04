import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Truck, Menu, Bell, LogOut } from "lucide-react";

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout fails
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2" onClick={() => window.location.href = '/'} style={{ cursor: 'pointer' }}>
            <div className="transport-gradient p-2 rounded-lg">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-transport-primary">CargoFlow</h1>
              <p className="text-xs text-muted-foreground">Professional Transport</p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {!isAuthenticated && (
            <>
              <a href="#services" className="text-sm font-medium hover:text-action-primary transition-smooth">
                Services
              </a>
              <a href="#about" className="text-sm font-medium hover:text-action-primary transition-smooth">
                About
              </a>
              <a href="#contact" className="text-sm font-medium hover:text-action-primary transition-smooth">
                Contact
              </a>
            </>
          )}
          {isAuthenticated && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-600">Welcome back,</span>
              <span className="text-sm font-medium text-transport-primary">{user?.firstName}</span>
              <span className="text-xs bg-action-light text-action-primary px-2 py-1 rounded-full capitalize">
                {user?.userType}
              </span>
            </div>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-3">
          {!isAuthenticated ? (
            <>
              <Button 
                variant="outline-action" 
                size="sm" 
                className="hidden sm:inline-flex"
                onClick={() => window.location.href = '/signin'}
              >
                Sign In
              </Button>
              <Button 
                variant="action" 
                size="sm"
                onClick={() => window.location.href = '/signin'}
              >
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
                <Bell className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </>
          )}
          
          {/* Mobile Menu */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;