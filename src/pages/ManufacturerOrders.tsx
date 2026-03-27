import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Package, Clock, CheckCircle2, Truck, XCircle, 
  TrendingUp, DollarSign, ShoppingBag, Filter, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  size: string;
  color: string;
  price: number;
  product?: {
    name: string;
    image_url: string | null;
  };
}

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  gst: number;
  shipping: number;
  shipping_address: {
    name: string;
    city: string;
    state: string;
  };
  created_at: string;
  order_items: OrderItem[];
}

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof VALID_STATUSES[number];

const statusConfig: Record<string, { color: string; icon: typeof Clock; label: string }> = {
  pending: { color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20", icon: Clock, label: "Pending" },
  confirmed: { color: "bg-blue-500/10 text-blue-500 border-blue-500/20", icon: CheckCircle2, label: "Confirmed" },
  processing: { color: "bg-purple-500/10 text-purple-500 border-purple-500/20", icon: Package, label: "Processing" },
  shipped: { color: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20", icon: Truck, label: "Shipped" },
  delivered: { color: "bg-green-500/10 text-green-500 border-green-500/20", icon: CheckCircle2, label: "Delivered" },
  cancelled: { color: "bg-red-500/10 text-red-500 border-red-500/20", icon: XCircle, label: "Cancelled" },
};

const ManufacturerOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      // Get orders that contain the manufacturer's products
      const { data: orderItems, error: itemsError } = await supabase
        .from("order_items")
        .select(`
          id,
          product_id,
          quantity,
          size,
          color,
          price,
          order_id,
          product:products!inner(name, image_url, manufacturer_id)
        `)
        .eq("product.manufacturer_id", user?.id);

      if (itemsError) throw itemsError;

      // Get unique order IDs
      const orderIds = [...new Set(orderItems?.map(item => item.order_id) || [])];
      
      if (orderIds.length === 0) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .in("id", orderIds)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Combine orders with their items
      const combinedOrders = ordersData?.map(order => ({
        ...order,
        shipping_address: order.shipping_address as Order['shipping_address'],
        order_items: orderItems
          ?.filter(item => item.order_id === order.id)
          .map(item => ({
            ...item,
            product: (item as any).product
          })) || []
      })) || [];

      setOrders(combinedOrders);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching orders",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!VALID_STATUSES.includes(newStatus as OrderStatus)) {
      toast({
        variant: "destructive",
        title: "Invalid status",
        description: "The selected status is not valid.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({
        title: "Order updated",
        description: `Order status changed to ${statusConfig[newStatus]?.label || newStatus}.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating order",
        description: error.message,
      });
    }
  };

  const filteredOrders = filterStatus === "all" 
    ? orders 
    : orders.filter(order => order.status === filterStatus);

  // Calculate statistics
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    processing: orders.filter(o => ["confirmed", "processing"].includes(o.status)).length,
    shipped: orders.filter(o => o.status === "shipped").length,
    delivered: orders.filter(o => o.status === "delivered").length,
    totalRevenue: orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + o.total, 0),
    totalItems: orders.reduce((sum, o) => sum + o.order_items.reduce((is, i) => is + i.quantity, 0), 0),
  };

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
              Order <span className="text-gradient-gold">Management</span>
            </h1>
            <p className="text-muted-foreground">
              Track and manage orders containing your products.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8"
          >
            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Orders</p>
                    <p className="text-xl font-bold">{stats.total}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Clock className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold">{stats.pending}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Package className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Processing</p>
                    <p className="text-xl font-bold">{stats.processing}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Truck className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shipped</p>
                    <p className="text-xl font-bold">{stats.shipped}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Delivered</p>
                    <p className="text-xl font-bold">{stats.delivered}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card variant="glass">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gold/10">
                    <DollarSign className="h-5 w-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="text-xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Filter & Actions */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  {VALID_STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {statusConfig[status]?.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Orders List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <Card variant="glass" className="text-center py-16">
              <CardContent>
                <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground">
                  Orders containing your products will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order, index) => {
                const StatusIcon = statusConfig[order.status]?.icon || Clock;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card variant="gold-border">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                          {/* Order Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <p className="font-mono text-sm text-muted-foreground">
                                #{order.id.slice(0, 8).toUpperCase()}
                              </p>
                              <Badge className={statusConfig[order.status]?.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[order.status]?.label}
                              </Badge>
                            </div>
                            
                            {/* Products */}
                            <div className="flex flex-wrap gap-3 mb-3">
                              {order.order_items.slice(0, 3).map((item) => (
                                <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                                  {item.product?.image_url && (
                                    <img 
                                      src={item.product.image_url} 
                                      alt={item.product?.name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  )}
                                  <div>
                                    <p className="text-sm font-medium">{item.product?.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.size} / {item.color} × {item.quantity}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              {order.order_items.length > 3 && (
                                <div className="flex items-center px-3 text-sm text-muted-foreground">
                                  +{order.order_items.length - 3} more
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                              <span>📍 {order.shipping_address?.city}, {order.shipping_address?.state}</span>
                              <span>📅 {new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Total & Actions */}
                          <div className="flex flex-col items-end gap-3">
                            <p className="font-serif text-2xl font-bold text-primary">
                              ₹{order.total.toLocaleString()}
                            </p>
                            
                            <Select 
                              value={order.status} 
                              onValueChange={(value) => updateOrderStatus(order.id, value)}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {VALID_STATUSES.map(status => (
                                  <SelectItem key={status} value={status}>
                                    {statusConfig[status]?.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </CardContent>
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

export default ManufacturerOrders;
