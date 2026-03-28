import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const redirectUrl = `${window.location.origin}/reset-password`;
    console.log("[AUTH] Requesting password reset with redirect:", redirectUrl);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIsSubmitted(true);
      toast({
        title: "Reset link sent",
        description: "Check your email for the password reset link.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card variant="glass" className="border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-serif text-primary">Forgot Password</CardTitle>
                <CardDescription>Enter your email address to receive a password reset link.</CardDescription>
              </CardHeader>
              <CardContent>
                {!isSubmitted ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="your@email.com"
                          autoComplete="email"
                          className="pl-10"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Link"}
                    </Button>
                    <div className="text-center">
                      <Link to="/" className="text-sm text-primary hover:underline flex items-center justify-center gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Login
                      </Link>
                    </div>
                  </form>
                ) : (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Mail className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-muted-foreground">
                      We've sent a link to <span className="font-semibold text-foreground">{email}</span>. 
                      Please follow the link in your email to reset your password.
                    </p>
                    <Button asChild variant="hero" className="w-full">
                      <Link to="/">Return Home</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
