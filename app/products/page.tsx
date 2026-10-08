"use client";

import { useState } from "react";

type Product = {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: string;
  stock: string;
};

const initialProducts: Product[] = [];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    barcode: "",
    category: "",
    price: "",
    stock: "",
  });

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function addProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.sku.trim()) {
      return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      sku: form.sku.trim(),
      barcode: form.barcode.trim(),
      category: form.category.trim(),
      price: form.price.trim(),
      stock: form.stock.trim(),
    };

    setProducts((current) => [...current, newProduct]);

    setForm({
      name: "",
      sku: "",
      barcode: "",
      category: "",
      price: "",
      stock: "",
    });

    setShowForm(false);
  }

  function deleteProduct(id: string) {
    setProducts((current) =>
      current.filter((product) => product.id !== id)
    );
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
          onClick={() => setShowForm((current) => !current)}
        >
          {showForm ? "Close Form" : "+ Add Product"}
        </button>
      </section>

      {showForm && (
        <section className="product-form-panel">
          <div className="panel-heading">
            <div>
              <span className="section-label">NEW PRODUCT</span>
              <h3>Add product</h3>
            </div>
          </div>

          <form className="product-form" onSubmit={addProduct}>
            <div className="form-field">
              <label htmlFor="name">Product Name *</label>

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
              <label htmlFor="sku">SKU *</label>

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
              <label htmlFor="barcode">Barcode</label>

              <input
                id="barcode"
                name="barcode"
                value={form.barcode}
                onChange={handleChange}
                placeholder="Enter barcode"
              />
            </div>

            <div className="form-field">
              <label htmlFor="category">Category</label>

              <input
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Cosmetics"
              />
            </div>

            <div className="form-field">
              <label htmlFor="price">Selling Price</label>

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
              <label htmlFor="stock">Stock</label>

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
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button type="submit" className="primary-button">
                Save Product
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="product-list-panel">
        <div className="panel-heading">
          <div>
            <span className="section-label">PRODUCT CATALOG</span>
            <h3>All products</h3>
          </div>

          <span className="section-note">
            {products.length} product
            {products.length === 1 ? "" : "s"}
          </span>
        </div>

        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">□</div>

            <strong>No products yet</strong>

            <p>
              Add your first product to start creating barcodes,
              labels and printable product information.
            </p>

            <button
              className="primary-button"
              onClick={() => setShowForm(true)}
            >
              + Add First Product
            </button>
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
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                    </td>

                    <td>{product.sku}</td>

                    <td>{product.barcode || "—"}</td>

                    <td>{product.category || "—"}</td>

                    <td>
                      {product.price
                        ? `₹${product.price}`
                        : "—"}
                    </td>

                    <td>{product.stock || "—"}</td>

                    <td>
                      <button
                        className="delete-button"
                        onClick={() => deleteProduct(product.id)}
                      >
                        Delete
                      </button>
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
