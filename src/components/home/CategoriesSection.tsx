import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  {
    name: "Men's Wear",
    count: "2,500+ Products",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=400&q=80",
    gradient: "from-blue-500/20 to-transparent",
  },
  {
    name: "Women's Wear",
    count: "3,200+ Products",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&q=80",
    gradient: "from-pink-500/20 to-transparent",
  },
  {
    name: "Kids Collection",
    count: "1,800+ Products",
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=400&q=80",
    gradient: "from-yellow-500/20 to-transparent",
  },
  {
    name: "Ethnic Wear",
    count: "1,500+ Products",
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&q=80",
    gradient: "from-orange-500/20 to-transparent",
  },
  {
    name: "Sportswear",
    count: "900+ Products",
    image: "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=400&q=80",
    gradient: "from-green-500/20 to-transparent",
  },
  {
    name: "Winter Wear",
    count: "600+ Products",
    image: "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&q=80",
    gradient: "from-cyan-500/20 to-transparent",
  },
];

const CategoriesSection = () => {
  return (
    <section id="categories" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4"
        >
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Explore Collection
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold">
              Shop by <span className="text-gradient-gold">Category</span>
            </h2>
          </div>
          <Link to="/shop">
            <Button variant="outline" className="group">
              View All Categories
              <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={`/shop?category=${category.name.toLowerCase().replace("'s", "").replace(" ", "-")}`}>
                <div className="group relative aspect-[4/5] rounded-2xl overflow-hidden cursor-pointer hover-lift">
                  {/* Image */}
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t ${category.gradient}`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="font-serif text-xl md:text-2xl font-semibold mb-1 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{category.count}</p>
                  </div>

                  {/* Hover Arrow */}
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-primary/0 flex items-center justify-center group-hover:bg-primary transition-all duration-300">
                    <ArrowRight className="h-5 w-5 text-foreground group-hover:text-primary-foreground transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
