"use client";

import Link from "next/link";
import { useSyncExternalStore, useState } from "react";
import { getProducts, type StoredProduct } from "../lib/storage";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("labelpro-products-updated", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("labelpro-products-updated", callback);
  };
}

function getSnapshot(): StoredProduct[] {
  return getProducts().filter((product) => !product.archived);
}

function getServerSnapshot(): StoredProduct[] {
  return [];
}

export default function PrintCenterPage() {
  const products = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [labelWidth, setLabelWidth] = useState("50");
  const [labelHeight, setLabelHeight] = useState("25");

  const selectedProducts = products.filter((product) =>
    selectedIds.includes(String(product.id))
  );

  const totalLabels = selectedProducts.reduce(
    (total, product) =>
      total + (quantities[String(product.id)] || 1),
    0
  );

  function toggleProduct(id: string) {
    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  }

  function selectAll() {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((product) => String(product.id)));
    }
  }

  function updateQuantity(id: string, value: number) {
    setQuantities((previous) => ({
      ...previous,
      [id]: Math.min(500, Math.max(1, value || 1)),
    }));
  }

  function printLabels() {
    if (selectedProducts.length === 0) {
      alert("Print karne ke liye pehle products select karein.");
      return;
    }

    window.print();
  }

  return (
    <main className="pc-page">
      <header className="pc-header">
        <Link href="/" className="pc-brand">
          <span className="pc-logo">L</span>
          <span>
            <strong>LabelPro</strong>
            <small>Print Center</small>
          </span>
        </Link>

        <Link href="/products/" className="pc-back">
          ← Products
        </Link>
      </header>

      <section className="pc-heading">
        <div>
          <span className="pc-eyebrow">LABEL MANAGEMENT</span>
          <h1>Print Center</h1>
          <p>Products select karein aur apne labels print karein.</p>
        </div>

        <div className="pc-count">
          <strong>{selectedIds.length}</strong>
          <span>Selected products</span>
        </div>
      </section>

      <section className="pc-layout">
        <div className="pc-card pc-products">
          <div className="pc-card-heading">
            <div>
              <h2>Your Products</h2>
              <p>{products.length} products available</p>
            </div>

            <button
              type="button"
              className="pc-select-all"
              onClick={selectAll}
            >
              {selectedIds.length === products.length &&
              products.length > 0
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>

          {products.length === 0 ? (
            <div className="pc-empty">
              <div className="pc-empty-icon">P</div>
              <h3>Abhi koi product nahi hai</h3>
              <p>
                Print karne ke liye pehle Products section mein
                product add karein.
              </p>
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

                      <span className="pc-product-info">
                        <strong>{product.name}</strong>
                        <small>
                          SKU: {product.sku || "Not set"}
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

        <aside className="pc-card pc-settings">
          <h2>Print Settings</h2>
          <p className="pc-muted">
            Apne label ka size set karein.
          </p>

          <div className="pc-field">
            <label htmlFor="label-width">Width (mm)</label>
            <select
              id="label-width"
              value={labelWidth}
              onChange={(event) => setLabelWidth(event.target.value)}
            >
              <option value="25">25 mm</option>
              <option value="38">38 mm</option>
              <option value="50">50 mm</option>
              <option value="60">60 mm</option>
              <option value="75">75 mm</option>
              <option value="100">100 mm</option>
            </select>
          </div>

          <div className="pc-field">
            <label htmlFor="label-height">Height (mm)</label>
            <select
              id="label-height"
              value={labelHeight}
              onChange={(event) => setLabelHeight(event.target.value)}
            >
              <option value="15">15 mm</option>
              <option value="20">20 mm</option>
              <option value="25">25 mm</option>
              <option value="30">30 mm</option>
              <option value="40">40 mm</option>
              <option value="50">50 mm</option>
            </select>
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
          </div>

          <button
            type="button"
            className="pc-primary pc-print-button"
            onClick={printLabels}
            disabled={selectedProducts.length === 0}
          >
            Print Labels
          </button>

          <p className="pc-note">
            Print karte waqt printer settings mein paper size aur
            scale check karein.
          </p>
        </aside>
      </section>

      <section className="pc-preview-section">
        <div className="pc-preview-heading">
          <div>
            <h2>Label Preview</h2>
            <p>Print se pehle labels ka preview dekhein.</p>
          </div>
          <span>
            {labelWidth} × {labelHeight} mm
          </span>
        </div>

        {selectedProducts.length === 0 ? (
          <div className="pc-preview-empty">
            Product select karne par preview yahan dikhega.
          </div>
        ) : (
          <div className="pc-preview-grid">
            {selectedProducts.flatMap((product) =>
              Array.from(
                {
                  length: Math.min(
                    quantities[String(product.id)] || 1,
                    20
                  ),
                },
                (_, index) => (
                  <div
                    className="pc-label"
                    key={`${product.id}-${index}`}
                    style={{
                      width: `${Number(labelWidth) * 2}px`,
                      minHeight: `${Number(labelHeight) * 1.3}px`,
                    }}
                  >
                    <strong>{product.name}</strong>
                    <span>{product.sku || "No SKU"}</span>
                    <small>LabelPro</small>
                  </div>
                )
              )
            )}
          </div>
        )}

        {selectedProducts.length > 0 && totalLabels > 20 && (
          <p className="pc-note">
            Preview mein maximum 20 labels dikh rahe hain. Print mein
            selected quantities ke hisaab se sab labels banenge.
          </p>
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

        .pc-header,
        .pc-brand,
        .pc-heading,
        .pc-card-heading,
        .pc-product,
        .pc-product-main,
        .pc-preview-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .pc-header {
          max-width: 1200px;
          margin: 0 auto 42px;
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

        .pc-brand strong,
        .pc-brand small {
          display: block;
        }

        .pc-brand strong {
          font-size: 20px;
        }

        .pc-brand small {
          margin-top: 4px;
          color: #71809a;
        }

        .pc-back,
        .pc-select-all {
          color: #1769e0;
          font-weight: 700;
          text-decoration: none;
        }

        .pc-heading,
        .pc-layout,
        .pc-preview-section {
          max-width: 1200px;
          margin: 0 auto 26px;
        }

        .pc-eyebrow {
          color: #1769e0;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .pc-heading h1 {
          margin: 8px 0;
          font-size: clamp(30px, 5vw, 42px);
        }

        .pc-heading p,
        .pc-card-heading p,
        .pc-preview-heading p {
          margin: 0;
          color: #71809a;
        }

        .pc-count {
          padding: 14px 20px;
          border: 1px solid #dce6f5;
          border-radius: 14px;
          background: white;
          text-align: center;
        }

        .pc-count strong,
        .pc-count span {
          display: block;
        }

        .pc-count strong {
          color: #1769e0;
          font-size: 26px;
        }

        .pc-count span {
          margin-top: 5px;
          color: #71809a;
          font-size: 12px;
        }

        .pc-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(260px, 0.8fr);
          gap: 22px;
        }

        .pc-card,
        .pc-preview-section {
          border: 1px solid #e0e8f3;
          border-radius: 18px;
          background: white;
          box-shadow: 0 8px 30px rgba(24, 55, 100, 0.04);
        }

        .pc-card {
          padding: 24px;
        }

        .pc-card h2,
        .pc-preview-heading h2 {
          margin: 0 0 7px;
          font-size: 20px;
        }

        .pc-card-heading {
          margin-bottom: 20px;
        }

        .pc-select-all {
          border: 0;
          background: transparent;
          cursor: pointer;
        }

        .pc-product-list {
          display: grid;
          gap: 10px;
        }

        .pc-product {
          padding: 15px;
          border: 1px solid #e1e9f4;
          border-radius: 12px;
        }

        .pc-product.is-selected {
          border-color: #1769e0;
          background: #f3f8ff;
        }

        .pc-product-main {
          justify-content: flex-start;
          min-width: 0;
          flex: 1;
        }

        .pc-product-main input {
          width: 18px;
          height: 18px;
          accent-color: #1769e0;
          flex-shrink: 0;
        }

        .pc-product-info {
          min-width: 0;
        }

        .pc-product-info strong,
        .pc-product-info small {
          display: block;
          overflow-wrap: anywhere;
        }

        .pc-product-info small {
          margin-top: 5px;
          color: #71809a;
        }

        .pc-quantity {
          width: 85px;
          flex-shrink: 0;
        }

        .pc-quantity label,
        .pc-field label {
          display: block;
          margin-bottom: 7px;
          color: #526580;
          font-size: 12px;
          font-weight: 700;
        }

        .pc-quantity input,
        .pc-field select {
          width: 100%;
          min-height: 42px;
          padding: 9px;
          border: 1px solid #d7e1ef;
          border-radius: 9px;
          background: white;
          color: #172b4d;
          font-size: 14px;
        }

        .pc-settings h2 {
          margin-bottom: 8px;
        }

        .pc-muted {
          margin: 0 0 25px;
          color: #71809a;
          font-size: 14px;
        }

        .pc-field {
          margin-bottom: 18px;
        }

        .pc-summary {
          margin: 25px 0;
          padding: 16px;
          border-radius: 12px;
          background: #f4f8ff;
        }

        .pc-summary div {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin: 8px 0;
          color: #526580;
          font-size: 14px;
        }

        .pc-summary strong {
          color: #1769e0;
        }

        .pc-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          padding: 12px 18px;
          border: 0;
          border-radius: 10px;
          background: #1769e0;
          color: white;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .pc-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pc-print-button {
          width: 100%;
        }

        .pc-note {
          color: #71809a;
          font-size: 12px;
          line-height: 1.6;
        }

        .pc-empty {
          padding: 35px 15px;
          text-align: center;
        }

        .pc-empty-icon {
          display: grid;
          place-items: center;
          width: 54px;
          height: 54px;
          margin: 0 auto 15px;
          border-radius: 15px;
          background: #eaf2ff;
          color: #1769e0;
          font-size: 25px;
          font-weight: 800;
        }

        .pc-empty h3 {
          margin: 0 0 8px;
        }

        .pc-empty p {
          margin: 0 auto 18px;
          max-width: 300px;
          color: #71809a;
          line-height: 1.6;
        }

        .pc-preview-section {
          padding: 24px;
        }

        .pc-preview-heading {
          margin-bottom: 20px;
        }

        .pc-preview-heading > span {
          padding: 8px 12px;
          border-radius: 8px;
          background: #edf4ff;
          color: #1769e0;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .pc-preview-empty {
          padding: 40px 15px;
          border: 1px dashed #cdd9e9;
          border-radius: 12px;
          color: #71809a;
          text-align: center;
        }

        .pc-preview-grid {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          gap: 10px;
          overflow-wrap: anywhere;
        }

        .pc-label {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 3px;
          padding: 6px;
          overflow: hidden;
          border: 1px solid #bac9dc;
          border-radius: 4px;
          background: white;
          color: #172b4d;
          text-align: center;
          overflow-wrap: anywhere;
          box-sizing: border-box;
        }

        .pc-label strong {
          font-size: 10px;
        }

        .pc-label span {
          font-size: 8px;
        }

        .pc-label small {
          color: #1769e0;
          font-size: 7px;
        }

        @media (max-width: 760px) {
          .pc-page {
            padding: 16px;
          }

          .pc-header {
            margin-bottom: 30px;
          }

          .pc-heading {
            align-items: flex-start;
          }

          .pc-count {
            padding: 10px;
          }

          .pc-layout {
            grid-template-columns: 1fr;
          }

          .pc-card,
          .pc-preview-section {
            padding: 17px;
          }

          .pc-product {
            align-items: flex-start;
          }

          .pc-product-main {
            align-items: flex-start;
          }
        }

        @media print {
          body {
            margin: 0 !important;
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          .pc-preview-section,
          .pc-preview-section * {
            visibility: visible !important;
          }

          .pc-page {
            padding: 0 !important;
            background: white !important;
          }

          .pc-header,
          .pc-heading,
          .pc-layout,
          .pc-preview-heading,
          .pc-note {
            display: none !important;
          }

          .pc-preview-section {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          .pc-preview-grid {
            gap: 0 !important;
          }

          .pc-label {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </main>
  );
}
