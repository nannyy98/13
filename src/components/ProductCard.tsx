import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { getLocalizedValue, formatPrice } from '../lib/utils';
import { useCartStore } from '../store/useCartStore';
import { useFavoriteIds, useToggleFavorite } from '../lib/supabase/hooks';
import { useAppStore } from '../store/useAppStore';
import { hapticNotification } from '../lib/telegram';
import { toast } from './Toast';
import type { Database } from '../lib/supabase';

type Product = Database['public']['Tables']['products']['Row'];

interface ProductCardProps {
  product: Product;
  language: 'ru' | 'uz';
}

export const ProductCard = memo(({ product, language }: ProductCardProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const [imageLoaded, setImageLoaded] = useState(false);

  const userId = useAppStore((s) => s.getUserId());
  const { data: favoriteIds = [] } = useFavoriteIds(userId);
  const toggleFavorite = useToggleFavorite(userId);
  const isFavorite = favoriteIds.includes(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock === 0) return;
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price as number,
      image: product.images?.[0] || '',
      quantity: 1,
      size: product.sizes?.[0],
      color: product.colors?.[0],
    });
    hapticNotification('success');
    toast.success(language === 'ru' ? 'Добавлено в корзину' : "Savatga qo'shildi");
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite.mutate({ productId: product.id, isFavorite });
    hapticNotification(isFavorite ? 'warning' : 'success');
  };

  return (
    <div
      onClick={() => navigate(`/product/${product.slug}`)}
      className="card-premium overflow-hidden cursor-pointer group"
    >
      {/* Image */}
      <div className="relative aspect-[4/5] bg-surface-100 dark:bg-surface-800 overflow-hidden">
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton dark:skeleton-dark" />
        )}
        <img
          src={product.images?.[0]}
          alt={getLocalizedValue(product.name, language)}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {product.stock > 0 && product.stock < 5 && (
          <div className="absolute top-2 left-2 bg-surface-900 text-white text-2xs font-bold px-2 py-0.5 rounded-lg">
            {language === 'ru' ? `Осталось ${product.stock}` : `${product.stock} qoldi`}
          </div>
        )}

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-sm transition-all duration-150 hover:scale-110 active:scale-90"
        >
          <Heart
            className={`w-4 h-4 transition-all duration-150 ${
              isFavorite ? 'text-danger fill-danger' : 'text-surface-400'
            }`}
          />
        </button>

        {/* Quick add */}
        {product.stock > 0 && (
          <button
            onClick={handleAddToCart}
            className="absolute bottom-2 right-2 w-9 h-9 rounded-xl bg-surface-900 text-white flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 hover:bg-surface-800 active:scale-90"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-surface-900 dark:text-white line-clamp-1 mb-1">
          {getLocalizedValue(product.name, language)}
        </h3>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-extrabold text-surface-900">
            {formatPrice(product.price as number)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {product.sizes && product.sizes.length > 0 && (
              <span className="text-2xs text-surface-400 dark:text-surface-500">
                {product.sizes.slice(0, 3).join(' / ')}
              </span>
            )}
          </div>
          {product.stock > 0 ? (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success" />
              <span className="text-2xs text-success font-medium">
                {language === 'ru' ? 'В наличии' : 'Mavjud'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-danger" />
              <span className="text-2xs text-danger font-medium">
                {language === 'ru' ? 'Нет' : 'Yo\'q'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
