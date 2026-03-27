import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface Address {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  is_default: boolean;
}

const Cart = () => {
  const { cartItems, isLoading: cartLoading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [step, setStep] = useState<"cart" | "address" | "payment">("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false });

    if (!error && data) {
      setAddresses(data);
      const defaultAddr = data.find(a => a.is_default);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      } else if (data.length > 0) {
        setSelectedAddress(data[0].id);
      }
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const { error } = await supabase
      .from("addresses")
      .insert([{ ...newAddress, user_id: user.id, is_default: addresses.length === 0 }]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error adding address",
        description: error.message,
      });
    } else {
      toast({ title: "Address added" });
      setNewAddress({ name: "", address: "", city: "", state: "", pincode: "", phone: "" });
      setIsAddressDialogOpen(false);
      fetchAddresses();
    }
  };

  const handleQuantityChange = async (itemId: string, newQuantity: number, minOrder: number) => {
    const validQuantity = Math.max(minOrder, newQuantity);
    await updateQuantity(itemId, validQuantity);
  };

  const subtotal = cartItems.reduce((sum, item) => 
    sum + (item.product?.price || 0) * item.quantity, 0);
  const gst = subtotal * 0.18;
  const shipping = subtotal > 50000 ? 0 : 2500;
  const total = subtotal + gst + shipping;

  const handleCheckout = async () => {
    if (step === "cart") {
      if (cartItems.length === 0) {
        toast({
          variant: "destructive",
          title: "Cart is empty",
          description: "Add items to your cart before checkout.",
        });
        return;
      }
      setStep("address");
    } else if (step === "address") {
      if (!selectedAddress) {
        toast({
          variant: "destructive",
          title: "Select address",
          description: "Please select a delivery address.",
        });
        return;
      }
      setStep("payment");
    } else {
      // Place order
      setIsSubmitting(true);
      
      const address = addresses.find(a => a.id === selectedAddress);
      
      try {
        // Create order
        const { data: order, error: orderError } = await supabase
          .from("orders")
          .insert([{
            retailer_id: user?.id,
            status: "pending",
            shipping_address: address ? {
              name: address.name,
              address: address.address,
              city: address.city,
              state: address.state,
              pincode: address.pincode,
              phone: address.phone,
            } : {},
            subtotal,
            gst,
            shipping,
            total,
            payment_method: "Bank Transfer",
          }])
          .select()
          .single();

        if (orderError) throw orderError;

        // Create order items
        const orderItems = cartItems.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.product?.price || 0,
          color: item.color,
          size: item.size,
        }));

        const { error: itemsError } = await supabase
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Clear cart
        await clearCart();

        toast({
          title: "Order Placed!",
          description: "Your order has been placed successfully.",
        });
        
        navigate("/orders");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error placing order",
          description: error.message,
        });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
              Your <span className="text-gradient-gold">Cart</span>
            </h1>
            <p className="text-muted-foreground">
              Review your items before checkout
            </p>
          </motion.div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {[
              { key: "cart", label: "Cart" },
              { key: "address", label: "Address" },
              { key: "payment", label: "Payment" },
            ].map((s, index) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step === s.key || 
                    (s.key === "cart" && (step === "address" || step === "payment")) ||
                    (s.key === "address" && step === "payment")
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:block ${
                  step === s.key ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {s.label}
                </span>
                {index < 2 && (
                  <div className={`w-12 h-0.5 mx-3 ${
                    (s.key === "cart" && (step === "address" || step === "payment")) ||
                    (s.key === "address" && step === "payment")
                      ? "bg-primary"
                      : "bg-border"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {cartItems.length === 0 && step === "cart" ? (
            <Card variant="glass" className="text-center py-16">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-serif text-2xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some products to get started with your bulk order
              </p>
              <Button variant="hero" onClick={() => navigate("/shop")}>
                Browse Products
              </Button>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items / Address Selection */}
              <div className="lg:col-span-2 space-y-4">
                {step === "cart" && cartItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card variant="gold-border">
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {item.product?.image_url && (
                            <img
                              src={item.product.image_url}
                              alt={item.product?.name}
                              className="w-24 h-24 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <div>
                                <h3 className="font-semibold">{item.product?.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {item.color} / {item.size}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Min. Order: {item.product?.min_order_quantity} pieces
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleQuantityChange(item.id, item.quantity - 10, item.product?.min_order_quantity || 50)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || item.product?.min_order_quantity || 50, item.product?.min_order_quantity || 50)}
                                  className="w-20 text-center h-8"
                                  min={item.product?.min_order_quantity}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleQuantityChange(item.id, item.quantity + 10, item.product?.min_order_quantity || 50)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="font-serif text-xl font-bold text-primary">
                                ₹{((item.product?.price || 0) * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}

                {step === "address" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card variant="glass">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Select Delivery Address
                          </span>
                          <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                + Add New
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Address</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleAddAddress} className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Address Label</Label>
                                  <Input
                                    placeholder="e.g., Main Shop"
                                    value={newAddress.name}
                                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Street Address</Label>
                                  <Input
                                    value={newAddress.address}
                                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                                    required
                                  />
                                </div>
                                <div className="grid gap-4 grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>City</Label>
                                    <Input
                                      value={newAddress.city}
                                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>State</Label>
                                    <Input
                                      value={newAddress.state}
                                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                                      required
                                    />
                                  </div>
                                </div>
                                <div className="grid gap-4 grid-cols-2">
                                  <div className="space-y-2">
                                    <Label>Pincode</Label>
                                    <Input
                                      value={newAddress.pincode}
                                      onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                      required
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input
                                      value={newAddress.phone}
                                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                                      required
                                    />
                                  </div>
                                </div>
                                <Button type="submit" variant="hero" className="w-full">
                                  Add Address
                                </Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {addresses.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No addresses saved. Add your first delivery address.
                          </p>
                        ) : (
                          addresses.map((address) => (
                            <button
                              key={address.id}
                              onClick={() => setSelectedAddress(address.id)}
                              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                                selectedAddress === address.id
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold flex items-center gap-2">
                                    {address.name}
                                    {address.is_default && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                                        Default
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {address.address}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {address.city}, {address.state} - {address.pincode}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Phone: {address.phone}
                                  </p>
                                </div>
                                {selectedAddress === address.id && (
                                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <MapPin className="h-3 w-3 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {step === "payment" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card variant="glass">
                      <CardHeader>
                        <CardTitle>Payment Method</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                          Select your preferred payment method to complete the order.
                        </p>
                        {["Bank Transfer (NEFT/RTGS)", "UPI Payment", "Credit/Debit Card", "Net Banking"].map((method) => (
                          <button
                            key={method}
                            className="w-full p-4 rounded-xl border-2 border-border hover:border-primary/50 text-left transition-all"
                          >
                            <p className="font-medium">{method}</p>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Order Summary */}
              <div>
                <Card variant="gold-border" className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST (18%)</span>
                        <span>₹{Math.round(gst).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span className={shipping === 0 ? "text-green-500" : ""}>
                          {shipping === 0 ? "FREE" : `₹${shipping.toLocaleString()}`}
                        </span>
                      </div>
                      {shipping > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Free shipping on orders over ₹50,000
                        </p>
                      )}
                    </div>
                    <div className="border-t border-border pt-4">
                      <div className="flex justify-between font-serif text-xl font-bold">
                        <span>Total</span>
                        <span className="text-primary">₹{Math.round(total).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Including all taxes
                      </p>
                    </div>
                    <Button
                      variant="hero"
                      size="lg"
                      className="w-full"
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Placing Order...
                        </>
                      ) : (
                        <>
                          {step === "cart" && "Proceed to Address"}
                          {step === "address" && "Continue to Payment"}
                          {step === "payment" && "Place Order"}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                    {step !== "cart" && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setStep(step === "payment" ? "address" : "cart")}
                        disabled={isSubmitting}
                      >
                        Back
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
