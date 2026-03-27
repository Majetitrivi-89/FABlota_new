import { motion } from "framer-motion";
import { 
  ShoppingBag, 
  Palette, 
  Truck, 
  Shield, 
  Sparkles, 
  Users 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: ShoppingBag,
    title: "Bulk Ordering",
    description: "Order 50-100+ pieces per item. Get wholesale prices and streamline your inventory.",
  },
  {
    icon: Palette,
    title: "Brand Building",
    description: "Create your own brand identity with AI-powered name suggestions and custom labeling.",
  },
  {
    icon: Sparkles,
    title: "AI Brand Names",
    description: "Not sure about your brand name? Our AI generates creative suggestions tailored to your vision.",
  },
  {
    icon: Shield,
    title: "Quality Assured",
    description: "Every product is verified. Buy with confidence from FABlota's curated collection.",
  },
  {
    icon: Truck,
    title: "Pan-India Delivery",
    description: "Fast and reliable shipping across India. Track your orders in real-time.",
  },
  {
    icon: Users,
    title: "GST Compliant",
    description: "Fully GST registered. Get proper invoices and tax benefits for your business.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-background relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Why Choose FABlota
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Everything Your Fashion
            <br />
            <span className="text-gradient-gold">Business Needs</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From sourcing to branding, we provide all the tools for retailers to succeed 
            in the fashion industry.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card 
                variant="gold-border" 
                className="h-full hover-lift group cursor-default"
              >
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors duration-300">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="font-serif text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
