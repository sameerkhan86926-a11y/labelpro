"use client";

import { useState } from "react";
import {
  addProduct,
  archiveProduct,
  deleteProduct,
  getProducts,
  restoreProduct,
  updateProduct,
  type StoredProduct,
} from "../lib/storage";

type ProductStatus = "Active" | "Archived" | "All";

const emptyForm = {
  name: "",
  sku: "",
  barcode: "",
  category: "",

  description: "",

  mrp: "",
  price: "",
  costPrice: "",

  stock: "",
  minimumStock: "",

  batchNumber: "",
  manufacturingDate: "",
  expiryDate: "",

  supplier: "",
  manufacturer: "",

  weight: "",
  unit: "",
  countryOfOrigin: "",

  productImage: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<StoredProduct[]>(() =>
    getProducts()
  );

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] =
    useState<StoredProduct | null>(null);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] =
    useState<ProductStatus>("Active");

  const [form, setForm] = useState(emptyForm);

  const categories = Array.from(
    new Set(
      products
        .map((product) => product.category.trim())
        .filter(Boolean)
    )
  ).sort();

  const filteredProducts = products.filter((product) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
  !searchText ||
  product.name.toLowerCase().includes(searchText) ||
  product.sku.toLowerCase().includes(searchText) ||
  product.barcode.toLowerCase().includes(searchText) ||
  product.category.toLowerCase().includes(searchText);

    const matchesCategory =
      categoryFilter === "All" ||
      product.category === categoryFilter;

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "Active" && !product.archived) ||
      (statusFilter === "Archived" && product.archived);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const activeCount = products.filter(
    (product) => !product.archived
  ).length;

  const archivedCount = products.filter(
    (product) => product.archived
  ).length;

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.name.trim() || !form.sku.trim()) {
      return;
    }

    const productData = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      category: form.category.trim(),

      description: form.description.trim(),

      mrp: form.mrp.trim(),
      price: form.price.trim(),
      costPrice: form.costPrice.trim(),

      stock: form.stock.trim(),
      minimumStock: form.minimumStock.trim(),

      batchNumber: form.batchNumber.trim(),
      manufacturingDate: form.manufacturingDate,
      expiryDate: form.expiryDate,

      supplier: form.supplier.trim(),
      manufacturer: form.manufacturer.trim(),

      weight: form.weight.trim(),
      unit: form.unit.trim(),
      countryOfOrigin: form.countryOfOrigin.trim(),

      productImage: form.productImage.trim(),
    };

    if (editingId) {
      const updatedProducts = updateProduct(
        editingId,
        productData
      );

      setProducts(updatedProducts);

      const updatedProduct = updatedProducts.find(
        (product) => product.id === editingId
      );

      if (updatedProduct) {
        setSelectedProduct(updatedProduct);
      }

      resetForm();
      return;
    }

    const product = addProduct(productData);

    setProducts((current) => [...current, product]);

    resetForm();

    setSelectedProduct(product);
  }

  function handleEdit(product: StoredProduct) {
    setSelectedProduct(null);
    setEditingId(product.id);

    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,

      description: product.description,

      mrp: product.mrp,
      price: product.price,
      costPrice: product.costPrice,

      stock: product.stock,
      minimumStock: product.minimumStock,

      batchNumber: product.batchNumber,
      manufacturingDate: product.manufacturingDate,
      expiryDate: product.expiryDate,

      supplier: product.supplier,
      manufacturer: product.manufacturer,

      weight: product.weight,
      unit: product.unit,
      countryOfOrigin: product.countryOfOrigin,

      productImage: product.productImage,
    });

    setShowForm(true);
  }

  function handleDuplicate(product: StoredProduct) {
    const duplicate = addProduct({
      name: `${product.name} Copy`,
      sku: `${product.sku}-COPY`,
      barcode: product.barcode,
      category: product.category,

      description: product.description,

      mrp: product.mrp,
      price: product.price,
      costPrice: product.costPrice,

      stock: product.stock,
      minimumStock: product.minimumStock,

      batchNumber: product.batchNumber,
      manufacturingDate: product.manufacturingDate,
      expiryDate: product.expiryDate,

      supplier: product.supplier,
      manufacturer: product.manufacturer,

      weight: product.weight,
      unit: product.unit,
      countryOfOrigin: product.countryOfOrigin,

      productImage: product.productImage,
    });

    setProducts((current) => [...current, duplicate]);
    setSelectedProduct(duplicate);
  }

  function handleArchive(product: StoredProduct) {
    const confirmed = window.confirm(
      `Archive "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    const updatedProducts = archiveProduct(product.id);

    setProducts(updatedProducts);

    const updatedProduct = updatedProducts.find(
      (item) => item.id === product.id
    );

    if (updatedProduct) {
      setSelectedProduct(updatedProduct);
    }
  }

  function handleRestore(product: StoredProduct) {
    const updatedProducts = restoreProduct(product.id);

    setProducts(updatedProducts);

    const updatedProduct = updatedProducts.find(
      (item) => item.id === product.id
    );

    if (updatedProduct) {
      setSelectedProduct(updatedProduct);
    }
  }

  function handleDeleteProduct(id: string) {
    const confirmed = window.confirm(
      "Permanent delete will remove this product completely. Continue?"
    );

    if (!confirmed) {
      return;
    }

    const updatedProducts = deleteProduct(id);

    setProducts(updatedProducts);
    setSelectedProduct(null);
  }

  function handleSelectProduct(product: StoredProduct) {
    setSelectedProduct(product);
    setShowForm(false);
    setEditingId(null);
  }
  function handleGenerateLabel(product: StoredProduct) {
  const params = new URLSearchParams({
    productId: String(product.id),
  });

  window.location.href =
    `/labelpro/labels/designer/?${params.toString()}`;
}

function handleGenerateBarcode(product: StoredProduct) {
  const params = new URLSearchParams({
    productId: String(product.id),
  });

  window.location.href =
    `/labelpro/barcodes/?${params.toString()}`;
}

  function formatDate(value: string) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  return (
    <main className="module-page">
      <section className="module-header">
        <div>
          <span className="eyebrow">
            PRODUCT MANAGEMENT
          </span>

          <h2>Products</h2>

          <p>
            Manage complete product master data including
            pricing, stock, batch, expiry, supplier and
            manufacturer information.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setSelectedProduct(null);
              setEditingId(null);
              setForm(emptyForm);
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Close Form" : "+ Add Product"}
        </button>
      </section>

      {selectedProduct && (
        <section className="product-detail-panel">
          <div className="product-detail-header">
            <div>
              <span className="section-label">
                PRODUCT DETAILS
              </span>

              <h3>{selectedProduct.name}</h3>

              <p>
                Complete product master information and
                available product actions.
              </p>
            </div>

            <button
              className="secondary-button"
              onClick={() => setSelectedProduct(null)}
            >
              Close
            </button>
          </div>

          <div className="product-detail-grid">
            <div className="detail-item">
              <span>Product Name</span>
              <strong>{selectedProduct.name}</strong>
            </div>

            <div className="detail-item">
              <span>SKU</span>
              <strong>{selectedProduct.sku}</strong>
            </div>

            <div className="detail-item">
              <span>Barcode</span>
              <strong>
                {selectedProduct.barcode ||
                  "Not assigned"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Category</span>
              <strong>
                {selectedProduct.category ||
                  "Not assigned"}
              </strong>
            </div>

            <div className="detail-item">
              <span>MRP</span>
              <strong>
                {selectedProduct.mrp
                  ? `₹${selectedProduct.mrp}`
                  : "Not set"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Selling Price</span>
              <strong>
                {selectedProduct.price
                  ? `₹${selectedProduct.price}`
                  : "Not set"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Cost Price</span>
              <strong>
                {selectedProduct.costPrice
                  ? `₹${selectedProduct.costPrice}`
                  : "Not set"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Stock</span>
              <strong>
                {selectedProduct.stock || "Not set"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Minimum Stock</span>
              <strong>
                {selectedProduct.minimumStock ||
                  "Not set"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Batch Number</span>
              <strong>
                {selectedProduct.batchNumber ||
                  "Not assigned"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Manufacturing Date</span>
              <strong>
                {selectedProduct.manufacturingDate ||
                  "Not set"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Expiry Date</span>
              <strong>
                {selectedProduct.expiryDate ||
                  "Not set"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Supplier</span>
              <strong>
                {selectedProduct.supplier ||
                  "Not assigned"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Manufacturer</span>
              <strong>
                {selectedProduct.manufacturer ||
                  "Not assigned"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Weight</span>
              <strong>
                {selectedProduct.weight || "Not set"}
                {selectedProduct.unit
                  ? ` ${selectedProduct.unit}`
                  : ""}
              </strong>
            </div>

            <div className="detail-item">
              <span>Country of Origin</span>
              <strong>
                {selectedProduct.countryOfOrigin ||
                  "Not set"}
              </strong>
            </div>

            <div className="detail-item">
              <span>Status</span>

              {selectedProduct.archived ? (
                <span className="status-badge archived">
                  Archived
                </span>
              ) : (
                <span className="status-badge active">
                  Active
                </span>
              )}
            </div>

            <div className="detail-item">
              <span>Product ID</span>
              <strong className="detail-id">
                {selectedProduct.id}
              </strong>
            </div>

            <div className="detail-item">
              <span>Created</span>
              <strong>
                {formatDate(
                  selectedProduct.createdAt
                )}
              </strong>
            </div>

            <div className="detail-item">
              <span>Last Updated</span>
              <strong>
                {formatDate(
                  selectedProduct.updatedAt
                )}
              </strong>
            </div>

            <div className="detail-item detail-description">
              <span>Description</span>
              <strong>
                {selectedProduct.description ||
                  "No description added"}
              </strong>
            </div>
          </div>

          <div className="product-detail-actions">
            {!selectedProduct.archived && (
              <>
                <button
                  className="primary-button"
                  onClick={() =>
                    handleEdit(selectedProduct)
                  }
                >
                  Edit Product
                </button>

                <button
                  className="table-action"
                  onClick={() =>
                    handleDuplicate(selectedProduct)
                  }
                >
                  Duplicate
                </button>

                <button
                  className="table-action"
                  onClick={() =>
                    handleArchive(selectedProduct)
                  }
                >
                  Archive
                </button>

               <button
  type="button"
  className="table-action"
  onClick={() => handleGenerateLabel(selectedProduct)}
>
  Generate Label
</button>

                <button
  type="button"
  className="table-action"
  onClick={() => handleGenerateBarcode(selectedProduct)}
>
  Generate Barcode
</button>
              </>
            )}

            {selectedProduct.archived && (
              <button
                className="primary-button"
                onClick={() =>
                  handleRestore(selectedProduct)
                }
              >
                Restore Product
              </button>
            )}

            <button
              className="delete-button"
              onClick={() =>
                handleDeleteProduct(
                  selectedProduct.id
                )
              }
            >
              Delete Permanently
            </button>
          </div>
        </section>
      )}

      {showForm && (
        <section className="product-form-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">
                {editingId
                  ? "EDIT PRODUCT"
                  : "NEW PRODUCT"}
              </span>

              <h3>
                {editingId
                  ? "Edit product"
                  : "Add product"}
              </h3>
            </div>
          </div>

          <form
            className="product-form"
            onSubmit={handleSubmit}
          >
            <div className="form-section-title">
              Basic Information
            </div>

            <div className="form-field">
              <label htmlFor="name">
                Product Name *
              </label>

              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="sku">
                SKU *
              </label>

              <input
                id="sku"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. PROD-001"
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="barcode">
                Barcode
              </label>

              <input
                id="barcode"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="Enter barcode"
              />
            </div>

            <div className="form-field">
              <label htmlFor="category">
                Category
              </label>

              <input
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Cosmetics"
              />
            </div>

            <div className="form-field form-field-wide">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter product description"
                rows={4}
              />
            </div>

            <div className="form-section-title">
              Pricing & Inventory
            </div>

            <div className="form-field">
              <label htmlFor="mrp">
                MRP
              </label>

              <input
                id="mrp"
                name="mrp"
                value={form.mrp}
                onChange={handleChange}
                placeholder="e.g. 599"
                inputMode="decimal"
              />
            </div>

            <div className="form-field">
              <label htmlFor="price">
                Selling Price
              </label>

              <input
                id="price"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="e.g. 499"
                inputMode="decimal"
              />
            </div>

            <div className="form-field">
              <label htmlFor="costPrice">
                Cost Price
              </label>

              <input
                id="costPrice"
                name="costPrice"
                value={form.costPrice}
                onChange={handleChange}
                placeholder="e.g. 350"
                inputMode="decimal"
              />
            </div>

            <div className="form-field">
              <label htmlFor="stock">
                Stock
              </label>

              <input
                id="stock"
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="e.g. 100"
                inputMode="numeric"
              />
            </div>

            <div className="form-field">
              <label htmlFor="minimumStock">
                Minimum Stock
              </label>

              <input
                id="minimumStock"
                name="minimumStock"
                value={form.minimumStock}
                onChange={handleChange}
                placeholder="e.g. 10"
                inputMode="numeric"
              />
            </div>

            <div className="form-section-title">
              Batch & Expiry
            </div>

            <div className="form-field">
              <label htmlFor="batchNumber">
                Batch Number
              </label>

              <input
                id="batchNumber"
                name="batchNumber"
                value={form.batchNumber}
                onChange={handleChange}
                placeholder="e.g. BATCH-2026-01"
              />
            </div>

            <div className="form-field">
              <label htmlFor="manufacturingDate">
                Manufacturing Date
              </label>

              <input
                id="manufacturingDate"
                name="manufacturingDate"
                type="date"
                value={form.manufacturingDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="expiryDate">
                Expiry Date
              </label>

              <input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-section-title">
              Supplier & Manufacturer
            </div>

            <div className="form-field">
              <label htmlFor="supplier">
                Supplier
              </label>

              <input
                id="supplier"
                name="supplier"
                value={form.supplier}
                onChange={handleChange}
                placeholder="Supplier name"
              />
            </div>

            <div className="form-field">
              <label htmlFor="manufacturer">
                Manufacturer
              </label>

              <input
                id="manufacturer"
                name="manufacturer"
                value={form.manufacturer}
                onChange={handleChange}
                placeholder="Manufacturer name"
              />
            </div>

            <div className="form-section-title">
              Packaging & Origin
            </div>

            <div className="form-field">
              <label htmlFor="weight">
                Weight
              </label>

              <input
                id="weight"
                name="weight"
                value={form.weight}
                onChange={handleChange}
                placeholder="e.g. 500"
                inputMode="decimal"
              />
            </div>

            <div className="form-field">
              <label htmlFor="unit">
                Unit
              </label>

              <input
                id="unit"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                placeholder="e.g. g, kg, ml, pcs"
              />
            </div>

            <div className="form-field">
              <label htmlFor="countryOfOrigin">
                Country of Origin
              </label>

              <input
                id="countryOfOrigin"
                name="countryOfOrigin"
                value={form.countryOfOrigin}
                onChange={handleChange}
                placeholder="e.g. India"
              />
            </div>

            <div className="form-field form-field-wide">
              <label htmlFor="productImage">
                Product Image URL
              </label>

              <input
                id="productImage"
                name="productImage"
                value={form.productImage}
                onChange={handleChange}
                placeholder="https://example.com/product.jpg"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
              >
                {editingId
                  ? "Update Product"
                  : "Save Product"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="product-list-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">
              PRODUCT CATALOG
            </span>

            <h3>Product overview</h3>
          </div>

          <span className="section-note">
            {activeCount} active · {archivedCount} archived
          </span>
        </div>

        <div className="product-toolbar">
          <input
            className="product-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search product, SKU, barcode or category..."
          />

          <select
            className="category-filter"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(event.target.value)
            }
          >
            <option value="All">
              All Categories
            </option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            className="category-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as ProductStatus
              )
            }
          >
            <option value="Active">
              Active Products
            </option>

            <option value="Archived">
              Archived Products
            </option>

            <option value="All">
              All Products
            </option>
          </select>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">□</div>

            <strong>No products yet</strong>

            <p>
              Add your first product to start creating
              barcodes, labels and printable product
              information.
            </p>

            <button
              className="primary-button"
              onClick={() => setShowForm(true)}
            >
              + Add First Product
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⌕</div>

            <strong>
              No matching products
            </strong>

            <p>
              Try another search, category or product
              status.
            </p>
          </div>
        ) : (
          <div className="product-table-wrapper">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Barcode</th>
                  <th>Category</th>
                  <th>MRP</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <button
                        className="product-name-button"
                        onClick={() =>
                          handleSelectProduct(product)
                        }
                      >
                        {product.name}
                      </button>
                    </td>

                    <td>{product.sku}</td>

                    <td>
                      {product.barcode || "—"}
                    </td>

                    <td>
                      {product.category || "—"}
                    </td>

                    <td>
                      {product.mrp
                        ? `₹${product.mrp}`
                        : "—"}
                    </td>

                    <td>
                      {product.price
                        ? `₹${product.price}`
                        : "—"}
                    </td>

                    <td>
                      {product.stock || "—"}
                    </td>

                    <td>
                      {product.archived ? (
                        <span className="status-badge archived">
                          Archived
                        </span>
                      ) : (
                        <span className="status-badge active">
                          Active
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="product-actions">
                        <button
                          className="table-action"
                          onClick={() =>
                            handleSelectProduct(product)
                          }
                        >
                          View
                        </button>

                        {!product.archived && (
                          <>
                            <button
                              className="table-action"
                              onClick={() =>
                                handleEdit(product)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="table-action"
                              onClick={() =>
                                handleDuplicate(product)
                              }
                            >
                              Duplicate
                            </button>

                            <button
                              className="table-action"
                              onClick={() =>
                                handleArchive(product)
                              }
                            >
                              Archive
                            </button>
                          </>
                        )}

                        {product.archived && (
                          <button
                            className="table-action"
                            onClick={() =>
                              handleRestore(product)
                            }
                          >
                            Restore
                          </button>
                        )}

                        <button
                          className="delete-button"
                          onClick={() =>
                            handleDeleteProduct(
                              product.id
                            )
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
