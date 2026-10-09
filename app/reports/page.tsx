"use client";

import { useEffect, useState } from "react";
import { getProducts } from "../lib/storage";

type ReportData = {
  products: number;
  labels: number;
  barcodes: number;
  qrcodes: number;
};

const LABEL_STORAGE_KEYS = [
  "labelpro_labels",
  "labelpro_saved_labels",
  "labelpro_designs",
];

function getLabelsCount(): number {
  try {
    for (const key of LABEL_STORAGE_KEYS) {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed.length;
      }
    }
  } catch (error) {
    console.error("Unable to read saved labels:", error);
  }

  return 0;
}

function getSavedBarcodesCount(): number {
  try {
    return getProducts().filter(
      (product) =>
        !product.archived &&
        typeof product.barcode === "string" &&
        product.barcode.trim().length > 0
    ).length;
  } catch (error) {
    console.error("Unable to read saved product barcodes:", error);
    return 0;
  }
}

function getSavedQRCodesCount(): number {
  try {
    const raw = localStorage.getItem("labelpro_qrcodes");

    if (!raw) return 0;

    const parsed: unknown = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed.length;
    }

    if (parsed && typeof parsed === "object") {
      const data = parsed as {
        items?: unknown;
        data?: unknown;
      };

      if (Array.isArray(data.items)) {
        return data.items.length;
      }

      if (Array.isArray(data.data)) {
        return data.data.length;
      }
    }
  } catch (error) {
    console.error("Unable to read saved QR codes:", error);
  }

  return 0;
}

function downloadCSV(report: ReportData) {
  const rows: (string | number)[][] = [
    ["LabelPro Report"],
    ["Report Date", new Date().toLocaleDateString("en-IN")],
    [],
    ["Category", "Total"],
    ["Products", report.products],
    ["Labels", report.labels],
    ["Barcodes", report.barcodes],
    ["QR Codes", report.qrcodes],
  ];

  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "labelpro-report.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData>({
    products: 0,
    labels: 0,
    barcodes: 0,
    qrcodes: 0,
  });

  const [loaded, setLoaded] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    const updateReport = () => {
      try {
        const products = getProducts();

        setReport({
          products: products.length,
          labels: getLabelsCount(),
          barcodes: getSavedBarcodesCount(),
          qrcodes: getSavedQRCodesCount(),
        });
      } catch (error) {
        console.error("Unable to load report data:", error);
      } finally {
        setLoaded(true);
      }
    };

    const timer = window.setTimeout(updateReport, 0);

    window.addEventListener("storage", updateReport);
    window.addEventListener("focus", updateReport);
    window.addEventListener("labelpro-labels-updated", updateReport);
    window.addEventListener("labelpro-products-updated", updateReport);
    window.addEventListener("labelpro-qrcodes-updated", updateReport);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", updateReport);
      window.removeEventListener("focus", updateReport);
      window.removeEventListener(
        "labelpro-labels-updated",
        updateReport
      );
      window.removeEventListener(
        "labelpro-products-updated",
        updateReport
      );
      window.removeEventListener(
        "labelpro-qrcodes-updated",
        updateReport
      );
    };
  }, [refreshCount]);

  const cards = [
    {
      title: "Total Products",
      value: report.products,
      description: "Saved products, including archived products",
    },
    {
      title: "Total Labels",
      value: report.labels,
      description: "Saved label designs",
    },
    {
      title: "Barcodes",
      value: report.barcodes,
      description: "Non-archived products with a saved barcode",
    },
    {
      title: "QR Codes",
      value: report.qrcodes,
      description: "QR code records saved on this device",
    },
  ];

  return (
    <main className="rp-page">
      <style>{`
        .rp-page {
          max-width: 1150px;
          margin: 0 auto;
          padding: 28px 20px 50px;
          color: var(--foreground, #172033);
        }

        .rp-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 28px;
        }

        .rp-header h1 {
          margin: 0 0 8px;
          font-size: clamp(26px, 4vw, 36px);
          font-weight: 800;
        }

        .rp-subtitle {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
        }

        .rp-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .rp-button {
          padding: 11px 16px;
          border-radius: 10px;
          border: 1px solid #dbe2ea;
          background: #ffffff;
          color: #172033;
          font-weight: 700;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .rp-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .rp-primary {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
        }

        .rp-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .rp-card {
          padding: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: var(--card, #ffffff);
          box-shadow: 0 5px 18px rgba(15, 23, 42, 0.04);
        }

        .rp-card-label {
          margin: 0 0 12px;
          color: #64748b;
          font-size: 14px;
          font-weight: 600;
        }

        .rp-card-value {
          margin: 0 0 10px;
          font-size: 36px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .rp-card-description {
          margin: 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }

        .rp-section {
          margin-top: 28px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: var(--card, #ffffff);
        }

        .rp-section h2 {
          margin: 0 0 8px;
          font-size: 21px;
        }

        .rp-section p {
          color: #64748b;
          line-height: 1.7;
        }

        .rp-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .rp-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .rp-table th,
        .rp-table td {
          padding: 14px 10px;
          border-bottom: 1px solid #e2e8f0;
        }

        .rp-table th {
          color: #64748b;
          font-size: 13px;
        }

        .rp-table td:last-child,
        .rp-table th:last-child {
          text-align: right;
        }

        .rp-note {
          margin-top: 18px;
          padding: 14px;
          border-radius: 10px;
          background: #eff6ff;
          color: #1e40af;
          font-size: 13px;
          line-height: 1.7;
        }

        @media (min-width: 800px) {
          .rp-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        @media (max-width: 480px) {
          .rp-page {
            padding: 20px 14px 36px;
          }

          .rp-grid {
            gap: 12px;
          }

          .rp-card {
            padding: 16px;
          }

          .rp-card-value {
            font-size: 29px;
          }

          .rp-button {
            padding: 10px 12px;
          }

          .rp-section {
            padding: 16px;
          }
        }
      `}</style>

      <header className="rp-header">
        <div>
          <h1>Reports</h1>
          <p className="rp-subtitle">
            Your LabelPro business overview and saved data summary.
          </p>
        </div>

        <div className="rp-actions">
          <a className="rp-button" href="/labelpro/">
            Dashboard
          </a>

          <button
            type="button"
            className="rp-button"
            onClick={() => setRefreshCount((count) => count + 1)}
            disabled={!loaded}
          >
            Refresh
          </button>

          <button
            type="button"
            className="rp-button rp-primary"
            onClick={() => downloadCSV(report)}
            disabled={!loaded}
          >
            Export CSV
          </button>
        </div>
      </header>

      <section className="rp-grid" aria-label="Report summary">
        {cards.map((card) => (
          <article className="rp-card" key={card.title}>
            <p className="rp-card-label">{card.title}</p>

            <p className="rp-card-value">
              {loaded ? card.value.toLocaleString("en-IN") : "—"}
            </p>

            <p className="rp-card-description">
              {card.description}
            </p>
          </article>
        ))}
      </section>

      <section className="rp-section">
        <h2>Data Summary</h2>

        <p>
          Review the available saved records in your current browser.
        </p>

        <div className="rp-table-wrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Records</th>
              </tr>
            </thead>

            <tbody>
              {cards.map((card) => (
                <tr key={card.title}>
                  <td>{card.title}</td>

                  <td>
                    {loaded
                      ? card.value.toLocaleString("en-IN")
                      : "Loading…"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rp-note">
          <strong>Important:</strong> Products are counted from the existing
          product storage. Labels are counted using the storage keys used by
          the Labels page. Barcodes count non-archived products that have a
          saved barcode value. QR Codes count saved records under
          &quot;labelpro_qrcodes&quot;; the current QR generator does not
          automatically save generated QR codes, so this number may remain
          zero until QR history storage is added. These figures are saved
          record counts, not printing history.
        </div>
      </section>
    </main>
  );
}
