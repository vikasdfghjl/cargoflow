import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  User, 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  Truck,
  Package,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

const SignIn = () => {
  const navigate = useNavigate();
  const { login, register, loading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  const [userType, setUserType] = useState<"customer" | "admin">("customer");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    companyName: "",
    phone: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      return;
    }

    try {
      await login(formData.email, formData.password);
      
      // Redirect based on user type will be handled by ProtectedRoute
      // The user object will contain the userType
      navigate("/customer"); // Default redirect, will be corrected by ProtectedRoute
    } catch (error) {
      // Error is handled by AuthContext
      console.error("Sign in failed:", error);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      // You might want to add a specific error for this
      return;
    }

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        userType,
        companyName: formData.companyName || undefined,
        phone: formData.phone || undefined,
      });
      
      // Redirect based on user type
      if (userType === "admin") {
        navigate("/admin");
      } else {
        navigate("/customer");
      }
    } catch (error) {
      // Error is handled by AuthContext
      console.error("Sign up failed:", error);
    }
  };

  const userTypeOptions = [
    {
      type: "customer" as const,
      title: "Business Customer",
      description: "Book deliveries, track packages, and manage your logistics",
      icon: Package,
      features: ["Book deliveries", "Track packages", "Manage invoices", "View driver info"]
    },
    {
      type: "admin" as const,
      title: "Admin Panel",
      description: "Manage operations, customers, drivers, and analytics",
      icon: Shield,
      features: ["Manage bookings", "Driver management", "Customer analytics", "Financial reports"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="py-12 bg-gradient-to-br from-neutral-50 to-transport-accent-light">
          <div className="container">
            <div className="max-w-4xl mx-auto">
              {/* Header Section */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-transport-accent-light text-transport-primary text-sm font-medium mb-4">
                  <User className="h-4 w-4 mr-2" />
                  Access Portal
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-transport-primary mb-4">
                  Welcome to CargoFlow
                </h1>
                <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                  Sign in to access your dashboard or create a new account to get started with our logistics platform
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 items-start">
                {/* User Type Selection */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-transport-primary mb-4">Choose Your Portal</h3>
                  {userTypeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = userType === option.type;
                    
                    return (
                      <Card 
                        key={option.type}
                        className={`cursor-pointer transition-smooth ${
                          isSelected 
                            ? "ring-2 ring-action-primary shadow-transport-elevated border-action-primary" 
                            : "hover:shadow-transport-elevated border-neutral-200"
                        }`}
                        onClick={() => setUserType(option.type)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`p-3 rounded-lg ${
                              isSelected ? "bg-action-primary" : "bg-transport-accent-light"
                            }`}>
                              <Icon className={`h-6 w-6 ${
                                isSelected ? "text-white" : "text-transport-primary"
                              }`} />
                            </div>
                            
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-transport-primary mb-2">
                                {option.title}
                              </h4>
                              <p className="text-neutral-600 mb-3">
                                {option.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {option.features.map((feature, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Authentication Forms */}
                <Card className="shadow-transport-elevated">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <div className="transport-gradient p-2 rounded-lg">
                        <Truck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-transport-primary">
                          {userType === "admin" ? "Admin Access" : "Customer Portal"}
                        </CardTitle>
                        <p className="text-sm text-neutral-600">
                          {userType === "admin" ? "Administrative dashboard access" : "Business customer dashboard"}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="signin">Sign In</TabsTrigger>
                        <TabsTrigger value="signup">Sign Up</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="signin" className="space-y-4 mt-6">
                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        
                        <form onSubmit={handleSignIn} className="space-y-4">
                          <div>
                            <Label htmlFor="signin-email">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                              <Input
                                id="signin-email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                className="pl-10"
                                required
                                disabled={loading}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="signin-password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                              <Input
                                id="signin-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={formData.password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                                className="pl-10 pr-10"
                                required
                                disabled={loading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                disabled={loading}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center space-x-2">
                              <input type="checkbox" className="rounded" disabled={loading} />
                              <span className="text-neutral-600">Remember me</span>
                            </label>
                            <a href="#" className="text-action-primary hover:underline">
                              Forgot password?
                            </a>
                          </div>
                          
                          <Button type="submit" variant="action" className="w-full" disabled={loading}>
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Signing In...
                              </>
                            ) : (
                              `Sign In to ${userType === "admin" ? "Admin Panel" : "Customer Portal"}`
                            )}
                          </Button>
                        </form>
                      </TabsContent>
                      
                      <TabsContent value="signup" className="space-y-4 mt-6">
                        {error && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                          </Alert>
                        )}
                        
                        <form onSubmit={handleSignUp} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="firstName">First Name</Label>
                              <Input
                                id="firstName"
                                placeholder="John"
                                value={formData.firstName}
                                onChange={(e) => handleInputChange("firstName", e.target.value)}
                                required
                                disabled={loading}
                              />
                            </div>
                            <div>
                              <Label htmlFor="lastName">Last Name</Label>
                              <Input
                                id="lastName"
                                placeholder="Doe"
                                value={formData.lastName}
                                onChange={(e) => handleInputChange("lastName", e.target.value)}
                                required
                                disabled={loading}
                              />
                            </div>
                          </div>
                          
                          {userType === "customer" && (
                            <div>
                              <Label htmlFor="companyName">Company Name</Label>
                              <Input
                                id="companyName"
                                placeholder="Your Company Ltd."
                                value={formData.companyName}
                                onChange={(e) => handleInputChange("companyName", e.target.value)}
                                disabled={loading}
                              />
                            </div>
                          )}
                          
                          <div>
                            <Label htmlFor="signup-email">Email Address</Label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                              <Input
                                id="signup-email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                className="pl-10"
                                required
                                disabled={loading}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              placeholder="+91 98765 43210"
                              value={formData.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              disabled={loading}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor="signup-password">Password</Label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                              <Input
                                id="signup-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a strong password"
                                value={formData.password}
                                onChange={(e) => handleInputChange("password", e.target.value)}
                                className="pl-10 pr-10"
                                required
                                disabled={loading}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                disabled={loading}
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              placeholder="Confirm your password"
                              value={formData.confirmPassword}
                              onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                              required
                              disabled={loading}
                            />
                            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                              <p className="text-sm text-red-500 mt-1">Passwords do not match</p>
                            )}
                          </div>
                          
                          <div className="text-sm">
                            <label className="flex items-start space-x-2">
                              <input type="checkbox" className="rounded mt-1" required disabled={loading} />
                              <span className="text-neutral-600">
                                I agree to the{" "}
                                <a href="#" className="text-action-primary hover:underline">Terms of Service</a>
                                {" "}and{" "}
                                <a href="#" className="text-action-primary hover:underline">Privacy Policy</a>
                              </span>
                            </label>
                          </div>
                          
                          <Button type="submit" variant="action" className="w-full" disabled={loading || (formData.password !== formData.confirmPassword && formData.confirmPassword !== "")}>
                            {loading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating Account...
                              </>
                            ) : (
                              `Create ${userType === "admin" ? "Admin" : "Customer"} Account`
                            )}
                          </Button>
                        </form>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignIn;
