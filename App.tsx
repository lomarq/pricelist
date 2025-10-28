import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ProductList } from './components/ProductList';
import { EditPriceModal } from './components/EditPriceModal';
import { CsvUploadModal } from './components/CsvUploadModal';
import { TariffModal } from './components/TariffModal';
import { SearchBar } from './components/SearchBar';
import { PasswordModal } from './components/PasswordModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { UploadLogoModal } from './components/UploadLogoModal';
import { getProducts, updateProduct as updateProductService, batchUpdateProducts, connectAndInitialize, getPassword, setPassword, getLogo, setLogo } from './services/googleSheetsService';
import { Product, UserRole } from './types';
import { UploadIcon } from './components/icons/UploadIcon';
import { TagIcon } from './components/icons/TagIcon';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(UserRole.OBSERVER);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isCsvUploadModalOpen, setIsCsvUploadModalOpen] = useState<boolean>(false);
  const [isTariffModalOpen, setIsTariffModalOpen] = useState<boolean>(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [isUploadLogoModalOpen, setIsUploadLogoModalOpen] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);


  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        setLoading(true);
        setError(null);
        await connectAndInitialize();
        const [productData, logoData] = await Promise.all([getProducts(), getLogo()]);
        setProducts(productData);
        setFilteredProducts(productData);
        if (logoData) {
            setLogoSrc(logoData);
        }
      } catch (err) {
        setError('Failed to load initial data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    initializeAndFetch();
  }, []);

  const refreshProducts = (updatedProducts: Product[]) => {
      setProducts(updatedProducts);
       if (!searchTerm) {
          setFilteredProducts(updatedProducts);
      } else {
          const lowercasedTerm = searchTerm.toLowerCase();
          const filtered = updatedProducts.filter(product =>
            product.colorName.toLowerCase().includes(lowercasedTerm)
          );
          setFilteredProducts(filtered);
      }
  }

  const filterProducts = useCallback((term: string) => {
    setSearchTerm(term);
    if (!term) {
      setFilteredProducts(products);
    } else {
      const lowercasedTerm = term.toLowerCase();
      const filtered = products.filter(product =>
        product.colorName.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredProducts(filtered);
    }
  }, [products]);

  const handleRoleChangeRequest = (requestedRole: UserRole) => {
    if (requestedRole === UserRole.EDITOR) {
      if (userRole !== UserRole.EDITOR) {
        setLoginError(null);
        setIsPasswordModalOpen(true);
      }
    } else {
      setUserRole(UserRole.OBSERVER);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    setIsVerifying(true);
    setLoginError(null);
    try {
        const storedPassword = await getPassword();
        if (password === storedPassword) {
            setUserRole(UserRole.EDITOR);
            setIsPasswordModalOpen(false);
        } else {
            setLoginError('Incorrect password. Please try again.');
        }
    } catch {
        setLoginError('Could not verify password. Please try again.');
    } finally {
        setIsVerifying(false);
    }
  };
  
  const handleChangePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const storedPassword = await getPassword();
    if (currentPassword !== storedPassword) {
      throw new Error("Incorrect current password.");
    }
    await setPassword(newPassword);
  };

  const handleEditProduct = (product: Product) => {
    if (userRole === UserRole.EDITOR) {
      setEditingProduct(product);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setIsSaving(true);
    try {
      const savedProduct = await updateProductService(updatedProduct);
      const updatedProducts = products.map(p =>
        p.id === savedProduct.id ? savedProduct : p
      );
      refreshProducts(updatedProducts);
      setEditingProduct(null);
    } catch (err) {
      setError('Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCsvUpdate = async (updatedProductsFromCsv: Product[]) => {
      try {
        const updatedProducts = await batchUpdateProducts(updatedProductsFromCsv);
        refreshProducts(updatedProducts);
      } catch (err) {
        setError('Failed to update products from CSV.');
        throw err;
      }
  };

  const handleTariffUpdate = async (productsWithTariffs: Product[]) => {
      try {
          const updatedProducts = await batchUpdateProducts(productsWithTariffs);
          refreshProducts(updatedProducts);
      } catch (err) {
          setError('Failed to apply tariffs.');
          throw err;
      }
  };
  
  const handleLogoUpdate = async (logoBase64: string) => {
    try {
        await setLogo(logoBase64);
        setLogoSrc(logoBase64);
    } catch (err) {
        setError('Failed to save the logo.');
        throw err;
    }
  }

  const isEditor = userRole === UserRole.EDITOR;

  return (
    <div className="min-h-screen text-gray-800 dark:text-gray-200">
      <Header 
        userRole={userRole} 
        logoSrc={logoSrc}
        onRoleChangeRequest={handleRoleChangeRequest} 
        onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
        onUploadLogoClick={() => setIsUploadLogoModalOpen(true)}
      />
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Product Price List</h1>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <SearchBar onSearch={filterProducts} />
            {isEditor && (
                <div className="flex gap-2">
                    <button onClick={() => setIsTariffModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <TagIcon />
                        <span>Apply Tariff</span>
                    </button>
                    <button onClick={() => setIsCsvUploadModalOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                        <UploadIcon />
                        <span>Upload CSV</span>
                    </button>
                </div>
            )}
           </div>
        </div>

        {loading && <p className="text-center mt-8">Loading products...</p>}
        {error && <p className="text-center text-red-500 mt-8">{error}</p>}
        
        {!loading && !error && (
          <ProductList
            products={filteredProducts}
            userRole={userRole}
            onEdit={handleEditProduct}
          />
        )}
      </main>
      
      {editingProduct && (
        <EditPriceModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleUpdateProduct}
          isSaving={isSaving}
        />
      )}

      {isCsvUploadModalOpen && (
          <CsvUploadModal 
            onClose={() => setIsCsvUploadModalOpen(false)}
            onSave={handleCsvUpdate}
          />
      )}

      {isTariffModalOpen && (
          <TariffModal
            products={products}
            onClose={() => setIsTariffModalOpen(false)}
            onSave={handleTariffUpdate}
          />
      )}

      {isPasswordModalOpen && (
        <PasswordModal
          onClose={() => setIsPasswordModalOpen(false)}
          onSubmit={handlePasswordSubmit}
          isVerifying={isVerifying}
          error={loginError}
        />
      )}

      {isChangePasswordModalOpen && (
        <ChangePasswordModal
          onClose={() => setIsChangePasswordModalOpen(false)}
          onSave={handleChangePassword}
        />
      )}

      {isUploadLogoModalOpen && (
        <UploadLogoModal
            onClose={() => setIsUploadLogoModalOpen(false)}
            onSave={handleLogoUpdate}
        />
      )}
    </div>
  );
};

export default App;