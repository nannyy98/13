import { useState } from 'react';
import { Trash2, Minus, Plus, ShoppingBag, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useTranslation } from '../hooks/useTranslation';
import { useCartStore } from '../store/useCartStore';
import { formatPrice, getLocalizedValue } from '../lib/utils';

export const Cart = () => {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const [confirmRemove, setConfirmRemove] = useState<{ productId: string; size?: string; colorHex?: string } | null>(null);

  const handleRemove = (productId: string, size?: string, colorHex?: string) => {
    setConfirmRemove({ productId, size, colorHex });
  };

  const confirmRemoveItem = () => {
    if (confirmRemove) {
      removeItem(confirmRemove.productId, confirmRemove.size, confirmRemove.colorHex);
      setConfirmRemove(null);
    }
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center px-4 py-20">
          <ShoppingBag className="w-16 h-16 text-surface-300 dark:text-surface-600 mb-4" />
          <h2 className="text-lg font-bold text-surface-900 dark:text-white mb-1">
            {t('empty_cart')}
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400 mb-6 text-center">
            {t('continue_shopping')}
          </p>
          <button
            onClick={() => navigate('/catalog')}
            className="btn-brand px-6 py-3 rounded-xl text-sm"
          >
            {t('catalog')}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-3 pt-3">
        <h1 className="text-lg font-bold text-surface-900 dark:text-white mb-3">
          {t('cart')} <span className="text-surface-400 font-normal text-sm">({items.length})</span>
        </h1>

        <div className="space-y-2.5 pb-36">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.size ?? ''}-${item.color?.hex ?? ''}`}
              className="bg-white dark:bg-surface-800 rounded-2xl p-3 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-surface-100 dark:bg-surface-700 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={getLocalizedValue(item.name, language)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-surface-400 text-xs">
                      {t('no_image')}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-surface-900 dark:text-white truncate">
                    {getLocalizedValue(item.name, language)}
                  </h3>

                  <div className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 flex flex-wrap gap-x-2">
                    {item.size && <span>{t('size')}: {item.size}</span>}
                    {item.color && (
                      <span className="flex items-center gap-1">
                        {t('color')}:
                        <span
                          className="inline-block w-3 h-3 rounded-full border border-surface-300"
                          style={{ backgroundColor: item.color.hex }}
                        />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold text-surface-900">
                      {formatPrice(item.price * item.quantity)}
                    </p>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.size, item.color?.hex)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center disabled:opacity-40 active:scale-90 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center text-surface-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.size, item.color?.hex)}
                        className="w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center active:scale-90 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemove(item.productId, item.size, item.color?.hex)}
                        className="w-7 h-7 rounded-full flex items-center justify-center ml-1 text-red-400 active:text-red-600 active:scale-90 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed checkout bar — positioned above BottomNav */}
      <div className="fixed bottom-14 left-0 right-0 bg-white dark:bg-surface-800 border-t border-surface-100 dark:border-surface-700 px-4 pt-3 pb-3 pb-safe shadow-elevated z-40">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
            {t('total')}
          </span>
          <span className="text-xl font-extrabold text-surface-900">
            {formatPrice(getTotalPrice())}
          </span>
        </div>
        <button
          onClick={() => navigate('/checkout')}
          className="btn-brand w-full py-3.5 rounded-xl text-sm"
        >
          {t('checkout')}
        </button>
        <div className="flex items-center justify-center gap-1.5 mt-2.5">
          <Lock className="w-3 h-3 text-surface-400" />
          <span className="text-xs text-surface-400">
            {language === 'ru' ? 'Ваши данные защищены' : "Ma'lumotlaringiz himoyalangan"}
          </span>
        </div>
      </div>

      {/* Remove confirmation modal */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-8">
          <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 w-full max-w-xs shadow-xl">
            <p className="text-sm font-medium text-surface-900 dark:text-white text-center mb-4">
              {t('confirm_remove_item')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 text-sm font-medium active:scale-95 transition"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmRemoveItem}
                className="btn-brand flex-1 py-2.5 rounded-xl text-sm"
              >
                {t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
