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

export default function ProductsPage() {
  const [products, setProducts] = useState<StoredProduct[]>(() =>
    getProducts()
  );

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] =
    useState<ProductStatus>("Active");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    price: "",
    stock: "",
  });

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
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      name: "",
      sku: "",
      barcode: "",
      category: "",
      price: "",
      stock: "",
    });

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

    if (editingId) {
      const updatedProducts = updateProduct(editingId, {
        name: form.name.trim(),
        sku: form.sku.trim(),
        barcode: form.barcode.trim(),
        category: form.category.trim(),
        price: form.price.trim(),
        stock: form.stock.trim(),
      });

      setProducts(updatedProducts);
      resetForm();
      return;
    }

    const product = addProduct({
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      category: form.category.trim(),
      price: form.price.trim(),
      stock: form.stock.trim(),
    });

    setProducts((current) => [...current, product]);
    resetForm();
  }

  function handleEdit(product: StoredProduct) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode,
      category: product.category,
      price: product.price,
      stock: product.stock,
    });

    setShowForm(true);
  }

  function handleDuplicate(product: StoredProduct) {
    const duplicate = addProduct({
      name: `${product.name} Copy`,
      sku: `${product.sku}-COPY`,
      barcode: product.barcode,
      category: product.category,
      price: product.price,
      stock: product.stock,
    });

    setProducts((current) => [...current, duplicate]);
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
  }

  function handleRestore(product: StoredProduct) {
    const updatedProducts = restoreProduct(product.id);

    setProducts(updatedProducts);
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
  }

  return (
    <main className="module-page">
      <section className="module-header">
        <div>
          <span className="eyebrow">PRODUCT MANAGEMENT</span>

          <h2>Products</h2>

          <p>
            Manage products, SKUs, barcodes, pricing and stock
            information from one workspace.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingId(null);
              setShowForm(true);
            }
          }}
        >
          {showForm ? "Close Form" : "+ Add Product"}
        </button>
      </section>

      <section className="product-list-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">PRODUCT CATALOG</span>

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
            <option value="All">All Categories</option>

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
                      <strong>{product.name}</strong>
                    </td>

                    <td>{product.sku}</td>

                    <td>
                      {product.barcode || "—"}
                    </td>

                    <td>
                      {product.category || "—"}
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
