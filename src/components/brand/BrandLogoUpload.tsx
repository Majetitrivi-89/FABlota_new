import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, ImageIcon, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BrandLogoUploadProps {
  userId: string;
  brandName: string;
  category: string;
  onLogoSelect: (logoUrl: string) => void;
  selectedLogo?: string;
}

interface LogoSuggestion {
  url: string;
  prompt: string;
}

const BrandLogoUpload = ({
  userId,
  brandName,
  category,
  onLogoSelect,
  selectedLogo,
}: BrandLogoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiLogos, setAiLogos] = useState<LogoSuggestion[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("brand-logos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("brand-logos")
        .getPublicUrl(fileName);

      onLogoSelect(data.publicUrl);

      toast({
        title: "Logo uploaded",
        description: "Your brand logo has been uploaded successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const generateAILogos = async () => {
    if (!brandName) {
      toast({
        variant: "destructive",
        title: "Brand name required",
        description: "Please enter a brand name first.",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-brand-logo", {
        body: { brandName, category },
      });

      if (error) throw error;

      if (data?.logos) {
        setAiLogos(data.logos);
      }
    } catch (error: any) {
      console.error("Error generating logos:", error);
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message || "Please try again later.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const clearLogo = () => {
    onLogoSelect("");
  };

  return (
    <div className="space-y-6">
      {/* Selected Logo Preview */}
      {selectedLogo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative inline-block"
        >
          <div className="relative w-32 h-32 rounded-xl border-2 border-primary overflow-hidden bg-white">
            <img
              src={selectedLogo}
              alt="Brand Logo"
              className="w-full h-full object-contain p-2"
            />
            <button
              type="button"
              onClick={clearLogo}
              className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">Selected Logo</p>
        </motion.div>
      )}

      {/* Upload Section */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Upload from device */}
        <label
          className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors ${
            isUploading ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          {isUploading ? (
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">Upload Your Logo</span>
              <span className="text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
            </>
          )}
        </label>

        {/* AI Generate */}
        <Button
          type="button"
          variant="outline"
          className="h-auto flex flex-col items-center justify-center p-6"
          onClick={generateAILogos}
          disabled={isGenerating || !brandName}
        >
          {isGenerating ? (
            <RefreshCw className="h-8 w-8 text-primary mb-2 animate-spin" />
          ) : (
            <Sparkles className="h-8 w-8 text-primary mb-2" />
          )}
          <span className="text-sm font-medium">
            {isGenerating ? "Generating..." : "Generate AI Logos"}
          </span>
          <span className="text-xs text-muted-foreground">
            Create unique logo suggestions
          </span>
        </Button>
      </div>

      {/* AI Generated Logos */}
      {aiLogos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-sm font-medium">AI Generated Suggestions</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {aiLogos.map((logo, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onLogoSelect(logo.url)}
                className={`aspect-square rounded-xl border-2 overflow-hidden transition-all hover:border-primary bg-white ${
                  selectedLogo === logo.url ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
              >
                <img
                  src={logo.url}
                  alt={`Logo suggestion ${index + 1}`}
                  className="w-full h-full object-contain p-2"
                />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default BrandLogoUpload;
