import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import { z } from "zod";

const signupSchema = z.object({
  businessName: z.string().min(2, "Business name is required").max(100),
  ownerName: z.string().min(2, "Owner name is required").max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number").max(15),
  gstNumber: z.string().length(15, "GST number must be 15 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  address: z.string().min(5, "Address is required").max(200),
  city: z.string().min(2, "City is required").max(50),
  state: z.string().min(2, "State is required").max(50),
  pincode: z.string().length(6, "Pincode must be 6 digits"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const ManufacturerSignup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    gstNumber: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user, userRole } = useAuth();

  useEffect(() => {
    if (user && userRole) {
      if (userRole === "manufacturer") {
        navigate("/manufacturer", { replace: true });
      } else if (userRole === "super_admin") {
        navigate("/super-admin", { replace: true });
      } else {
        navigate("/shop", { replace: true });
      }
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(formData.email, formData.password, {
      role: "manufacturer",
      business_name: formData.businessName,
      owner_name: formData.ownerName,
      phone: formData.phone,
      gst_number: formData.gstNumber,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    });
    setIsLoading(false);

    if (!error) {
      setIsSubmitted(true);
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account.",
      });
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 px-4 flex items-center justify-center">
          <Card variant="glass" className="max-w-md w-full border-primary/20 p-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="mb-2 text-2xl font-serif">Verify Your Email</CardTitle>
            <p className="text-muted-foreground mb-8">
              We've sent a verification link to <span className="text-foreground font-semibold">{formData.email}</span>. 
              Please click the link in your email to activate your manufacturer account.
            </p>
            <div className="space-y-4">
              <Button asChild variant="hero" className="w-full">
                <Link to="/manufacturer/login">Go to Login</Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or try logging in to resend.
              </p>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="text-center mb-8">
              <Link to="/" className="inline-block">
                <span className="font-serif text-3xl font-bold text-gradient-gold">FABlota</span>
              </Link>
              <p className="text-muted-foreground mt-2">Join India's premium B2B fashion marketplace as a Manufacturer</p>
            </div>

            <Card variant="glass" className="border-border/50">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl text-center">Manufacturer Registration</CardTitle>
                <CardDescription className="text-center">Create your factory account to list and sell products</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="flex justify-center mb-8">
                  <div className="p-4 rounded-xl border-2 border-primary bg-primary/10">
                    <Building2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <p className="font-semibold text-primary">Manufacturer</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-serif text-lg font-semibold text-primary border-b border-border pb-2">Business Information</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input id="businessName" placeholder="Your Factory Name" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} required />
                        {errors.businessName && <p className="text-xs text-destructive">{errors.businessName}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ownerName">Owner/Contact Name *</Label>
                        <Input id="ownerName" placeholder="Full Name" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} required />
                        {errors.ownerName && <p className="text-xs text-destructive">{errors.ownerName}</p>}
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input id="email" type="email" placeholder="factory@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input id="phone" type="tel" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gstNumber">GST Number *</Label>
                      <Input id="gstNumber" placeholder="22AAAAA0000A1Z5" value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })} required maxLength={15} />
                      <p className="text-xs text-muted-foreground">Your 15-digit GST Identification Number</p>
                      {errors.gstNumber && <p className="text-xs text-destructive">{errors.gstNumber}</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-serif text-lg font-semibold text-primary border-b border-border pb-2">Factory/Office Address</h3>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input id="address" placeholder="Street address, building name" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                      {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City *</Label>
                        <Input id="city" placeholder="City" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
                        {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State *</Label>
                        <Input id="state" placeholder="State" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} required />
                        {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                      </div>
                      <div className="space-y-2 col-span-2 md:col-span-1">
                        <Label htmlFor="pincode">Pincode *</Label>
                        <Input id="pincode" placeholder="400001" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} required maxLength={6} />
                        {errors.pincode && <p className="text-xs text-destructive">{errors.pincode}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-serif text-lg font-semibold text-primary border-b border-border pb-2">Security</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={8} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input id="confirmPassword" type="password" placeholder="••••••••" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
                        {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                      </div>
                    </div>
                  </div>

                  <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      <>Create Manufacturer Account <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account? <Link to="/manufacturer/login" className="text-primary font-medium hover:underline">Sign In</Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ManufacturerSignup;
