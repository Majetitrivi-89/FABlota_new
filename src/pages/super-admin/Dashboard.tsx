import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { Building2, Users, Settings, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const SuperAdminDashboard = () => {
  const { profile } = useAuth();
  const [manufacturers, setManufacturers] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const data = await adminApi.getAllUsers();
        if (data) {
          setManufacturers(data.manufacturers || []);
          setRetailers(data.retailers || []);
        }
      } catch (err) {
        console.error("Error fetching admin data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-serif font-bold text-foreground mb-4">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mb-8">
              Welcome to the master control panel, {profile?.business_name || profile?.owner_name || 'Admin'}.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               <Card className="hover:bg-card/80 transition-colors">
                 <CardHeader className="flex flex-row items-center space-x-4">
                   <Building2 className="h-8 w-8 text-primary" />
                   <div>
                     <CardTitle className="text-xl">Manufacturers</CardTitle>
                     <p className="text-2xl font-bold">{manufacturers.length}</p>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground">Registered and active supply partners.</p>
                 </CardContent>
               </Card>
               
               <Card className="hover:bg-card/80 transition-colors">
                 <CardHeader className="flex flex-row items-center space-x-4">
                   <Users className="h-8 w-8 text-primary" />
                   <div>
                     <CardTitle className="text-xl">Retailers</CardTitle>
                     <p className="text-2xl font-bold">{retailers.length}</p>
                   </div>
                 </CardHeader>
                 <CardContent>
                   <p className="text-sm text-muted-foreground">Marketplace buyers and retail outlets.</p>
                 </CardContent>
               </Card>
            </div>

            <div className="mt-12 space-y-8">
              <section>
                <h2 className="text-2xl font-serif font-semibold mb-4 flex items-center gap-2">
                  <Building2 className="h-6 w-6" /> Manufacturers Directory
                </h2>
                {isLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {manufacturers.length > 0 ? manufacturers.map(m => (
                      <div key={m.id} className="p-4 rounded-lg border border-border bg-card/50 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-lg">{m.business_name}</p>
                          <p className="text-sm text-foreground/80">{m.owner_name} • GST: <span className="font-mono text-primary">{m.gst_number || 'N/A'}</span></p>
                          <p className="text-sm text-muted-foreground">{m.address}, {m.city}, {m.state} - {m.pincode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{m.email}</p>
                          <p className="text-sm text-primary font-bold">{m.phone}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground italic">No manufacturers found.</p>
                    )}
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-2xl font-serif font-semibold mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6" /> Retailers Directory
                </h2>
                {isLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {retailers.length > 0 ? retailers.map(r => (
                      <div key={r.id} className="p-4 rounded-lg border border-border bg-card/50 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-lg">{r.business_name}</p>
                          <p className="text-sm text-foreground/80">{r.owner_name} • GST: <span className="font-mono text-primary">{r.gst_number || 'N/A'}</span></p>
                          <p className="text-sm text-muted-foreground">{r.address}, {r.city}, {r.state} - {r.pincode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{r.email}</p>
                          <p className="text-sm text-primary font-bold">{r.phone}</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-muted-foreground italic">No retailers found.</p>
                    )}
                  </div>
                )}
              </section>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
