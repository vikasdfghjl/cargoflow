import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'customer' | 'admin';
}

const ProtectedRoute = ({ children, requiredUserType }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return;

    if (!isAuthenticated) {
      // Redirect to sign in if not authenticated
      navigate('/signin');
      return;
    }

    if (requiredUserType && user?.userType !== requiredUserType) {
      // Redirect to correct dashboard if user type doesn't match
      if (user?.userType === 'admin') {
        navigate('/admin');
      } else {
        navigate('/customer');
      }
      return;
    }
  }, [isAuthenticated, user, requiredUserType, navigate, loading]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while checking authentication
  if (!isAuthenticated) {
    return null;
  }

  // Don't render if user type doesn't match requirement
  if (requiredUserType && user?.userType !== requiredUserType) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
