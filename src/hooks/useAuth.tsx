import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type UserRole = "retailer" | "manufacturer" | "super_admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  profile: any | null;
  isLoading: boolean;
  isFetchingRole: boolean;
  signUp: (email: string, password: string, metadata: SignUpMetadata) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

interface SignUpMetadata {
  role: UserRole;
  business_name: string;
  owner_name: string;
  phone: string;
  gst_number: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingRole, setIsFetchingRole] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (localStorage.getItem("hardcodedAdmin") === "true") {
      setUser({ id: "hardcoded_admin", email: "trivikram051@gmail.com" } as User);
      setUserRole("super_admin");
      setProfile({ business_name: "Super Admin" });
      setIsLoading(false);
      return () => {};
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer fetching additional data with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    setIsFetchingRole(true);
    try {
      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (roleError) {
        console.error("Error fetching user role:", roleError);
      } else if (roleData) {
        setUserRole(roleData.role as UserRole);
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setIsFetchingRole(false);
    }
  };

  const signUp = async (email: string, password: string, metadata: SignUpMetadata) => {
    // Determine the redirect URL based on the current app type and environment
    let redirectUrl = window.location.origin;
    
    // Ensure the trailing slash is present for Supabase
    if (!redirectUrl.endsWith('/')) {
      redirectUrl += '/';
    }

    console.log("[AUTH] Final Signup Options:", {
      email,
      emailRedirectTo: redirectUrl,
      metadata: metadata
    });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });

    if (error) {
      console.error("[AUTH] Sign up error details:", error);
      toast({
        title: "Sign Up Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      console.log("Sign up successful. User created:", data.user?.id);
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account.",
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (email === "trivikram051@gmail.com" && password === "Trivikram#9100") {
      localStorage.setItem("hardcodedAdmin", "true");
      setUser({ id: "hardcoded_admin", email: "trivikram051@gmail.com" } as User);
      setUserRole("super_admin");
      setProfile({ business_name: "Super Admin" });
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "Sign In Failed",
        description: error.message,
        variant: "destructive",
      });
    }

    return { error };
  };

  const signOut = async () => {
    localStorage.removeItem("hardcodedAdmin");
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        profile,
        isLoading,
        isFetchingRole,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
