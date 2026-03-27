import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  color: string;
  size: string;
  product?: {
    id: string;
    name: string;
    price: number;
    min_order_quantity: number;
    image_url: string | null;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  addToCart: (productId: string, quantity: number, color: string, size: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  refetch: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user || userRole === "super_admin" || user.id === "hardcoded_admin") {
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          products:product_id (id, name, price, min_order_quantity, image_url)
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      
      const items = data?.map(item => ({
        ...item,
        product: item.products
      })) || [];
      
      setCartItems(items);
    } catch (error: any) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity: number, color: string, size: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Please login",
        description: "You need to be logged in to add items to cart.",
      });
      return;
    }

    try {
      // Check if item already exists
      const { data: existing } = await supabase
        .from("cart_items")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .eq("color", color)
        .eq("size", size)
        .maybeSingle();

      if (existing) {
        // Update quantity
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from("cart_items")
          .insert([{
            user_id: user.id,
            product_id: productId,
            quantity,
            color,
            size,
          }]);

        if (error) throw error;
      }

      toast({
        title: "Added to cart",
        description: "Item has been added to your cart.",
      });
      
      await fetchCart();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding to cart",
        description: error.message,
      });
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) throw error;
      await fetchCart();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating cart",
        description: error.message,
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      
      toast({
        title: "Item removed",
        description: "Item has been removed from your cart.",
      });
      
      await fetchCart();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error removing item",
        description: error.message,
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems([]);
    } catch (error: any) {
      console.error("Error clearing cart:", error);
    }
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        refetch: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
