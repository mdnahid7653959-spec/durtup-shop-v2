import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, ShoppingCart, Heart, Zap, Truck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useCJCart } from "@/hooks/useCJCart";
import { useWishlist } from "@/contexts/WishlistContext";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import type { CombinedProduct } from "@/hooks/useCombinedSearch";
import { getSmartProductImage } from "@/utils/productImageHelper";

interface CombinedProductCardProps {
  product: CombinedProduct;
}

const CombinedProductCardComponent: React.FC<CombinedProductCardProps> = ({ product }) => {
  const displayImage = getSmartProductImage(product.name, product.image, (product as any).category || "");
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { addToCart: addToCJCart } = useCJCart();
  const { items: wishlistItems, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();

  const isInWishlist = wishlistItems.some((item) => item.product_id === product.id);
  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const productLink = product.source === 'cj' 
    ? `/product/cj/${product.cjProductId || product.id}`
    : `/product/${product.slug || product.id}`;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (product.source === 'cj') {
        const cjProduct = {
          id: `cj_${product.id}`,
          name: product.name,
          price: product.price,
          image: displayImage || product.image,
          variant: null,
          variantId: null,
          isCJProduct: true as const,
        };
        addToCJCart(cjProduct, 1);
      } else {
        await addToCart(product, 1);
      }
    } catch (err) {
      console.error("CombinedProductCard handleAddToCart error:", err);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await handleAddToCart(e);
      navigate("/checkout");
    } catch (err) {
      console.error("CombinedProductCard handleBuyNow error:", err);
      navigate("/checkout");
    }
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product.id);
    }
  };

  return (
    <Link 
      to={productLink} 
      state={{ preloadedProduct: product }}
      onMouseEnter={() => { if (displayImage) { const i = new Image(); i.src = displayImage; } }}
      onTouchStart={() => { if (displayImage) { const i = new Image(); i.src = displayImage; } }}
      className="group block"
    >
      <div className="bg-card border rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/20">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={displayImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getSmartProductImage(product.name, "", "");
            }}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {/* International Badge for CJ Products */}
            {product.source === 'cj' && (
              <Badge className="bg-primary text-primary-foreground text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 flex items-center gap-0.5">
                <Globe className="h-3 w-3 shrink-0" />
                <span className="hidden xs:inline">International</span>
              </Badge>
            )}
            {discountPercent > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                -{discountPercent}%
              </Badge>
            )}
            {product.isNew && (
              <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0.5">
                New
              </Badge>
            )}
            {product.isBestSeller && (
              <Badge className="bg-secondary text-secondary-foreground text-[10px] px-1.5 py-0.5">
                Best Seller
              </Badge>
            )}
          </div>

          {/* Wishlist Button */}
          <Button
            size="icon"
            variant="ghost"
            className={cn(
              "absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm",
              isInWishlist && "text-red-500"
            )}
            onClick={toggleWishlist}
          >
            <Heart className={cn("h-4 w-4", isInWishlist && "fill-current")} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-2.5 sm:p-3 overflow-hidden">
          {/* Product Name */}
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] text-foreground group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({product.sold}+ sold)</span>
          </div>

          {/* Price */}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              ৳{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-muted-foreground line-through">
                ৳{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>



          {/* Action Button - Instant Order Now */}
          <div className="mt-3">
            <Button
              size="sm"
              variant="default"
              className="w-full text-xs sm:text-sm py-2"
              onClick={handleBuyNow}
            >
              Order Now
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export const CombinedProductCard = React.memo(CombinedProductCardComponent);
