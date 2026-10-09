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

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

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
  const [bulkMode, setBulkMode] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
  const timer = window.setTimeout(() => {
    const availableProducts = getProducts().filter(
      (product) => !product.archived
    );

    setProducts(availableProducts);

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("productId");

    if (!productId) return;

    const product = availableProducts.find(
      (item) => String(item.id) === productId
    );

    if (!product) {
      setError("Selected product was not found.");
      return;
    }

    setSelectedProductId(String(product.id));
    setValue(product.barcode || product.sku || "");
    setBulkMode(false);
    setError("");
    setSuccess("");
  }, 0);

  return () => window.clearTimeout(timer);
}, []);

  useEffect(() => {
    const svg = barcodeRef.current;

    if (!svg) return;

    svg.innerHTML = "";

    if (!value.trim()) return;

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
    } catch {
      // Validation and error messages are handled outside this effect.
      svg.innerHTML = "";
    }
  }, [value, format, width, height, fontSize, margin, displayValue]);

  function changeFormat(nextFormat: BarcodeFormat) {
    setFormat(nextFormat);
    setValue(defaults[nextFormat]);
    setError("");
    setSuccess("");
  }

  function chooseProduct(productId: string) {
    setSelectedProductId(productId);
    setError("");
    setSuccess("");

    if (!productId) return;

    const product = products.find(
      (item) => String(item.id) === productId
    );

    if (product) {
      setValue(product.barcode || product.sku || "");
    }
  }

  function toggleProduct(productId: string) {
    setSelectedIds((previous) =>
      previous.includes(productId)
        ? previous.filter((id) => id !== productId)
        : [...previous, productId]
    );
  }

  function selectAllProducts() {
    if (
      products.length > 0 &&
      selectedIds.length === products.length
    ) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((product) => String(product.id)));
    }
  }

  function saveBarcode() {
    if (!selectedProductId) {
      setError("Please select a product first.");
      setSuccess("");
      return;
    }

    if (!value.trim()) {
      setError("Enter a barcode value first.");
      setSuccess("");
      return;
    }

    try {
      updateProduct(selectedProductId, {
        barcode: value.trim(),
      });

      setProducts(getProducts().filter((product) => !product.archived));
      setSuccess("Barcode saved to the selected product.");
      setError("");
    } catch {
      setError("Unable to save the barcode. Please try again.");
      setSuccess("");
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

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function downloadBarcode() {
    if (!barcodeRef.current || !value.trim()) {
      setError("Enter a valid barcode value before downloading.");
      setSuccess("");
      return;
    }

    if (!barcodeRef.current.querySelector("rect")) {
      setError("The barcode could not be generated. Check the value and format.");
      setSuccess("");
      return;
    }

    downloadSvg(barcodeRef.current, "labelpro-barcode.svg");
    setError("");
    setSuccess("Barcode SVG download started.");
  }

  function printCurrentBarcode() {
    if (!barcodeRef.current || !value.trim()) {
      setError("Enter a barcode value before printing.");
      setSuccess("");
      return;
    }

    const svg = barcodeRef.current.cloneNode(true) as SVGSVGElement;

    if (!svg.querySelector("rect")) {
      setError("The barcode could not be generated. Check its value.");
      setSuccess("");
      return;
    }

    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const popup = window.open("", "_blank", "width=700,height=500");

    if (!popup) {
      setError("Allow pop-ups in your browser to print the barcode.");
      setSuccess("");
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>LabelPro Barcode</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 0;
              padding: 15mm;
              background: #fff;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            svg {
              display: block;
              max-width: 100%;
              height: auto;
              margin: 0 auto;
            }
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
    setError("");
    setSuccess("Print window opened.");
  }

  function printBulk() {
    const selectedProducts = products.filter((product) =>
      selectedIds.includes(String(product.id))
    );

    const productsWithValues = selectedProducts.filter(
      (product) => product.barcode || product.sku
    );

    if (productsWithValues.length === 0) {
      setError("Select products with a barcode or SKU first.");
      setSuccess("");
      return;
    }

    const popup = window.open("", "_blank", "width=900,height=700");

    if (!popup) {
      setError("Allow pop-ups in your browser to print barcodes.");
      setSuccess("");
      return;
    }

    const labels = productsWithValues
      .map((product, index) => {
        const barcodeValue = product.barcode || product.sku || "";
        const barcodeId = `barcode-item-${index}`;

        return `
          <article class="label">
            <strong>${escapeHtml(product.name)}</strong>
            <svg id="${barcodeId}"></svg>
            <small>${escapeHtml(barcodeValue)}</small>
          </article>
        `;
      })
      .join("");

    const barcodeItems = productsWithValues.map((product, index) => ({
      id: `barcode-item-${index}`,
      value: product.barcode || product.sku || "",
    }));

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>LabelPro Bulk Barcodes</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              margin: 10mm;
              font-family: Arial, sans-serif;
              color: #111827;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8mm;
            }
            .label {
              min-width: 0;
              padding: 8px;
              border: 1px solid #ddd;
              text-align: center;
              break-inside: avoid;
            }
            .label strong, .label small {
              display: block;
              margin: 5px 0;
              overflow-wrap: anywhere;
            }
            .label svg {
              max-width: 100%;
              height: auto;
            }
            @media print {
              .grid { gap: 5mm; }
              .label { border-color: #aaa; }
            }
            @page { margin: 10mm; }
          </style>
        </head>
        <body>
          <div class="grid">${labels}</div>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <script>
            const items = ${JSON.stringify(barcodeItems)};

            function generateLabels() {
              if (typeof JsBarcode === "undefined") {
                document.body.insertAdjacentHTML(
                  "afterbegin",
                  "<p>Barcode library failed to load. Check your internet connection.</p>"
                );
                return;
              }

              items.forEach(function (item) {
                try {
                  JsBarcode("#" + item.id, item.value, {
                    format: "CODE128",
                    width: 2,
                    height: 55,
                    displayValue: true,
                    margin: 8
                  });
                } catch (error) {
                  const node = document.getElementById(item.id);
                  if (node) {
                    node.outerHTML = "<p>Invalid barcode value</p>";
                  }
                }
              });

              setTimeout(function () {
                window.print();
              }, 500);
            }

            window.onload = generateLabels;
          </script>
        </body>
      </html>
    `);

    popup.document.close();
    setError("");
    setSuccess(`${productsWithValues.length} product barcodes prepared for printing.`);
  }

  function clearGenerator() {
    setSelectedProductId("");
    setSelectedIds([]);
    setFormat("CODE128");
    setValue(defaults.CODE128);
    setError("");
    setSuccess("");
  }

  const selectedProducts = products.filter((product) =>
    selectedIds.includes(String(product.id))
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
                Select products with an existing barcode or SKU.
                Bulk printing uses CODE128.
              </p>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={selectAllProducts}
            >
              {products.length > 0 &&
              selectedIds.length === products.length
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
                        {product.barcode ||
                          product.sku ||
                          "No barcode or SKU"}
                      </small>
                    </span>

                    <span
                      className={`barcode-status ${
                        hasValue ? "ready" : "missing"
                      }`}
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
                !selectedProducts.some(
                  (product) => product.barcode || product.sku
                )
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
                    <option
                      key={String(product.id)}
                      value={String(product.id)}
                    >
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
                  type="text"
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
                    setWidth(
                      Math.min(
                        5,
                        Math.max(1, Number(event.target.value) || 1)
                      )
                    )
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
                    setHeight(
                      Math.min(
                        200,
                        Math.max(30, Number(event.target.value) || 80)
                      )
                    )
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
                    setFontSize(
                      Math.min(
                        30,
                        Math.max(8, Number(event.target.value) || 14)
                      )
                    )
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
                    setMargin(
                      Math.min(
                        40,
                        Math.max(0, Number(event.target.value) || 0)
                      )
                    )
                  }
                />
              </div>

              <label className="barcode-checkbox">
                <input
                  type="checkbox"
                  checked={displayValue}
                  onChange={(event) =>
                    setDisplayValue(event.target.checked)
                  }
                />

                <span>Show value below barcode</span>
              </label>

              {error && (
                <div className="barcode-message barcode-error" role="alert">
                  {error}
                </div>
              )}

              {success && (
                <div
                  className="barcode-message barcode-success"
                  role="status"
                >
                  {success}
                </div>
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
                  disabled={!value.trim()}
                >
                  Download SVG
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={printCurrentBarcode}
                  disabled={!value.trim()}
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
                {formats.find((item) => item.value === format)?.label}
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
                  {products.find(
                    (product) =>
                      String(product.id) === selectedProductId
                  )?.name || "Manual"}
                </strong>
              </div>
            </div>

            <p className="barcode-help">
              EAN-13, EAN-8, UPC-A and ITF-14 require valid numeric
              values and check digits. CODE128 is suitable for many
              internal product identifiers. Retail product barcodes
              may require numbers assigned through GS1.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
