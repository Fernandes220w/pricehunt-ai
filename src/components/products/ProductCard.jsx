import { Badge } from '@/components/ui/badge';
import { ShieldCheck, TrendingDown, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProductCard({ product, prices }) {
  const bestPrice = prices?.sort((a, b) => a.price - b.price)[0];
  const scoreColor = product.reliability_score >= 80 ? 'text-primary' : product.reliability_score >= 60 ? 'text-accent' : 'text-destructive';
  const scoreBg = product.reliability_score >= 80 ? 'bg-primary/10' : product.reliability_score >= 60 ? 'bg-accent/10' : 'bg-destructive/10';

  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
      {/* Image */}
      {product.image_url && (
        <div className="aspect-square bg-secondary/50 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Category & Score */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-medium">
            {product.category?.replace(/_/g, ' ')}
          </Badge>
          <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", scoreBg, scoreColor)}>
            <ShieldCheck className="h-3 w-3" />
            {product.reliability_score}
          </div>
        </div>

        {/* Name & Brand */}
        <div>
          <h3 className="font-semibold text-sm leading-tight">{product.name}</h3>
          {product.brand && (
            <p className="text-xs text-muted-foreground mt-0.5">{product.brand}</p>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Price */}
        {bestPrice && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <div className="flex items-center gap-1.5">
                <TrendingDown className="h-3 w-3 text-primary" />
                <span className="text-lg font-bold">
                  R$ {bestPrice.price.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {bestPrice.store_name}
                {bestPrice.original_price && bestPrice.original_price > bestPrice.price && (
                  <span className="ml-1.5 line-through">R$ {bestPrice.original_price.toFixed(2)}</span>
                )}
              </p>
            </div>
            {prices?.length > 1 && (
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                +{prices.length - 1} lojas
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}