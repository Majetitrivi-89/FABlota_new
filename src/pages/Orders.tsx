import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  color: string;
  size: string;
  product?: {
    name: string;
    image_url: string | null;
  };
}

interface Order {
  id: string;
  status: string;
  shipping_address: any;
  subtotal: number;
  gst: number;
  shipping: number;
  total: number;
  payment_method: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-yellow-500/10 text-yellow-600", label: "Pending" },
  confirmed: { icon: CheckCircle, color: "bg-blue-500/10 text-blue-600", label: "Confirmed" },
  processing: { icon: Package, color: "bg-purple-500/10 text-purple-600", label: "Processing" },
  shipped: { icon: Truck, color: "bg-indigo-500/10 text-indigo-600", label: "Shipped" },
  delivered: { icon: CheckCircle, color: "bg-green-500/10 text-green-600", label: "Delivered" },
  cancelled: { icon: XCircle, color: "bg-red-500/10 text-red-600", label: "Cancelled" },
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            products:product_id (name, image_url)
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedOrders = data?.map(order => ({
        ...order,
        order_items: order.order_items?.map((item: any) => ({
          ...item,
          product: item.products
        }))
      })) || [];
      
      setOrders(transformedOrders);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading orders",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
  type OrderStatus = typeof VALID_STATUSES[number];

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    // Validate status before sending to database
    if (!VALID_STATUSES.includes(newStatus as OrderStatus)) {
      toast({
        variant: "destructive",
        title: "Invalid status",
        description: "The selected status is not valid.",
      });
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error updating status",
        description: error.message,
      });
    } else {
      toast({ title: "Order status updated" });
      fetchOrders();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
              {userRole === "manufacturer" ? "Incoming" : "My"} <span className="text-gradient-gold">Orders</span>
            </h1>
            <p className="text-muted-foreground">
              {userRole === "manufacturer" 
                ? "View and manage orders for your products" 
                : "Track and manage your bulk orders"}
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <Card variant="glass" className="text-center py-16">
              <CardContent>
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground">
                  {userRole === "manufacturer" 
                    ? "Orders containing your products will appear here." 
                    : "Your order history will appear here once you place orders."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => {
                const status = statusConfig[order.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                const isExpanded = expandedOrder === order.id;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card variant="gold-border">
                      <CardHeader 
                        className="cursor-pointer"
                        onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${status.color}`}>
                              <StatusIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-mono text-sm text-muted-foreground">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                            <p className="font-serif text-xl font-bold text-primary">
                              ₹{order.total.toLocaleString()}
                            </p>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="border-t border-border pt-4">
                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Order Items */}
                            <div>
                              <h4 className="font-semibold mb-3">Order Items</h4>
                              <div className="space-y-3">
                                {order.order_items?.map((item) => (
                                  <div key={item.id} className="flex gap-3 p-3 rounded-lg bg-secondary/50">
                                    {item.product?.image_url && (
                                      <img
                                        src={item.product.image_url}
                                        alt={item.product?.name}
                                        className="w-16 h-16 rounded-lg object-cover"
                                      />
                                    )}
                                    <div className="flex-1">
                                      <p className="font-medium">{item.product?.name || "Product"}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {item.color} / {item.size}
                                      </p>
                                      <div className="flex justify-between mt-1">
                                        <span className="text-sm">Qty: {item.quantity}</span>
                                        <span className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Order Details */}
                            <div>
                              <h4 className="font-semibold mb-3">Delivery Address</h4>
                              <div className="p-3 rounded-lg bg-secondary/50 mb-4">
                                <p className="font-medium">{order.shipping_address?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {order.shipping_address?.address}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.pincode}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Phone: {order.shipping_address?.phone}
                                </p>
                              </div>

                              <h4 className="font-semibold mb-3">Order Summary</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span>₹{order.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">GST (18%)</span>
                                  <span>₹{order.gst.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Shipping</span>
                                  <span>{order.shipping === 0 ? "FREE" : `₹${order.shipping.toLocaleString()}`}</span>
                                </div>
                                <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                                  <span>Total</span>
                                  <span className="text-primary">₹{order.total.toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Manufacturer Actions */}
                              {userRole === "manufacturer" && order.status !== "delivered" && order.status !== "cancelled" && (
                                <div className="mt-4 flex gap-2 flex-wrap">
                                  {order.status === "pending" && (
                                    <Button size="sm" onClick={() => updateOrderStatus(order.id, "confirmed")}>
                                      Confirm Order
                                    </Button>
                                  )}
                                  {order.status === "confirmed" && (
                                    <Button size="sm" onClick={() => updateOrderStatus(order.id, "processing")}>
                                      Start Processing
                                    </Button>
                                  )}
                                  {order.status === "processing" && (
                                    <Button size="sm" onClick={() => updateOrderStatus(order.id, "shipped")}>
                                      Mark Shipped
                                    </Button>
                                  )}
                                  {order.status === "shipped" && (
                                    <Button size="sm" onClick={() => updateOrderStatus(order.id, "delivered")}>
                                      Mark Delivered
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Orders;
