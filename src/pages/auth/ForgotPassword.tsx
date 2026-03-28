import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import Navbar from "@/components/layout/Navbar";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp">("email");
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setStep("otp");
      toast({
        title: "Code Sent",
        description: "Please check your email for the 6-digit reset code.",
      });
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the full 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery",
    });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Verified",
        description: "Code verified successfully. Please set your new password.",
      });
      navigate("/reset-password");
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground uppercase-none">
      <Navbar />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Card variant="glass" className="border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-serif text-primary">
                  {step === "email" ? "Forgot Password" : "Enter Reset Code"}
                </CardTitle>
                <CardDescription>
                  {step === "email" 
                    ? "Enter your email address to receive a reset code." 
                    : `We've sent a 6-digit code to ${email}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {step === "email" ? (
                    <motion.form 
                      key="email-form"
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      onSubmit={handleSubmitEmail} 
                      className="space-y-4"
                    >
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
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Reset Code"}
                      </Button>
                      <div className="text-center">
                        <Link to="/" className="text-sm text-primary hover:underline flex items-center justify-center gap-2">
                          <ArrowLeft className="h-4 w-4" /> Back to Login
                        </Link>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form 
                      key="otp-form"
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onSubmit={handleVerifyOtp} 
                      className="space-y-6"
                    >
                      <div className="space-y-4 flex flex-col items-center">
                        <Label htmlFor="otp" className="text-center w-full">6-Digit Verification Code</Label>
                        <InputOTP
                          maxLength={6}
                          value={otp}
                          onChange={(value) => setOtp(value)}
                        >
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </div>
                      <Button type="submit" variant="hero" className="w-full" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Code"}
                      </Button>
                      <div className="flex flex-col gap-2 text-center">
                        <button 
                          type="button" 
                          onClick={() => setStep("email")}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                          <ArrowLeft className="h-4 w-4" /> Change Email
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
