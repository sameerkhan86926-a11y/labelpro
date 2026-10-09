"use client";

import { useRef, useState } from "react";
import {
  downloadCsv,
  createProductCsvTemplate,
  exportProductsToCsv,
  getValidImportProducts,
  previewProductCsv,
} from "../lib/product-csv";
import {
  getProducts,
  saveProducts,
  type StoredProduct,
} from "../lib/storage";
import type {
  ProductImportResult,
  ProductImportRow,
} from "../lib/product-csv";

export default function ImportExportPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<StoredProduct[]>([]);
  const [preview, setPreview] = useState<ProductImportResult | null>(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isReading, setIsReading] = useState(false);

  function loadProducts() {
    const storedProducts = getProducts();
    setProducts(storedProducts);
    return storedProducts;
  }

  function handleExport() {
    try {
      const currentProducts = loadProducts();

      if (currentProducts.length === 0) {
        setErrorMessage("Export karne ke liye koi product nahi hai.");
        setMessage("");
        return;
      }

      downloadCsv(
        "labelpro-products.csv",
        exportProductsToCsv(currentProducts),
      );

      setMessage(`${currentProducts.length} products CSV mein export ho gaye.`);
      setErrorMessage("");
    } catch {
      setErrorMessage("CSV export nahi ho paya. Dobara try karein.");
      setMessage("");
    }
  }

  function handleDownloadTemplate() {
    try {
      downloadCsv(
        "labelpro-product-template.csv",
        createProductCsvTemplate(),
      );

      setMessage("CSV template download ho gaya.");
      setErrorMessage("");
    } catch {
      setErrorMessage("CSV template download nahi ho paya.");
      setMessage("");
    }
  }

  async function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    setMessage("");
    setErrorMessage("");
    setPreview(null);

    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("Sirf .csv file upload karein.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File 10 MB se chhoti honi chahiye.");
      event.target.value = "";
      return;
    }

    setFileName(file.name);
    setIsReading(true);

    try {
      const text = await file.text();
      const currentProducts = getProducts();

      setProducts(currentProducts);

      const result = previewProductCsv(text, currentProducts);

      setPreview(result);
      setMessage("CSV validate ho gayi. Import se pehle preview check karein.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "CSV file read nahi ho payi.",
      );
    } finally {
      setIsReading(false);
    }
  }

  function handleImport() {
    if (!preview) return;

    const validRows = getValidImportProducts(preview);

    if (validRows.length === 0) {
      setErrorMessage("Import karne ke liye koi valid product nahi hai.");
      setMessage("");
      return;
    }

    const confirmed = window.confirm(
      `${validRows.length} naye products import honge.\n\n` +
        `${preview.errorCount} invalid rows skip hongi.\n\n` +
        "Existing products overwrite nahi honge. Kya aap continue karna chahte hain?",
    );

    if (!confirmed) return;

    try {
      // Recheck against current storage before committing.
      const currentProducts = getProducts();

      const refreshedPreview = previewProductCsv(
        createCsvFromProducts(validRows),
        currentProducts,
      );

      const productsToImport = getValidImportProducts(refreshedPreview);

      if (productsToImport.length === 0) {
        setPreview(refreshedPreview);
        setErrorMessage(
          "Import nahi hua. Products mein duplicate SKU ya barcode mil sakta hai. Preview dobara check karein.",
        );
        setMessage("");
        return;
      }

      const now = new Date().toISOString();

      const newProducts: StoredProduct[] = productsToImport.map(
        (product: ProductImportRow) => ({
          ...product,
          id: crypto.randomUUID(),
          archived: false,
          createdAt: now,
          updatedAt: now,
        }),
      );

      saveProducts([...currentProducts, ...newProducts]);

      setProducts(getProducts());
      setPreview(null);
      setFileName("");
      setMessage(
        `Successfully ${newProducts.length} products import ho gaye. ${
          refreshedPreview.errorCount
        } invalid rows skip hui.`,
      );
      setErrorMessage("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import save nahi ho paya.",
      );
      setMessage("");
    }
  }

  function createCsvFromProducts(
    rows: ProductImportRow[],
  ): string {
    const headers = [
      "name",
      "sku",
      "barcode",
      "category",
      "description",
      "mrp",
      "price",
      "costPrice",
      "stock",
      "minimumStock",
      "batchNumber",
      "manufacturingDate",
      "expiryDate",
      "supplier",
      "manufacturer",
      "weight",
      "unit",
      "countryOfOrigin",
      "productImage",
    ] as const;

    function escapeValue(value: string) {
      return `"${String(value ?? "").replace(/"/g, '""')}"`;
    }

    const csvRows = rows.map((product) =>
      headers
        .map((header) => escapeValue(product[header]))
        .join(","),
    );

    return [
      headers.join(","),
      ...csvRows,
    ].join("\r\n");
  }

  return (
    <main className="ie-page">
      <header className="ie-header">
        <div>
          <p className="ie-breadcrumb">LabelPro / Data Management</p>
          <h1>Import & Export</h1>
          <p className="ie-subtitle">
            Manage product data using CSV files.
          </p>
        </div>
        <div className="ie-count">
          <span>Saved Products</span>
          <strong>{products.length}</strong>
        </div>
      </header>

      {message && (
        <div className="ie-message" role="status">
          {message}
        </div>
      )}

      {errorMessage && (
        <div className="ie-error" role="alert">
          {errorMessage}
        </div>
      )}

      <section className="ie-cards">
        <article className="ie-card">
          <div className="ie-card-icon">↑</div>
          <h2>Import Products</h2>
          <p>
            Upload a CSV file, validate product details and review errors
            before importing.
          </p>

          <label className="ie-upload-button">
            {isReading ? "Reading CSV..." : "Choose CSV File"}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={isReading}
            />
          </label>

          {fileName && (
            <p className="ie-file-name">
              Selected: {fileName}
            </p>
          )}

          <button
            type="button"
            className="ie-secondary-button"
            onClick={handleDownloadTemplate}
          >
            Download CSV Template
          </button>
        </article>

        <article className="ie-card">
          <div className="ie-card-icon">↓</div>
          <h2>Export Products</h2>
          <p>
            Download your saved product records in CSV format for
            spreadsheets and backups.
          </p>

          <div className="ie-export-count">
            {products.length} saved products
          </div>

          <button
            type="button"
            className="ie-primary-button"
            onClick={handleExport}
          >
            Export All Products
          </button>

          <button
            type="button"
            className="ie-secondary-button"
            onClick={handleDownloadTemplate}
          >
            Download Blank Template
          </button>
        </article>
      </section>

      {preview && (
        <section className="ie-preview-section">
          <div className="ie-preview-header">
            <div>
              <h2>Import Preview</h2>
              <p>
                Check valid products and errors before saving.
              </p>
            </div>

            <button
              type="button"
              className="ie-primary-button"
              onClick={handleImport}
              disabled={preview.validCount === 0}
            >
              Import {preview.validCount} Valid Products
            </button>
          </div>

          <div className="ie-stats">
            <div className="ie-stat">
              <span>Total Rows</span>
              <strong>{preview.totalRows}</strong>
            </div>
            <div className="ie-stat ie-stat-success">
              <span>Valid Rows</span>
              <strong>{preview.validCount}</strong>
            </div>
            <div className="ie-stat ie-stat-danger">
              <span>Error Rows</span>
              <strong>{preview.errorCount}</strong>
            </div>
          </div>

          <div className="ie-table-wrap">
            <table className="ie-table">
              <thead>
                <tr>
                  <th>CSV Row</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Barcode</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status / Errors</th>
                </tr>
              </thead>

              <tbody>
                {preview.rows.map((item) => (
                  <tr
                    key={item.row}
                    className={item.valid ? "" : "ie-invalid-row"}
                  >
                    <td>{item.row}</td>
                    <td>{item.product.name || "—"}</td>
                    <td>{item.product.sku || "—"}</td>
                    <td>{item.product.barcode || "—"}</td>
                    <td>
                      {item.product.price
                        ? `₹${item.product.price}`
                        : "—"}
                    </td>
                    <td>{item.product.stock || "—"}</td>
                    <td>
                      {item.valid ? (
                        <span className="ie-status-valid">
                          Valid
                        </span>
                      ) : (
                        <div className="ie-row-errors">
                          {item.errors.map((error, index) => (
                            <div key={`${error.field}-${index}`}>
                              <strong>{error.field}:</strong>{" "}
                              {error.message}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {preview.rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="ie-no-data">
                      CSV file mein koi product row nahi mili.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <p className="ie-footnote">
            Invalid rows import nahi hongi. Import karne se pehle
            duplicate SKU aur barcode errors resolve karna recommended hai.
          </p>
        </section>
      )}
    </main>
  );
}
