"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

type SavedLabel = {
  id: string;
  name?: string;
  title?: string;
  createdAt?: string;
};

const STORAGE_KEYS = [
  "labelpro_labels",
  "labelpro_saved_labels",
  "labelpro_designs",
];

const EMPTY_LABELS: SavedLabel[] = [];

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("labelpro-labels-updated", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("labelpro-labels-updated", callback);
  };
}

function getSavedLabels(): SavedLabel[] {
  try {
    for (const key of STORAGE_KEYS) {
      const raw = localStorage.getItem(key);

      if (!raw) continue;

      const parsed: unknown = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed as SavedLabel[];
      }
    }
  } catch {
    return EMPTY_LABELS;
  }

  return EMPTY_LABELS;
}

function getServerLabels(): SavedLabel[] {
  return EMPTY_LABELS;
}

export default function LabelsPage() {
  const labels = useSyncExternalStore(
    subscribeToStorage,
    getSavedLabels,
    getServerLabels
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f7ff",
        padding: "32px 20px",
        color: "#16356b",
      }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <Link
          href="/"
          style={{
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← Back to Dashboard
        </Link>

        <header style={{ margin: "28px 0" }}>
          <p
            style={{
              color: "#2563eb",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "1.5px",
            }}
          >
            LABEL MANAGEMENT
          </p>

          <h1 style={{ fontSize: "32px", margin: "8px 0" }}>
            My Labels
          </h1>

          <p style={{ color: "#64748b", lineHeight: 1.7 }}>
            View your saved labels or create a new label design.
          </p>
        </header>

        <section
          style={{
            display: "flex",
            gap: "16px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dbe7ff",
              borderRadius: "16px",
              padding: "22px",
              flex: "1 1 180px",
            }}
          >
            <p style={{ color: "#64748b", margin: "0 0 10px" }}>
              Saved Labels
            </p>

            <strong style={{ fontSize: "30px" }}>
              {labels.length}
            </strong>
          </div>

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #dbe7ff",
              borderRadius: "16px",
              padding: "22px",
              flex: "2 1 280px",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Create a new label</h3>

            <p style={{ color: "#64748b", lineHeight: 1.6 }}>
              Open Label Designer to create a label for your products.
            </p>

            <Link
              href="/labels/designer/"
              style={{
                display: "inline-block",
                background: "#2563eb",
                color: "#ffffff",
                padding: "12px 18px",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              + Open Label Designer
            </Link>
          </div>
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #dbe7ff",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "21px" }}>
            Saved Labels
          </h2>

          {labels.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 12px",
                color: "#64748b",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>
                ▤
              </div>

              <strong style={{ color: "#16356b" }}>
                No saved labels found
              </strong>

              <p>
                Saved labels will appear here when they are stored using a
                compatible storage key.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {labels.map((label, index) => (
                <div
                  key={label.id || index}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>
                      {label.name || label.title || `Label ${index + 1}`}
                    </strong>

                    {label.createdAt && (
                      <p
                        style={{
                          color: "#64748b",
                          fontSize: "13px",
                          marginBottom: 0,
                        }}
                      >
                        Created: {label.createdAt}
                      </p>
                    )}
                  </div>

                  <Link
                    href="/labels/designer/"
                    style={{
                      color: "#2563eb",
                      textDecoration: "none",
                      fontWeight: 700,
                    }}
                  >
                    Open Designer →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
