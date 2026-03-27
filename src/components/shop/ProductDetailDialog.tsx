import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import ProductImageGallery from "./ProductImageGallery";
import ProductReviews from "./ProductReviews";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  sizes: string[];
  colors: string[];
  image_url: string | null;
  min_order_quantity: number;
}

interface ProductDetailDialogProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProductDetailDialog = ({ product, isOpen, onClose }: ProductDetailDialogProps) => {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [images, setImages] = useState<string[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const { addToCart, isLoading } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes[0] || "");
      setSelectedColor(product.colors[0] || "");
      setQuantity(product.min_order_quantity);
      fetchProductImages(product.id);
    }
  }, [product]);

  const fetchProductImages = async (productId: string) => {
    setIsLoadingImages(true);
    const { data, error } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", productId)
      .order("display_order");

    if (!error && data) {
      const additionalImages = data.map((img) => img.image_url);
      // Combine main image with gallery images
      const allImages = product?.image_url
        ? [product.image_url, ...additionalImages]
        : additionalImages.length > 0
        ? additionalImages
        : ["/placeholder.svg"];
      setImages(allImages);
    } else {
      setImages(product?.image_url ? [product.image_url] : ["/placeholder.svg"]);
    }
    setIsLoadingImages(false);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    if (!selectedSize || !selectedColor) {
      toast({
        title: "Selection required",
        description: "Please select a size and color",
        variant: "destructive",
      });
      return;
    }

    if (quantity < product.min_order_quantity) {
      toast({
        title: "Minimum order required",
        description: `Minimum order quantity is ${product.min_order_quantity} pieces`,
        variant: "destructive",
      });
      return;
    }

    await addToCart(product.id, quantity, selectedSize, selectedColor);
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">{product.name}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Gallery */}
          <div>
            {isLoadingImages ? (
              <div className="aspect-square bg-secondary/50 rounded-lg animate-pulse" />
            ) : (
              <ProductImageGallery images={images} productName={product.name} />
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <Badge variant="secondary">{product.category}</Badge>
              <p className="text-3xl font-bold text-primary mt-2">
                ₹{product.price.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">per piece</p>
            </div>

            {product.description && (
              <p className="text-muted-foreground">{product.description}</p>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Minimum order: {product.min_order_quantity} pieces</span>
            </div>

            <Separator />

            {/* Size Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Size</label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <Button
                    key={size}
                    variant={selectedSize === size ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Color</label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <Button
                    key={color}
                    variant={selectedColor === color ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedColor(color)}
                  >
                    {color}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quantity</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(product.min_order_quantity, quantity - 10))}
                >
                  -
                </Button>
                <span className="w-16 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 10)}
                >
                  +
                </Button>
              </div>
            </div>

            <Button
              variant="hero"
              className="w-full"
              onClick={handleAddToCart}
              disabled={isLoading}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart - ₹{(product.price * quantity).toLocaleString()}
            </Button>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Reviews Tab */}
        <Tabs defaultValue="reviews" className="w-full">
          <TabsList>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="details">Product Details</TabsTrigger>
          </TabsList>
          <TabsContent value="reviews" className="mt-4">
            <ProductReviews productId={product.id} />
          </TabsContent>
          <TabsContent value="details" className="mt-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{product.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Available Sizes</p>
                  <p className="font-medium">{product.sizes.join(", ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Available Colors</p>
                  <p className="font-medium">{product.colors.join(", ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Minimum Order</p>
                  <p className="font-medium">{product.min_order_quantity} pieces</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetailDialog;
