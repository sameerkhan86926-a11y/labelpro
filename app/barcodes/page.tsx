"use client";

import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import {
  getProducts,
  updateProduct,
  type StoredProduct,
} from "../lib/storage";

type BarcodeFormat =
  | "CODE128"
  | "CODE39"
  | "EAN13"
  | "EAN8"
  | "UPC"
  | "ITF14";

const formats: { value: BarcodeFormat; label: string }[] = [
  { value: "CODE128", label: "CODE 128" },
  { value: "CODE39", label: "CODE 39" },
  { value: "EAN13", label: "EAN-13" },
  { value: "EAN8", label: "EAN-8" },
  { value: "UPC", label: "UPC-A" },
  { value: "ITF14", label: "ITF-14" },
];

const defaults: Record<BarcodeFormat, string> = {
  CODE128: "LABELPRO-001",
  CODE39: "LABELPRO001",
  EAN13: "8901234567890",
  EAN8: "12345670",
  UPC: "123456789012",
  ITF14: "10012345678902",
};

export default function BarcodesPage() {
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  const [products, setProducts] = useState<StoredProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [value, setValue] = useState(defaults.CODE128);
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(80);
  const [fontSize, setFontSize] = useState(14);
  const [margin, setMargin] = useState(10);
  const [displayValue, setDisplayValue] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [bulkMode, setBulkMode] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProducts(getProducts().filter((p) => !p.archived));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const svg = barcodeRef.current;

    if (!svg) return;

    svg.innerHTML = "";

    if (!value.trim()) {
      setError("");
      return;
    }

    try {
      JsBarcode(svg, value.trim(), {
        format,
        width,
        height,
        displayValue,
        fontSize,
        margin,
        textMargin: 5,
        font: "Arial",
        background: "#ffffff",
        lineColor: "#111827",
      });

      setError("");
    } catch {
      setError(
        `Invalid value for ${format}. Please check the value and try again.`
      );
    }
  }, [value, format, width, height, fontSize, margin, displayValue]);

  function changeFormat(next: BarcodeFormat) {
    setFormat(next);
    setValue(defaults[next]);
    setError("");
    setSuccess("");
  }

  function chooseProduct(id: string) {
    setSelectedProductId(id);
    setError("");
    setSuccess("");

    if (!id) return;

    const product = products.find((p) => String(p.id) === id);

    if (product) {
      setValue(product.barcode || product.sku || "");
    }
  }

  function toggleProduct(id: string) {
    setSelectedIds((old) =>
      old.includes(id) ? old.filter((x) => x !== id) : [...old, id]
    );
  }

  function saveBarcode() {
    if (!selectedProductId) {
      setError("Please select a product first.");
      return;
    }

    if (!value.trim()) {
      setError("Enter a barcode value first.");
      return;
    }

    try {
      updateProduct(selectedProductId, { barcode: value.trim() });
      setProducts(getProducts().filter((p) => !p.archived));
      setSuccess("Barcode saved to product successfully.");
      setError("");
    } catch {
      setError("Unable to save barcode. Please try again.");
    }
  }

  function downloadSvg(svg: SVGSVGElement, filename: string) {
    const clone = svg.cloneNode(true) as SVGSVGElement;

    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const blob = new Blob(
      [new XMLSerializer().serializeToString(clone)],
      { type: "image/svg+xml;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  function downloadBarcode() {
    if (error || !barcodeRef.current || !value.trim()) {
      setError("Generate a valid barcode before downloading.");
      return;
    }

    downloadSvg(barcodeRef.current, "labelpro-barcode.svg");
  }

  function printCurrentBarcode() {
    if (error || !barcodeRef.current || !value.trim()) {
      setError("Generate a valid barcode before printing.");
      return;
    }

    const svg = barcodeRef.current.cloneNode(true) as SVGSVGElement;
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const popup = window.open("", "_blank", "width=700,height=500");

    if (!popup) {
      setError("Please allow pop-ups to print your barcode.");
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>LabelPro Barcode</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            svg { max-width: 100%; height: auto; }
            @page { margin: 10mm; }
          </style>
        </head>
        <body>
          ${svg.outerHTML}
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    popup.document.close();
  }

  function printBulk() {
    if (!selectedIds.length) {
      setError("Select at least one product for bulk printing.");
      return;
    }

    const selectedProducts = products.filter((p) =>
      selectedIds.includes(String(p.id))
    );

    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      setError("Please allow pop-ups to print barcodes.");
      return;
    }

    const labels = selectedProducts
      .map((product) => {
        const barcodeValue = product.barcode || product.sku;

        if (!barcodeValue) return "";

        const id = String(product.id);
        const svgId = `barcode-${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;

        return `
          <article class="label">
            <strong>${escapeHtml(product.name)}</strong>
            <svg id="${svgId}"></svg>
            <small>${escapeHtml(barcodeValue)}</small>
          </article>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>LabelPro Bulk Barcodes</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 10mm; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8mm; }
            .label { text-align: center; border: 1px solid #ddd; padding: 8px; break-inside: avoid; }
            .label strong, .label small { display: block; overflow-wrap: anywhere; margin: 5px 0; }
            svg { max-width: 100%; height: auto; }
            @media print { .grid { gap: 5mm; } }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          <div class="grid">${labels}</div>
          <script>
            window.onload = function () {
              const items = ${JSON.stringify(
                selectedProducts
                  .filter((p) => p.barcode || p.sku)
                  .map((p) => ({
                    id: `barcode-${String(p.id).replace(/[^a-zA-Z0-9_-]/g, "")}`,
                    value: p.barcode || p.sku,
                  }))
              )};

              items.forEach(item => {
                try {
                  JsBarcode("#" + item.id, item.value, {
                    format: "CODE128",
                    width: 2,
                    height: 55,
                    displayValue: true,
                    margin: 8
                  });
                } catch (e) {
                  const node = document.getElementById(item.id);
                  if (node) node.outerHTML = "<p>Invalid barcode value</p>";
                }
              });

              setTimeout(() => window.print(), 500);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
    setError("");
  }

  function escapeHtml(text: string) {
    return text.replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[char];
    });
  }

  function clearGenerator() {
    setSelectedProductId("");
    setSelectedIds([]);
    setFormat("CODE128");
    setValue(defaults.CODE128);
    setError("");
    setSuccess("");
  }

  const selectedProducts = products.filter((p) =>
    selectedIds.includes(String(p.id))
  );

  return (
    <main className="module-page barcode-page">
      <header className="module-header">
        <div>
          <span className="eyebrow">LABELPRO / BARCODE TOOLS</span>
          <h1>Barcode Generator</h1>
          <p>
            Generate, customize, save, download and print product
            barcodes. You can also print barcodes for multiple products.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={clearGenerator}
        >
          Clear
        </button>
      </header>

      <nav className="barcode-tabs" aria-label="Barcode modes">
        <button
          type="button"
          className={!bulkMode ? "active" : ""}
          onClick={() => setBulkMode(false)}
        >
          Single Barcode
        </button>
        <button
          type="button"
          className={bulkMode ? "active" : ""}
          onClick={() => setBulkMode(true)}
        >
          Bulk Printing
        </button>
      </nav>

      {bulkMode ? (
        <section className="barcode-bulk-panel">
          <div className="barcode-panel-title">
            <div>
              <span className="eyebrow">MULTI-PRODUCT PRINTING</span>
              <h2>Select Products</h2>
              <p>
                Select products that already have a barcode or SKU.
                Bulk printing uses CODE128.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setSelectedIds(
                  selectedIds.length === products.length
                    ? []
                    : products.map((p) => String(p.id))
                )
              }
            >
              {selectedIds.length === products.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          {products.length === 0 ? (
            <div className="barcode-empty">
              <strong>No products found</strong>
              <span>Add products first to generate their barcodes.</span>
            </div>
          ) : (
            <div className="barcode-product-list">
              {products.map((product) => {
                const id = String(product.id);
                const hasValue = Boolean(product.barcode || product.sku);

                return (
                  <label className="barcode-product-row" key={id}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(id)}
                      onChange={() => toggleProduct(id)}
                    />
                    <span className="barcode-product-name">
                      <strong>{product.name}</strong>
                      <small>
                        {product.barcode || product.sku || "No barcode or SKU"}
                      </small>
                    </span>
                    <span
                      className={`barcode-status ${hasValue ? "ready" : "missing"}`}
                    >
                      {hasValue ? "Ready" : "Missing value"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="barcode-bulk-footer">
            <span>{selectedIds.length} products selected</span>
            <button
              type="button"
              className="primary-button"
              onClick={printBulk}
              disabled={
                !selectedProducts.some((p) => p.barcode || p.sku)
              }
            >
              Print Selected Barcodes
            </button>
          </div>
        </section>
      ) : (
        <section className="barcode-workspace">
          <div className="barcode-controls-panel">
            <div className="barcode-panel-title">
              <div>
                <span className="eyebrow">BARCODE SETUP</span>
                <h2>Configure Barcode</h2>
              </div>
            </div>

            <div className="barcode-form">
              <div className="form-field barcode-wide">
                <label htmlFor="barcode-product">Product</label>
                <select
                  id="barcode-product"
                  value={selectedProductId}
                  onChange={(event) => chooseProduct(event.target.value)}
                >
                  <option value="">Manual barcode</option>
                  {products.map((product) => (
                    <option key={String(product.id)} value={String(product.id)}>
                      {product.name}
                      {product.sku ? ` — ${product.sku}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="barcode-format">Barcode Format</label>
                <select
                  id="barcode-format"
                  value={format}
                  onChange={(event) =>
                    changeFormat(event.target.value as BarcodeFormat)
                  }
                >
                  {formats.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="barcode-value">Barcode Value</label>
                <input
                  id="barcode-value"
                  value={value}
                  onChange={(event) => {
                    setValue(event.target.value);
                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Enter barcode value"
                />
              </div>

              <div className="form-section-title">Appearance</div>

              <div className="form-field">
                <label htmlFor="barcode-width">Bar Width</label>
                <input
                  id="barcode-width"
                  type="number"
                  min="1"
                  max="5"
                  value={width}
                  onChange={(event) =>
                    setWidth(Math.min(5, Math.max(1, Number(event.target.value) || 1)))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="barcode-height">Height</label>
                <input
                  id="barcode-height"
                  type="number"
                  min="30"
                  max="200"
                  step="5"
                  value={height}
                  onChange={(event) =>
                    setHeight(Math.min(200, Math.max(30, Number(event.target.value) || 80)))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="barcode-font-size">Text Size</label>
                <input
                  id="barcode-font-size"
                  type="number"
                  min="8"
                  max="30"
                  value={fontSize}
                  onChange={(event) =>
                    setFontSize(Math.min(30, Math.max(8, Number(event.target.value) || 14)))
                  }
                />
              </div>

              <div className="form-field">
                <label htmlFor="barcode-margin">Margin</label>
                <input
                  id="barcode-margin"
                  type="number"
                  min="0"
                  max="40"
                  value={margin}
                  onChange={(event) =>
                    setMargin(Math.min(40, Math.max(0, Number(event.target.value) || 0)))
                  }
                />
              </div>

              <label className="barcode-checkbox">
                <input
                  type="checkbox"
                  checked={displayValue}
                  onChange={(event) => setDisplayValue(event.target.checked)}
                />
                <span>Show value below barcode</span>
              </label>

              {error && (
                <div className="barcode-message barcode-error">{error}</div>
              )}

              {success && (
                <div className="barcode-message barcode-success">{success}</div>
              )}

              <div className="barcode-form-actions">
                {selectedProductId && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={saveBarcode}
                  >
                    Save to Product
                  </button>
                )}
                <button
                  type="button"
                  className="secondary-button"
                  onClick={downloadBarcode}
                  disabled={Boolean(error) || !value.trim()}
                >
                  Download SVG
                </button>
                <button
                  type="button"
                  className="primary-button"
                  onClick={printCurrentBarcode}
                  disabled={Boolean(error) || !value.trim()}
                >
                  Print Barcode
                </button>
              </div>
            </div>
          </div>

          <div className="barcode-preview-panel">
            <div className="barcode-panel-title">
              <div>
                <span className="eyebrow">LIVE PREVIEW</span>
                <h2>Barcode Preview</h2>
              </div>
              <span className="barcode-format-badge">
                {formats.find((f) => f.value === format)?.label}
              </span>
            </div>

            <div className="barcode-preview-stage">
              {value.trim() ? (
                <svg
                  ref={barcodeRef}
                  className="barcode-svg"
                  aria-label="Generated barcode"
                />
              ) : (
                <div className="barcode-empty">
                  <strong>No barcode value</strong>
                  <span>Enter a value to generate a preview.</span>
                </div>
              )}
            </div>

            <div className="barcode-preview-info">
              <div>
                <span>Format</span>
                <strong>{format}</strong>
              </div>
              <div>
                <span>Value</span>
                <strong>{value || "—"}</strong>
              </div>
              <div>
                <span>Product</span>
                <strong>
                  {products.find((p) => String(p.id) === selectedProductId)?.name ||
                    "Manual"}
                </strong>
              </div>
            </div>

            <p className="barcode-help">
              Note: EAN and UPC formats require correctly sized numeric values
              with a valid check digit. CODE128 is more flexible for internal
              product identifiers. Retail use may require an officially
              assigned GS1 barcode number.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
