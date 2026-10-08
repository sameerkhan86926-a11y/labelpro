export type StoredProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;

  description: string;

  mrp: string;
  price: string;
  costPrice: string;

  stock: string;
  minimumStock: string;

  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;

  supplier: string;
  manufacturer: string;

  weight: string;
  unit: string;
  countryOfOrigin: string;

  productImage: string;

  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

const PRODUCTS_KEY = "labelpro_products";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getProducts(): StoredProduct[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(PRODUCTS_KEY);

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((product) => ({
      id: product.id ?? "",
      name: product.name ?? "",
      sku: product.sku ?? "",
      barcode: product.barcode ?? "",
      category: product.category ?? "",

      description: product.description ?? "",

      mrp: product.mrp ?? "",
      price: product.price ?? "",
      costPrice: product.costPrice ?? "",

      stock: product.stock ?? "",
      minimumStock: product.minimumStock ?? "",

      batchNumber: product.batchNumber ?? "",
      manufacturingDate: product.manufacturingDate ?? "",
      expiryDate: product.expiryDate ?? "",

      supplier: product.supplier ?? "",
      manufacturer: product.manufacturer ?? "",

      weight: product.weight ?? "",
      unit: product.unit ?? "",
      countryOfOrigin: product.countryOfOrigin ?? "",

      productImage: product.productImage ?? "",

      archived: product.archived === true,

      createdAt: product.createdAt ?? "",
      updatedAt: product.updatedAt ?? "",
    }));
  } catch {
    return [];
  }
}

export function saveProducts(products: StoredProduct[]) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(
    PRODUCTS_KEY,
    JSON.stringify(products)
  );
}

export function addProduct(
  product: Omit<
    StoredProduct,
    "id" | "createdAt" | "updatedAt" | "archived"
  >
) {
  const products = getProducts();

  const now = new Date().toISOString();

  const newProduct: StoredProduct = {
    ...product,
    id: crypto.randomUUID(),
    archived: false,
    createdAt: now,
    updatedAt: now,
  };

  const updatedProducts = [...products, newProduct];

  saveProducts(updatedProducts);

  return newProduct;
}

export function deleteProduct(id: string) {
  const products = getProducts();

  const updatedProducts = products.filter(
    (product) => product.id !== id
  );

  saveProducts(updatedProducts);

  return updatedProducts;
}

export function archiveProduct(id: string) {
  const products = getProducts();

  const updatedProducts = products.map((product) => {
    if (product.id !== id) {
      return product;
    }

    return {
      ...product,
      archived: true,
      updatedAt: new Date().toISOString(),
    };
  });

  saveProducts(updatedProducts);

  return updatedProducts;
}

export function restoreProduct(id: string) {
  const products = getProducts();

  const updatedProducts = products.map((product) => {
    if (product.id !== id) {
      return product;
    }

    return {
      ...product,
      archived: false,
      updatedAt: new Date().toISOString(),
    };
  });

  saveProducts(updatedProducts);

  return updatedProducts;
}

export function updateProduct(
  id: string,
  updates: Partial<
    Omit<StoredProduct, "id" | "createdAt" | "updatedAt">
  >
) {
  const products = getProducts();

  const updatedProducts = products.map((product) => {
    if (product.id !== id) {
      return product;
    }

    return {
      ...product,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  });

  saveProducts(updatedProducts);

  return updatedProducts;
}

export function clearProducts() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(PRODUCTS_KEY);
}
