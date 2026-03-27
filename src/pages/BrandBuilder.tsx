import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Check, RefreshCw, Shirt, MapPin, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BrandLogoUpload from "@/components/brand/BrandLogoUpload";

const productCategories = [
  { value: "t-shirts", label: "T-Shirts" },
  { value: "shirts", label: "Shirts" },
  { value: "pants", label: "Pants & Trousers" },
  { value: "dresses", label: "Dresses" },
  { value: "ethnic", label: "Ethnic Wear" },
  { value: "kids", label: "Kids Wear" },
  { value: "sports", label: "Sportswear" },
  { value: "general", label: "General Fashion" },
];

const labelPlacements = [
  {
    id: "collar",
    name: "Inside Collar",
    description: "Classic placement for brand labels",
    icon: "👔",
  },
  {
    id: "back-neck",
    name: "Back Neck (Outside)",
    description: "Visible when worn, modern look",
    icon: "🏷️",
  },
  {
    id: "bottom-hem",
    name: "Bottom Hem",
    description: "Subtle placement at the bottom",
    icon: "📍",
  },
  {
    id: "sleeve",
    name: "Sleeve Tag",
    description: "Premium placement on sleeve",
    icon: "💪",
  },
];

interface BrandSuggestion {
  name: string;
  tagline: string;
}

const BrandBuilder = () => {
  const [step, setStep] = useState(1);
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [customName, setCustomName] = useState("");
  const [suggestions, setSuggestions] = useState<BrandSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-brand-names", {
        body: { 
          category: selectedCategory || undefined,
        },
      });

      if (error) throw error;

      if (data?.suggestions) {
        setSuggestions(data.suggestions);
      }
    } catch (error: any) {
      console.error("Error generating suggestions:", error);
      toast({
        variant: "destructive",
        title: "Error generating suggestions",
        description: error.message || "Please try again later.",
      });
      // Fallback suggestions
      setSuggestions([
        { name: "StyleCraft", tagline: "Crafting Your Perfect Style" },
        { name: "TrendVista", tagline: "Where Trends Meet Vision" },
        { name: "FashionForge", tagline: "Forging Fashion Excellence" },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectBrand = (name: string) => {
    setBrandName(name);
    toast({
      title: "Brand Name Selected!",
      description: `You've selected "${name}" as your brand name.`,
    });
  };

  const handleContinue = async () => {
    if (step === 1 && brandName) {
      setStep(2);
    } else if (step === 2 && selectedPlacement) {
      setIsSaving(true);
      try {
        // Save brand to database
        if (user) {
          const { error } = await supabase.from("retailer_brands").insert({
            user_id: user.id,
            brand_name: brandName,
            brand_logo_url: brandLogo || null,
            label_placement: selectedPlacement,
            category: selectedCategory || null,
          });
          if (error) throw error;
        }

        toast({
          title: "Brand Setup Complete!",
          description: "Redirecting you to shop with your brand identity.",
        });
        navigate("/shop");
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error saving brand",
          description: error.message,
        });
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">AI-Powered Brand Builder</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Build Your <span className="text-gradient-gold">Brand</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create your unique brand identity with AI-powered suggestions. 
              Your brand name will be printed on all products you purchase.
            </p>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-12">
            {[
              { num: 1, label: "Brand Name & Logo" },
              { num: 2, label: "Label Placement" },
            ].map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                    step >= s.num
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > s.num ? <Check className="h-5 w-5" /> : s.num}
                </div>
                <span className={`ml-2 text-sm font-medium hidden sm:block ${
                  step >= s.num ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {s.label}
                </span>
                {index < 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    step > 1 ? "bg-primary" : "bg-border"
                  }`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Brand Name */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card variant="glass" className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shirt className="h-5 w-5 text-primary" />
                      Choose Your Brand Name
                    </CardTitle>
                    <CardDescription>
                      Enter your own brand name or let our AI suggest creative options
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Custom Name Input */}
                    <div className="space-y-2">
                      <Label>Enter Your Brand Name</Label>
                      <div className="flex gap-3">
                        <Input
                          placeholder="e.g., Fashion Hub, Style Co..."
                          value={customName}
                          onChange={(e) => setCustomName(e.target.value)}
                        />
                        <Button
                          variant="hero"
                          onClick={() => {
                            if (customName.trim()) {
                              handleSelectBrand(customName.trim());
                            }
                          }}
                          disabled={!customName.trim()}
                        >
                          Use This
                        </Button>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-card px-4 text-sm text-muted-foreground">
                          or get AI suggestions
                        </span>
                      </div>
                    </div>

                    {/* AI Suggestions */}
                    <div className="space-y-4">
                      {/* Category Selector */}
                      <div className="space-y-2">
                        <Label>Select Product Category (Optional)</Label>
                        <Select
                          value={selectedCategory}
                          onValueChange={setSelectedCategory}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a category for tailored suggestions" />
                          </SelectTrigger>
                          <SelectContent>
                            {productCategories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Get AI brand name suggestions tailored to your product type
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={generateSuggestions}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Generating AI suggestions...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate AI Brand Names {selectedCategory && `for ${productCategories.find(c => c.value === selectedCategory)?.label}`}
                          </>
                        )}
                      </Button>

                      {suggestions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="grid gap-3"
                        >
                          {suggestions.map((suggestion, index) => (
                            <motion.button
                              key={suggestion.name}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              onClick={() => handleSelectBrand(suggestion.name)}
                              className={`p-4 rounded-xl border-2 text-left transition-all hover-lift ${
                                brandName === suggestion.name
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-serif text-lg font-semibold">
                                    {suggestion.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {suggestion.tagline}
                                  </p>
                                </div>
                                {brandName === suggestion.name && (
                                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-4 w-4 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Brand Logo Section */}
                {brandName && (
                  <Card variant="glass" className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-primary" />
                        Brand Logo (Optional)
                      </CardTitle>
                      <CardDescription>
                        Upload your logo or generate AI suggestions for "{brandName}"
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {user && (
                        <BrandLogoUpload
                          userId={user.id}
                          brandName={brandName}
                          category={selectedCategory}
                          onLogoSelect={setBrandLogo}
                          selectedLogo={brandLogo}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}

                {brandName && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <p className="text-muted-foreground mb-4">
                      Selected brand: <span className="font-semibold text-primary">{brandName}</span>
                      {brandLogo && " with custom logo"}
                    </p>
                    <Button variant="hero" size="lg" onClick={handleContinue}>
                      Continue to Label Placement
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 2: Label Placement */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card variant="glass" className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Select Label Placement
                    </CardTitle>
                    <CardDescription>
                      Choose where your brand label will be placed on the garments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {labelPlacements.map((placement) => (
                        <button
                          key={placement.id}
                          onClick={() => setSelectedPlacement(placement.id)}
                          className={`p-5 rounded-xl border-2 text-left transition-all hover-lift ${
                            selectedPlacement === placement.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-3xl">{placement.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold">{placement.name}</p>
                                {selectedPlacement === placement.id && (
                                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                  </div>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {placement.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card variant="gold-border" className="mb-8">
                  <CardContent className="p-6">
                    <h3 className="font-serif text-lg font-semibold mb-4">Your Brand Summary</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Brand Name:</span>
                        <span className="font-semibold text-primary">{brandName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Label Placement:</span>
                        <span className="font-semibold">
                          {labelPlacements.find(p => p.id === selectedPlacement)?.name || "Not selected"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    variant="hero"
                    size="lg"
                    onClick={handleContinue}
                    disabled={!selectedPlacement}
                  >
                    Continue to Shop
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BrandBuilder;
