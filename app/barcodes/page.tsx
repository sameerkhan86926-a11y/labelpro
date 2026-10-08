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

const defaultValueByFormat: Record<BarcodeFormat, string> = {
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

  const [format, setFormat] = useState<BarcodeFormat>("CODE128");
  const [value, setValue] = useState(defaultValueByFormat.CODE128);

  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(80);
  const [fontSize, setFontSize] = useState(14);
  const [margin, setMargin] = useState(10);
  const [displayValue, setDisplayValue] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProducts(getProducts());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!barcodeRef.current || !value.trim()) {
      return;
    }

    const timer = window.setTimeout(() => {
      try {
        JsBarcode(barcodeRef.current, value.trim(), {
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
        setError(
          "Unable to generate this barcode. Check the value and selected format."
        );
      }
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    value,
    format,
    width,
    height,
    fontSize,
    margin,
    displayValue,
  ]);

  function handleFormatChange(nextFormat: BarcodeFormat) {
    setFormat(nextFormat);
    setValue(defaultValueByFormat[nextFormat]);
    setError("");
    setSuccess("");
  }

  function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    setSuccess("");
    setError("");

    if (!productId) {
      return;
    }

    const product = products.find((item) => item.id === productId);

    if (!product) {
      return;
    }

    setValue(product.barcode || product.sku || "");
  }

  function handleSaveToProduct() {
    if (!selectedProductId) {
      setError("Select a product first.");
      return;
    }

    if (!value.trim()) {
      setError("Enter a barcode value first.");
      return;
    }

    updateProduct(selectedProductId, {
      barcode: value.trim(),
    });

    setProducts(getProducts());
    setSuccess("Barcode saved to the selected product.");
    setError("");
  }

  function downloadSvg() {
    if (!barcodeRef.current) {
      return;
    }

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(barcodeRef.current);

    const blob = new Blob([source], {
      type: "image/svg+xml;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `labelpro-barcode-${Date.now()}.svg`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  function printBarcode() {
    if (!barcodeRef.current) {
      return;
    }

    const svgMarkup = new XMLSerializer().serializeToString(
      barcodeRef.current
    );

    const printWindow = window.open(
      "",
      "_blank",
      "width=700,height=500"
    );

    if (!printWindow) {
      setError(
        "Please allow pop-ups in your browser to print the barcode."
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LabelPro Barcode</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              background: white;
              font-family: Arial, sans-serif;
              text-align: center;
            }

            svg {
              max-width: 100%;
              height: auto;
            }

            @media print {
              body {
                padding: 10mm;
              }
            }
          </style>
        </head>
        <body>
          ${svgMarkup}
          <script>
            window.onload = function () {
              window.print();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }

  function clearGenerator() {
    setSelectedProductId("");
    setFormat("CODE128");
    setValue("");
    setError("");
    setSuccess("");
  }

  return (
    <main className="module-page">
      <section className="module-header">
        <div>
          <span className="eyebrow">TOOLS / BARCODE GENERATOR</span>

          <h2>Barcode Generator</h2>

          <p>
            Create professional product barcodes, customize their
            appearance, save them to products, download the barcode
            or print it directly.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={clearGenerator}
        >
          Clear
        </button>
      </section>

      <section className="barcode-workspace">
        <div className="barcode-controls-panel">
          <div className="barcode-section-heading">
            <div>
              <span className="eyebrow">BARCODE SETUP</span>
              <h3>Generate Barcode</h3>
            </div>
          </div>

          <div className="barcode-form">
            <div className="form-field barcode-wide">
              <label htmlFor="barcode-product">
                Product
              </label>

              <select
                id="barcode-product"
                value={selectedProductId}
                onChange={(event) =>
                  handleProductChange(event.target.value)
                }
              >
                <option value="">Manual barcode</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                    {product.sku ? ` — ${product.sku}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="barcode-format">
                Barcode Format
              </label>

              <select
                id="barcode-format"
                value={format}
                onChange={(event) =>
                  handleFormatChange(
                    event.target.value as BarcodeFormat
                  )
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
              <label htmlFor="barcode-value">
                Barcode Value
              </label>

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

            <div className="form-section-title">
              Appearance
            </div>

            <div className="form-field">
              <label htmlFor="barcode-width">
                Bar Width
              </label>

              <input
                id="barcode-width"
                type="number"
                min="1"
                max="5"
                step="1"
                value={width}
                onChange={(event) =>
                  setWidth(Number(event.target.value))
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="barcode-height">
                Height
              </label>

              <input
                id="barcode-height"
                type="number"
                min="30"
                max="200"
                step="5"
                value={height}
                onChange={(event) =>
                  setHeight(Number(event.target.value))
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="barcode-font-size">
                Text Size
              </label>

              <input
                id="barcode-font-size"
                type="number"
                min="8"
                max="30"
                step="1"
                value={fontSize}
                onChange={(event) =>
                  setFontSize(Number(event.target.value))
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="barcode-margin">
                Margin
              </label>

              <input
                id="barcode-margin"
                type="number"
                min="0"
                max="40"
                step="1"
                value={margin}
                onChange={(event) =>
                  setMargin(Number(event.target.value))
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

              <span>
                Show barcode value below bars
              </span>
            </label>

            {error && (
              <div className="barcode-message barcode-error">
                {error}
              </div>
            )}

            {success && (
              <div className="barcode-message barcode-success">
                {success}
              </div>
            )}

            <div className="barcode-form-actions">
              {selectedProductId && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleSaveToProduct}
                >
                  Save to Product
                </button>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={downloadSvg}
              >
                Download SVG
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={printBarcode}
              >
                Print Barcode
              </button>
            </div>
          </div>
        </div>

        <div className="barcode-preview-panel">
          <div className="barcode-preview-header">
            <div>
              <span className="eyebrow">LIVE PREVIEW</span>
              <h3>Barcode Preview</h3>
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
                <span>
                  Enter a value to generate the barcode preview.
                </span>
              </div>
            )}
          </div>

          <div className="barcode-preview-info">
            <div>
              <span>Format</span>
              <strong>
                {formats.find((item) => item.value === format)?.label}
              </strong>
            </div>

            <div>
              <span>Value</span>
              <strong>{value || "—"}</strong>
            </div>

            <div>
              <span>Product</span>
              <strong>
                {selectedProductId
                  ? products.find(
                      (product) =>
                        product.id === selectedProductId
                    )?.name || "Selected product"
                  : "Manual"}
              </strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
