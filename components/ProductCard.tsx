import React from 'react';
import { Product, UserRole } from '../types';
import { EditIcon } from './icons/EditIcon';

interface ProductCardProps {
  product: Product;
  userRole: UserRole;
  onEdit: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, userRole, onEdit }) => {
  const isEditor = userRole === UserRole.EDITOR;
  const sortedTiers = product.priceTiers.sort((a, b) => a.pounds - b.pounds);
  const tariff = product.tariff ?? 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-300 hover:scale-105 hover:shadow-xl relative">
      <div className="p-5">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{product.colorName}</h3>
            </div>
            {isEditor && (
                <button
                    onClick={() => onEdit(product)}
                    className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    aria-label={`Edit ${product.colorName}`}
                >
                    <EditIcon />
                </button>
            )}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
             <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300">Price per Pound (lbs)</h4>
             {tariff > 0 && (
                <span className="text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                    +{tariff}% Tariff
                </span>
             )}
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sortedTiers.map((tier, index) => {
              const nextTier = sortedTiers[index + 1];
              const tierLabel = nextTier
                ? `${tier.pounds} - ${nextTier.pounds - 1} lbs`
                : `${tier.pounds}+ lbs`;
              
              const originalPrice = tier.pricePerPound;
              const finalPrice = originalPrice * (1 + tariff / 100);

              return (
                <li key={tier.pounds} className="py-2 flex justify-between items-baseline">
                  <span className="text-gray-700 dark:text-gray-300">{tierLabel}</span>
                  <div className="flex items-baseline gap-2">
                    {tariff > 0 && (
                        <span className="font-mono text-sm text-gray-500 line-through">
                            ${originalPrice.toFixed(2)}
                        </span>
                    )}
                    <span className="font-mono text-lg font-medium text-gray-900 dark:text-white">
                        ${finalPrice.toFixed(2)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};