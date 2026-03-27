import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, Grid3X3, LayoutGrid, ShoppingCart, Heart, Loader2, Package,
  SlidersHorizontal, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProductDetailDialog from "@/components/shop/ProductDetailDialog";

interface Product {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  min_order_quantity: number;
  sizes: string[];
  colors: string[];
  image_url: string | null;
  created_at: string;
}

const categories = [
  "All",
  "Men's Wear",
  "Women's Wear",
  "Kids Collection",
  "Ethnic Wear",
  "Sportswear",
  "Winter Wear",
  "Casual Wear",
  "Formal Wear",
];

const allSizes = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "Free Size"];
const allColors = ["White", "Black", "Navy", "Grey", "Red", "Blue", "Green", "Yellow", "Pink", "Orange", "Brown", "Maroon"];

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
      
      // Set max price based on products
      if (data && data.length > 0) {
        const max = Math.max(...data.map(p => p.price));
        setMaxPrice(Math.ceil(max / 100) * 100);
        setPriceRange([0, Math.ceil(max / 100) * 100]);
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading products",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesSizes = selectedSizes.length === 0 || 
                          selectedSizes.some(size => product.sizes.includes(size));
      const matchesColors = selectedColors.length === 0 || 
                           selectedColors.some(color => product.colors.includes(color));
      
      return matchesSearch && matchesCategory && matchesPrice && matchesSizes && matchesColors;
    });

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case "price_low":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price_high":
        filtered.sort((a, b) => b.price - a.price);
        break;
      case "name_asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
    }

    return filtered;
  }, [products, searchQuery, selectedCategory, priceRange, selectedSizes, selectedColors, sortBy]);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => 
      prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]
    );
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange([0, maxPrice]);
    setSelectedCategory("All");
    setSearchQuery("");
    setSortBy("newest");
  };

  const activeFilterCount = selectedSizes.length + selectedColors.length + 
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Price Range */}
      <div className="space-y-4">
        <Label className="text-base font-semibold">Price Range</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={maxPrice}
          min={0}
          step={50}
          className="mt-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>₹{priceRange[0]}</span>
          <span>₹{priceRange[1]}</span>
        </div>
      </div>

      {/* Sizes */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Sizes</Label>
        <div className="flex flex-wrap gap-2">
          {allSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedSizes.includes(size)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Colors</Label>
        <div className="flex flex-wrap gap-2">
          {allColors.map((color) => (
            <button
              key={color}
              onClick={() => toggleColor(color)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                selectedColors.includes(color)
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {activeFilterCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          Clear All Filters ({activeFilterCount})
        </Button>
      )}
    </div>
  );

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
              Shop <span className="text-gradient-gold">Collection</span>
            </h1>
            <p className="text-muted-foreground">
              Browse quality clothing from FABlota's verified manufacturers
            </p>
          </motion.div>

          {/* Filters Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col gap-4 mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Filter Button (Mobile) */}
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="md:hidden gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>

              {/* View Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Categories */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="whitespace-nowrap"
                >
                  {category}
                </Button>
              ))}
            </div>
          </motion.div>

          <div className="flex gap-8">
            {/* Desktop Filters Sidebar */}
            <div className="hidden md:block w-64 flex-shrink-0">
              <Card variant="glass" className="sticky top-24 p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                </h3>
                <FilterContent />
              </Card>
            </div>

            {/* Products */}
            <div className="flex-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : products.length === 0 ? (
                <Card variant="glass" className="text-center py-16">
                  <CardContent>
                    <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No products available yet</h3>
                    <p className="text-muted-foreground">
                      Products from manufacturers will appear here once they add items to their catalog.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {filteredAndSortedProducts.length} of {products.length} products
                    </p>
                  </div>

                  <div className={`grid gap-6 ${
                    viewMode === "grid" 
                      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" 
                      : "grid-cols-1"
                  }`}>
                    <AnimatePresence mode="popLayout">
                      {filteredAndSortedProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card variant="gold-border" className="group overflow-hidden hover-lift">
                            <div className="relative aspect-square overflow-hidden bg-secondary/50">
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="h-16 w-16 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                              
                              {/* Quick Actions */}
                              <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                <Button variant="glass" size="icon" className="h-9 w-9">
                                  <Heart className="h-4 w-4" />
                                </Button>
                              </div>

                              {/* Category Badge */}
                              <Badge className="absolute top-3 left-3 bg-primary/90 text-primary-foreground">
                                {product.category}
                              </Badge>
                            </div>

                            <CardContent className="p-4">
                              <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                                {product.name}
                              </h3>
                              
                              {product.description && (
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {product.description}
                                </p>
                              )}

                              {/* Colors */}
                              <div className="flex gap-1 mb-3 flex-wrap">
                                {product.colors.slice(0, 4).map((color, i) => (
                                  <div
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                                  >
                                    {color}
                                  </div>
                                ))}
                                {product.colors.length > 4 && (
                                  <div className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                                    +{product.colors.length - 4}
                                  </div>
                                )}
                              </div>

                              {/* Sizes */}
                              <div className="flex gap-1 mb-3 flex-wrap">
                                {product.sizes.slice(0, 4).map((size, i) => (
                                  <div
                                    key={i}
                                    className="text-xs px-2 py-0.5 rounded-full bg-secondary/70 text-muted-foreground"
                                  >
                                    {size}
                                  </div>
                                ))}
                                {product.sizes.length > 4 && (
                                  <div className="text-xs px-2 py-0.5 rounded-full bg-secondary/70 text-muted-foreground">
                                    +{product.sizes.length - 4}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-serif text-xl font-bold text-primary">
                                    ₹{product.price}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Min: {product.min_order_quantity} pieces
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openProductDetail(product)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="hero"
                                    size="sm"
                                    onClick={() => openProductDetail(product)}
                                  >
                                    <ShoppingCart className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  {filteredAndSortedProducts.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-muted-foreground text-lg mb-4">
                        No products found matching your criteria.
                      </p>
                      <Button variant="outline" onClick={clearFilters}>
                        Clear All Filters
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Product Detail Dialog */}
      <ProductDetailDialog
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <Footer />
    </div>
  );
};

export default Shop;
