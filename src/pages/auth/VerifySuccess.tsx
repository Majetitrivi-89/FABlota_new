import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

const VerifySuccess = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="container mx-auto max-w-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ duration: 0.5 }}
          >
            <Card variant="glass" className="border-primary/20 p-8 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-10 h-10 text-primary" />
                </div>
              </div>
              <CardHeader>
                <CardTitle className="text-3xl font-serif text-primary">Email Verified!</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground text-lg">
                  Thank you! Your email has been successfully verified. 
                  You can now access all the features of Fablota.
                </p>
                <div className="pt-4 space-y-3">
                  <Button asChild variant="hero" className="w-full text-lg py-6">
                    <Link to="/">
                      Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default VerifySuccess;
