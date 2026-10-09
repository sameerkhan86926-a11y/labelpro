"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getProducts,
  type StoredProduct,
} from "../lib/storage";

import {
  getTemplates,
} from "../lib/template-storage";

import type {
  LabelElement,
  LabelTemplate,
} from "../lib/label-types";

import {
  getElementDisplayText,
} from "../lib/label-render";

import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

const MAX_PREVIEW_LABELS = 20;

export default function PrintCenterPage() {
  const [products, setProducts] = useState<StoredProduct[]>([]);
  const [templates, setTemplates] = useState<LabelTemplate[]>([]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const [templateId, setTemplateId] = useState("");
  const [labelWidth, setLabelWidth] = useState(50);
  const [labelHeight, setLabelHeight] = useState(25);

  const [ready, setReady] = useState(false);

  const loadData = useCallback(() => {
    const availableProducts = getProducts().filter(
      (product) => !product.archived
    );

    const savedTemplates = getTemplates();

    setProducts(availableProducts);
    setTemplates(savedTemplates);

    setTemplateId((current) => {
      if (current && savedTemplates.some((item) => item.id === current)) {
        return current;
      }

      return savedTemplates[0]?.id ?? "";
    });

    setReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0);

    window.addEventListener("storage", loadData);
    window.addEventListener("labelpro-products-updated", loadData);
    window.addEventListener("labelpro-templates-updated", loadData);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", loadData);
      window.removeEventListener("labelpro-products-updated", loadData);
      window.removeEventListener("labelpro-templates-updated", loadData);
    };
  }, [loadData]);

  const selectedTemplate =
    templates.find((template) => template.id === templateId) ?? null;

  const selectedProducts = products.filter((product) =>
    selectedIds.includes(String(product.id))
  );

  const totalLabels = selectedProducts.reduce(
    (total, product) =>
      total + (quantities[String(product.id)] ?? 1),
    0
  );

  const previewItems = selectedProducts.flatMap((product) =>
    Array.from(
      {
        length: Math.min(
          quantities[String(product.id)] ?? 1,
          MAX_PREVIEW_LABELS
        ),
      },
      (_, index) => ({
        product,
        key: `${product.id}-${index}`,
      })
    )
  ).slice(0, MAX_PREVIEW_LABELS);

  function toggleProduct(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  }

  function selectAll() {
    setSelectedIds((current) =>
      current.length === products.length
        ? []
        : products.map((product) => String(product.id))
    );
  }

  function updateQuantity(id: string, value: number) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.min(500, Math.max(1, value || 1)),
    }));
  }

  function changeTemplate(id: string) {
    setTemplateId(id);

    const template = templates.find((item) => item.id === id);

    if (template) {
      setLabelWidth(template.size.width);
      setLabelHeight(template.size.height);
    }
  }

  function printLabels() {
    if (!selectedProducts.length) {
      window.alert("Print karne ke liye pehle products select karein.");
      return;
    }

    if (!selectedTemplate) {
      window.alert(
        "Pehle Label Designer mein template save karein aur yahan select karein."
      );
      return;
    }

    window.print();
  }

  if (!ready) {
    return (
      <main className="pc-page">
        <p>Print Center load ho raha hai...</p>
      </main>
    );
  }

  return (
    <main
      className="pc-page"
      style={
        {
          "--label-width": `${labelWidth}mm`,
          "--label-height": `${labelHeight}mm`,
        } as React.CSSProperties
      }
    >
      <header className="pc-header">
        <Link href="/" className="pc-brand">
          <span className="pc-logo">L</span>
          <span>
            <strong>LabelPro</strong>
            <small>Print Center</small>
          </span>
        </Link>

        <nav className="pc-nav">
          <Link href="/products/">Products</Link>
          <Link href="/labels/designer/">Label Designer</Link>
          <Link href="/barcodes/">Barcode Generator</Link>
        </nav>
      </header>

      <section className="pc-heading">
        <div>
          <span className="pc-eyebrow">LABEL MANAGEMENT</span>
          <h1>Print Center</h1>
          <p>Saved design select karein, products choose karein aur labels print karein.</p>
        </div>

        <div className="pc-count">
          <strong>{selectedIds.length}</strong>
          <span>Selected products</span>
        </div>
      </section>

      <section className="pc-layout">
        <div className="pc-card">
          <div className="pc-card-heading">
            <div>
              <h2>Your Products</h2>
              <p>{products.length} products available</p>
            </div>

            <button
              type="button"
              className="pc-link-button"
              onClick={selectAll}
            >
              {selectedIds.length === products.length && products.length > 0
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>

          {products.length === 0 ? (
            <div className="pc-empty">
              <h3>Abhi koi product nahi hai</h3>
              <p>Print karne ke liye pehle product add karein.</p>
              <Link href="/products/" className="pc-primary">
                + Add Products
              </Link>
            </div>
          ) : (
            <div className="pc-product-list">
              {products.map((product) => {
                const id = String(product.id);
                const selected = selectedIds.includes(id);

                return (
                  <article
                    className={`pc-product ${selected ? "is-selected" : ""}`}
                    key={id}
                  >
                    <label className="pc-product-main">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleProduct(id)}
                      />

                      <span>
                        <strong>{product.name}</strong>
                        <small>SKU: {product.sku || "Not set"}</small>
                        <small>
                          Price: {product.price ? `₹${product.price}` : "Not set"}
                        </small>
                      </span>
                    </label>

                    <div className="pc-quantity">
                      <label htmlFor={`qty-${id}`}>Copies</label>
                      <input
                        id={`qty-${id}`}
                        type="number"
                        min="1"
                        max="500"
                        value={quantities[id] ?? 1}
                        onChange={(event) =>
                          updateQuantity(id, Number(event.target.value))
                        }
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="pc-card">
          <h2>Print Settings</h2>

          <div className="pc-field">
            <label htmlFor="pc-template">Saved Label Template</label>

            <select
              id="pc-template"
              value={templateId}
              onChange={(event) => changeTemplate(event.target.value)}
            >
              <option value="">Select a template</option>

              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.size.width} × {template.size.height} mm)
                </option>
              ))}
            </select>

            {templates.length === 0 && (
              <p className="pc-note">
                Abhi saved template nahi hai. Label Designer kholkar design
                banayein aur Save Template karein.
              </p>
            )}
          </div>

          <div className="pc-field">
            <label htmlFor="pc-width">Label Width (mm)</label>
            <input
              id="pc-width"
              type="number"
              min="10"
              max="300"
              value={labelWidth}
              onChange={(event) =>
                setLabelWidth(Math.max(10, Number(event.target.value) || 10))
              }
            />
          </div>

          <div className="pc-field">
            <label htmlFor="pc-height">Label Height (mm)</label>
            <input
              id="pc-height"
              type="number"
              min="10"
              max="300"
              value={labelHeight}
              onChange={(event) =>
                setLabelHeight(Math.max(10, Number(event.target.value) || 10))
              }
            />
          </div>

          <div className="pc-summary">
            <div>
              <span>Selected products</span>
              <strong>{selectedProducts.length}</strong>
            </div>
            <div>
              <span>Total labels</span>
              <strong>{totalLabels}</strong>
            </div>
            <div>
              <span>Label size</span>
              <strong>{labelWidth} × {labelHeight} mm</strong>
            </div>
          </div>

          <button
            type="button"
            className="pc-primary pc-print-button"
            onClick={printLabels}
            disabled={!selectedProducts.length || !selectedTemplate}
          >
            Print Labels
          </button>

          <p className="pc-note">
            Print dialog mein paper size aur scale check karein. Actual printer
            margins aur paper feed se result affect ho sakta hai.
          </p>
        </aside>
      </section>

      <section className="pc-preview-section">
        <div className="pc-preview-heading">
          <div>
            <h2>Label Preview</h2>
            <p>Saved template aur selected product ke saath preview.</p>
          </div>

          <span>{labelWidth} × {labelHeight} mm</span>
        </div>

        {!selectedTemplate ? (
          <div className="pc-preview-empty">
            Preview ke liye pehle Label Designer ka saved template select karein.
          </div>
        ) : selectedProducts.length === 0 ? (
          <div className="pc-preview-empty">
            Preview dekhne ke liye kam se kam ek product select karein.
          </div>
        ) : (
          <>
            <div className="pc-preview-grid">
              {previewItems.map(({ product, key }) => (
                <LabelPreview
                  key={key}
                  template={selectedTemplate}
                  product={product}
                  width={labelWidth}
                  height={labelHeight}
                />
              ))}
            </div>

            {totalLabels > MAX_PREVIEW_LABELS && (
              <p className="pc-note">
                Preview mein pehle {MAX_PREVIEW_LABELS} labels dikhaye gaye hain.
                Print mein selected quantities ke mutabik sab labels aayenge.
              </p>
            )}
          </>
        )}
      </section>

      <section className="pc-print-output" aria-hidden="true">
        {selectedTemplate &&
          selectedProducts.flatMap((product) =>
            Array.from(
              { length: quantities[String(product.id)] ?? 1 },
              (_, index) => (
                <LabelPreview
                  key={`print-${product.id}-${index}`}
                  template={selectedTemplate}
                  product={product}
                  width={labelWidth}
                  height={labelHeight}
                  printMode
                />
              )
            )
          )}
      </section>

      <style jsx global>{`
        .pc-page {
          min-height: 100vh;
          padding: 28px;
          background: #f4f7fc;
          color: #172b4d;
          font-family: Arial, Helvetica, sans-serif;
        }

        .pc-header, .pc-brand, .pc-heading, .pc-card-heading,
        .pc-product, .pc-product-main, .pc-preview-heading, .pc-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .pc-header, .pc-heading, .pc-layout, .pc-preview-section {
          max-width: 1200px;
          margin: 0 auto 26px;
        }

        .pc-brand {
          justify-content: flex-start;
          text-decoration: none;
          color: #172b4d;
        }

        .pc-logo {
          display: grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 13px;
          color: white;
          background: #1769e0;
          font-size: 25px;
          font-weight: 800;
        }

        .pc-brand strong, .pc-brand small { display: block; }
        .pc-brand strong { font-size: 20px; }
        .pc-brand small { margin-top: 4px; color: #71809a; }
        .pc-nav { flex-wrap: wrap; justify-content: flex-end; }
        .pc-nav a, .pc-link-button { color: #1769e0; font-weight: 700; text-decoration: none; }
        .pc-link-button { border: 0; background: transparent; cursor: pointer; }

        .pc-eyebrow { color: #1769e0; font-size: 12px; font-weight: 800; letter-spacing: 1.5px; }
        .pc-heading h1 { margin: 8px 0; font-size: clamp(30px, 5vw, 42px); }
        .pc-heading p, .pc-card-heading p, .pc-preview-heading p { margin: 0; color: #71809a; }

        .pc-count { padding: 14px 20px; border: 1px solid #dce6f5; border-radius: 14px; background: white; text-align: center; }
        .pc-count strong, .pc-count span { display: block; }
        .pc-count strong { color: #1769e0; font-size: 26px; }
        .pc-count span { margin-top: 5px; color: #71809a; font-size: 12px; }

        .pc-layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(260px, 0.8fr); gap: 22px; }
        .pc-card, .pc-preview-section { border: 1px solid #e0e8f3; border-radius: 18px; background: white; box-shadow: 0 8px 30px rgba(24,55,100,.04); }
        .pc-card { padding: 24px; }
        .pc-card h2, .pc-preview-heading h2 { margin: 0 0 7px; font-size: 20px; }
        .pc-card-heading { margin-bottom: 20px; }

        .pc-product-list { display: grid; gap: 10px; }
        .pc-product { padding: 15px; border: 1px solid #e1e9f4; border-radius: 12px; }
        .pc-product.is-selected { border-color: #1769e0; background: #f3f8ff; }
        .pc-product-main { justify-content: flex-start; min-width: 0; flex: 1; }
        .pc-product-main input { width: 18px; height: 18px; accent-color: #1769e0; flex-shrink: 0; }
        .pc-product-main strong, .pc-product-main small { display: block; overflow-wrap: anywhere; }
        .pc-product-main small { margin-top: 5px; color: #71809a; }

        .pc-quantity { width: 85px; flex-shrink: 0; }
        .pc-quantity label, .pc-field label { display: block; margin-bottom: 7px; color: #526580; font-size: 12px; font-weight: 700; }
        .pc-quantity input, .pc-field select, .pc-field input {
          width: 100%; min-height: 42px; padding: 9px; border: 1px solid #d7e1ef;
          border-radius: 9px; background: white; color: #172b4d; font-size: 14px; box-sizing: border-box;
        }
        .pc-field { margin-bottom: 18px; }
        .pc-summary { margin: 25px 0; padding: 16px; border-radius: 12px; background: #f4f8ff; }
        .pc-summary div { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0; color: #526580; font-size: 14px; }
        .pc-summary strong { color: #1769e0; }

        .pc-primary { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 12px 18px; border: 0; border-radius: 10px; background: #1769e0; color: white; font-weight: 700; text-decoration: none; cursor: pointer; }
        .pc-primary:disabled { opacity: .5; cursor: not-allowed; }
        .pc-print-button { width: 100%; }
        .pc-note { color: #71809a; font-size: 12px; line-height: 1.6; }

        .pc-empty { padding: 35px 15px; text-align: center; }
        .pc-empty h3 { margin: 0 0 8px; }
        .pc-empty p { color: #71809a; line-height: 1.6; }
        .pc-preview-section { padding: 24px; }
        .pc-preview-heading { margin-bottom: 20px; }
        .pc-preview-heading > span { padding: 8px 12px; border-radius: 8px; background: #edf4ff; color: #1769e0; font-size: 12px; font-weight: 700; white-space: nowrap; }
        .pc-preview-empty { padding: 40px 15px; border: 1px dashed #cdd9e9; border-radius: 12px; color: #71809a; text-align: center; }
        .pc-preview-grid { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 10px; }

        .pc-label {
          position: relative; flex: 0 0 auto; overflow: hidden; box-sizing: border-box;
          border: 1px solid #bac9dc; background: white; color: #172b4d;
        }
        .pc-label-element { position: absolute; box-sizing: border-box; overflow: hidden; white-space: pre-wrap; overflow-wrap: anywhere; }
        .pc-label-element svg, .pc-label-element canvas, .pc-label-element img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .pc-label-element svg { overflow: visible; }

        .pc-print-output { display: none; }

        @media (max-width: 760px) {
          .pc-page { padding: 16px; }
          .pc-header { align-items: flex-start; flex-direction: column; }
          .pc-nav { justify-content: flex-start; }
          .pc-heading { align-items: flex-start; }
          .pc-count { padding: 10px; }
          .pc-layout { grid-template-columns: 1fr; }
          .pc-card, .pc-preview-section { padding: 17px; }
          .pc-product { align-items: flex-start; }
          .pc-product-main { align-items: flex-start; }
        }

        @page {
          size: auto;
          margin: 0;
        }

        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden !important; }
          .pc-print-output, .pc-print-output * { visibility: visible !important; }
          .pc-print-output { display: block !important; position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; }
          .pc-page { padding: 0 !important; margin: 0 !important; background: white !important; }
          .pc-header, .pc-heading, .pc-layout, .pc-preview-section { display: none !important; }
          .pc-label { margin: 0 !important; border: 0 !important; break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </main>
  );
}

function LabelPreview({
  template,
  product,
  width,
  height,
  printMode = false,
}: {
  template: LabelTemplate;
  product: StoredProduct;
  width: number;
  height: number;
  printMode?: boolean;
}) {
  const elements = template.elements.filter((element) => !element.hidden);

  return (
    <div
      className="pc-label"
      style={{
        width: printMode ? `${width}mm` : `${width * 2}px`,
        height: printMode ? `${height}mm` : `${height * 2}px`,
        background: template.backgroundColor || "#ffffff",
      }}
    >
      {elements.map((element) => (
        <LabelElementView
          key={element.id}
          element={element}
          product={product}
          template={template}
          width={width}
          height={height}
        />
      ))}
    </div>
  );
}

function LabelElementView({
  element,
  product,
  template,
  width,
  height,
}: {
  element: LabelElement;
  product: StoredProduct;
  template: LabelTemplate;
  width: number;
  height: number;
}) {
  const svgRef = useCallback(
    (svg: SVGSVGElement | null) => {
      if (!svg || element.type !== "barcode") return;

      const value =
        product.barcode || product.sku || element.text || "";

      if (!value) {
        svg.innerHTML = "";
        return;
      }

      try {
        JsBarcode(svg, value, {
          format: element.barcodeFormat || "CODE128",
          width: 1.5,
          height: Math.max(12, element.height * 2),
          displayValue: true,
          fontSize: Math.max(7, element.fontSize || 10),
          margin: 1,
        });
      } catch {
        svg.innerHTML = "";
      }
    },
    [element, product]
  );

  const qrRef = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas || element.type !== "qr") return;

      const value =
        element.qrValue ||
        product.barcode ||
        product.sku ||
        product.name;

      if (value) {
        void QRCode.toCanvas(canvas, value, {
          width: 150,
          margin: 1,
        }).catch(() => {
          const context = canvas.getContext("2d");
          context?.clearRect(0, 0, canvas.width, canvas.height);
        });
      }
    },
    [element, product]
  );

  const text = getElementDisplayText(element, product);

  const style: React.CSSProperties = {
    left: `${(element.x / template.size.width) * 100}%`,
    top: `${(element.y / template.size.height) * 100}%`,
    width: `${(element.width / template.size.width) * 100}%`,
    height: `${(element.height / template.size.height) * 100}%`,
    transform: `rotate(${element.rotation || 0}deg)`,
    transformOrigin: "center",
    opacity: element.opacity ?? 1,
    color: element.color || "#111827",
    backgroundColor: element.backgroundColor || "transparent",
    borderColor: element.borderColor || "transparent",
    borderWidth: element.borderWidth || 0,
    borderStyle: (element.borderWidth || 0) > 0 ? "solid" : "none",
    fontSize: `${Math.max(5, (element.fontSize || 10) * 0.75)}px`,
    fontWeight: element.fontWeight || 400,
    fontFamily: element.fontFamily || "Arial",
    textAlign: element.textAlign || "left",
    lineHeight: 1.1,
  };

  if (element.type === "line") {
    return (
      <div
        className="pc-label-element"
        style={{
          ...style,
          height: "0",
          borderTop: `${Math.max(1, element.borderWidth || 1)}px solid ${element.borderColor || "#111827"}`,
        }}
      />
    );
  }

  if (element.type === "rectangle" || element.type === "circle") {
    return (
      <div
        className="pc-label-element"
        style={{
          ...style,
          borderRadius: element.type === "circle" ? "50%" : 0,
          border: `${Math.max(1, element.borderWidth || 1)}px solid ${element.borderColor || "#111827"}`,
        }}
      />
    );
  }

  if (element.type === "barcode") {
    return (
      <div className="pc-label-element" style={style}>
        <svg ref={svgRef} />
      </div>
    );
  }

  if (element.type === "qr") {
    return (
      <div className="pc-label-element" style={style}>
        <canvas ref={qrRef} />
      </div>
    );
  }

  if (element.type === "image" || element.type === "logo") {
    const src =
      element.imageUrl ||
      (element.type === "logo" ? product.productImage : "");

    return (
      <div className="pc-label-element" style={style}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" />
        ) : null}
      </div>
    );
  }

  return (
    <div className="pc-label-element" style={style}>
      {text}
    </div>
  );
}
