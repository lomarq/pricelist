import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    colorName: 'Royal Blue',
    priceTiers: [
      { pounds: 5, pricePerPound: 12.00 },
      { pounds: 25, pricePerPound: 10.50 },
      { pounds: 90, pricePerPound: 9.00 },
      { pounds: 500, pricePerPound: 7.50 },
    ],
  },
  {
    id: '2',
    colorName: 'Crimson Red',
    priceTiers: [
      { pounds: 5, pricePerPound: 12.50 },
      { pounds: 25, pricePerPound: 11.00 },
      { pounds: 90, pricePerPound: 9.50 },
      { pounds: 500, pricePerPound: 8.00 },
    ],
  },
  {
    id: '3',
    colorName: 'Emerald Green',
    priceTiers: [
      { pounds: 5, pricePerPound: 12.25 },
      { pounds: 25, pricePerPound: 10.75 },
      { pounds: 90, pricePerPound: 9.25 },
      { pounds: 500, pricePerPound: 7.75 },
    ],
  },
  {
    id: '4',
    colorName: 'Sunshine Yellow',
    priceTiers: [
      { pounds: 5, pricePerPound: 11.00 },
      { pounds: 25, pricePerPound: 9.50 },
      { pounds: 90, pricePerPound: 8.00 },
      { pounds: 500, pricePerPound: 6.50 },
    ],
  },
  {
    id: '5',
    colorName: 'Jet Black',
    priceTiers: [
      { pounds: 5, pricePerPound: 9.50 },
      { pounds: 25, pricePerPound: 8.50 },
      { pounds: 90, pricePerPound: 7.50 },
      { pounds: 500, pricePerPound: 6.50 },
    ],
  },
  {
    id: '6',
    colorName: 'Arctic White',
    priceTiers: [
      { pounds: 5, pricePerPound: 10.00 },
      { pounds: 25, pricePerPound: 8.75 },
      { pounds: 90, pricePerPound: 7.75 },
      { pounds: 500, pricePerPound: 6.75 },
    ],
  },
  {
    id: '7',
    colorName: 'Tangerine Orange',
    priceTiers: [
      { pounds: 5, pricePerPound: 11.50 },
      { pounds: 25, pricePerPound: 10.25 },
      { pounds: 90, pricePerPound: 9.00 },
      { pounds: 500, pricePerPound: 7.50 },
    ],
  },
    {
    id: '8',
    colorName: 'Violet Purple',
    priceTiers: [
      { pounds: 5, pricePerPound: 12.75 },
      { pounds: 25, pricePerPound: 11.50 },
      { pounds: 90, pricePerPound: 10.00 },
      { pounds: 500, pricePerPound: 8.50 },
    ],
  },
];