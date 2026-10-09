"use client";

import { useEffect, useState } from "react";

type ReportData = {
  products: number;
  labels: number;
  barcodes: number;
  qrcodes: number;
};

const STORAGE_KEYS = {
  products: "labelpro_products",
  labels: "labelpro_labels",
  barcodes: "labelpro_barcodes",
  qrcodes: "labelpro_qrcodes",
};

function getCount(key: string): number {
  try {
    const value = localStorage.getItem(key);

    if (!value) return 0;

    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) return parsed.length;

    if (parsed && typeof parsed === "object") {
      if (Array.isArray(parsed.items)) return parsed.items.length;
      if (Array.isArray(parsed.data)) return parsed.data.length;
    }

    return 0;
  } catch {
    return 0;
  }
}

function downloadCSV(report: ReportData) {
  const rows = [
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
        .join(","),
    )
    .join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "labelpro-report.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData>({
    products: 0,
    labels: 0,
    barcodes: 0,
    qrcodes: 0,
  });

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReport({
        products: getCount(STORAGE_KEYS.products),
        labels: getCount(STORAGE_KEYS.labels),
        barcodes: getCount(STORAGE_KEYS.barcodes),
        qrcodes: getCount(STORAGE_KEYS.qrcodes),
      });

      setLoaded(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const cards = [
    {
      title: "Total Products",
      value: report.products,
      description: "Products saved on this device",
    },
    {
      title: "Total Labels",
      value: report.labels,
      description: "Saved label designs",
    },
    {
      title: "Barcodes",
      value: report.barcodes,
      description: "Saved barcode records",
    },
    {
      title: "QR Codes",
      value: report.qrcodes,
      description: "Saved QR code records",
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
          line-height: 1.6;
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
            <p className="rp-card-description">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="rp-section">
        <h2>Data Summary</h2>
        <p>Review the available saved records in your current browser.</p>

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
          Note: Counts depend on the localStorage keys used by your existing
          pages. If a feature uses a different key, its count may show zero
          until we connect the correct key. These counts represent saved
          records, not verified printing history.
        </div>
      </section>
    </main>
  );
}
