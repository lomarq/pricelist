import { Product } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

const PRODUCTS_STORAGE_KEY = 'price_list_manager_products';
const PASSWORD_STORAGE_KEY = 'price_list_manager_password';
const LOGO_STORAGE_KEY = 'price_list_manager_logo';
const DEFAULT_PASSWORD = 'admin123';

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * Saves the entire list of products to storage.
 */
const saveAllProducts = (products: Product[]): void => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
};

/**
 * Initializes the local storage with initial data if it's not already present.
 */
export const connectAndInitialize = async (): Promise<void> => {
    await delay(500); // Simulate connection delay
    if (!localStorage.getItem(PRODUCTS_STORAGE_KEY)) {
        saveAllProducts(INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(PASSWORD_STORAGE_KEY)) {
        localStorage.setItem(PASSWORD_STORAGE_KEY, DEFAULT_PASSWORD);
    }
};

/**
 * Fetches all products from localStorage.
 */
export const getProducts = async (): Promise<Product[]> => {
  console.log('Fetching products from mock service (localStorage)...');
  await delay(1000);
  const data = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!data) {
    await connectAndInitialize();
    const initializedData = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return initializedData ? JSON.parse(initializedData) : [];
  }
  return JSON.parse(data);
};

/**
 * Updates a single product in localStorage.
 */
export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
  console.log(`Updating product ${updatedProduct.id} in mock service (localStorage)...`);
  await delay(700);
  
  const currentProducts = await getProducts();
  const index = currentProducts.findIndex(p => p.id === updatedProduct.id);

  if (index === -1) {
    throw new Error('Product not found');
  }
  
  currentProducts[index] = { ...updatedProduct };
  saveAllProducts(currentProducts);
  
  return JSON.parse(JSON.stringify(updatedProduct));
};

/**
 * Updates multiple products at once.
 */
export const batchUpdateProducts = async(updatedProducts: Product[]): Promise<Product[]> => {
    console.log('Batch updating products in mock service (localStorage)...');
    await delay(1200);
    saveAllProducts(updatedProducts);
    return JSON.parse(JSON.stringify(updatedProducts));
}

/**
 * Retrieves the editor password from local storage.
 */
export const getPassword = async (): Promise<string> => {
    await delay(100);
    return localStorage.getItem(PASSWORD_STORAGE_KEY) || DEFAULT_PASSWORD;
};

/**
 * Sets a new editor password in local storage.
 */
export const setPassword = async (newPassword: string): Promise<void> => {
    await delay(500);
    localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword);
};

/**
 * Retrieves the logo from local storage.
 */
export const getLogo = async (): Promise<string | null> => {
    await delay(100);
    return localStorage.getItem(LOGO_STORAGE_KEY);
};

/**
 * Sets a new logo in local storage.
 */
export const setLogo = async (logoBase64: string): Promise<void> => {
    await delay(500);
    localStorage.setItem(LOGO_STORAGE_KEY, logoBase64);
};