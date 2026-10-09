"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts } from "./lib/storage";

const quickActions = [
  {
    title: "Create Label",
    description: "Design a new professional label",
    icon: "▣",
    path: "/label-designer/",
  },
  {
    title: "Add Product",
    description: "Add product and SKU information",
    icon: "+",
    path: "/products/",
  },
  {
    title: "Generate Barcode",
    description: "Create a barcode instantly",
    icon: "▥",
    path: "/barcodes/",
  },
  {
    title: "Generate QR",
    description: "Create a QR code",
    icon: "⌁",
    path: "/qr-codes/",
  },
];

const modules = [
  {
    title: "Products",
    description: "Manage products, SKUs, prices, stock and product details.",
    path: "/products/",
  },
  {
    title: "Label Designer",
    description: "Create professional labels with a flexible visual editor.",
    path: "/label-designer/",
  },
  {
    title: "Labels",
    description: "View and manage your created labels.",
    path: "/labels/",
  },
  {
    title: "Barcodes",
    description: "Generate and manage multiple professional barcode formats.",
    path: "/barcodes/",
  },
  {
    title: "QR Codes",
    description: "Create QR codes for products, URLs and custom information.",
    path: "/qr-codes/",
  },
  {
    title: "Templates",
    description: "Save reusable label designs for repeated printing.",
    path: "/templates/",
  },
  {
    title: "Print Center",
    description: "Preview, generate and print labels with precise settings.",
    path: "/print-center/",
  },
  {
    title: "Import / Export",
    description: "Import products from CSV and export product data.",
    path: "/import-export/",
  },
  {
    title: "Reports",
    description: "Review product and workspace information.",
    path: "/reports/",
  },
  {
    title: "Settings",
    description: "Manage your workspace preferences.",
    path: "/settings/",
  },
];

const navigation = [
  { label: "Dashboard", path: "/" },
  { label: "Products", path: "/products/" },
  { label: "Labels", path: "/labels/" },
  { label: "Label Designer", path: "/label-designer/" },
  { label: "Barcodes", path: "/barcodes/" },
  { label: "QR Codes", path: "/qr-codes/" },
  { label: "Templates", path: "/templates/" },
  { label: "Print Center", path: "/print-center/" },
  { label: "Import / Export", path: "/import-export/" },
  { label: "Reports", path: "/reports/" },
];

export default function Home() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState("Dashboard");
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    function refreshProductCount() {
      setProductCount(getProducts().filter((product) => !product.archived).length);
    }

    refreshProductCount();

    window.addEventListener("focus", refreshProductCount);
    window.addEventListener("storage", refreshProductCount);

    return () => {
      window.removeEventListener("focus", refreshProductCount);
      window.removeEventListener("storage", refreshProductCount);
    };
  }, []);

  function navigateTo(label: string, path: string) {
  setActiveTab(label);

  router.push(path);
}

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">L</div>

          <div>
            <div className="brand-name">LabelPro</div>
            <div className="brand-subtitle">Label Management</div>
          </div>
        </div>

        <nav className="navigation">
          {navigation.map((item) => (
            <button
              key={item.label}
              type="button"
              className={`nav-item ${
                activeTab === item.label ? "active" : ""
              }`}
              onClick={() => navigateTo(item.label, item.path)}
            >
              <span className="nav-dot" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="nav-item"
            onClick={() => navigateTo("Settings", "/settings/")}
          >
            <span className="nav-dot" />
            Settings
          </button>

          <div className="free-badge">
            <strong>Free Workspace</strong>
            <span>No login required</span>
          </div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Workspace / {activeTab}</div>
            <h1>{activeTab}</h1>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigateTo("Import / Export", "/import-export/")}
            >
              Backup / Export
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={() => navigateTo("Label Designer", "/label-designer/")}
            >
              + Create Label
            </button>
          </div>
        </header>

        <div className="content">
          <section className="welcome">
            <div>
              <span className="eyebrow">PROFESSIONAL LABEL WORKSPACE</span>

              <h2>
                Create, manage and print
                <br />
                <span>professional labels.</span>
              </h2>

              <p>
                Manage products, barcodes, QR codes, templates and printing
                from one powerful workspace.
              </p>
            </div>

            <div className="welcome-badge">
              <span>Local Workspace</span>
              <strong>Your data stays on this device</strong>
            </div>
          </section>

          <section className="stats-grid">
            <div className="stat-card">
              <span>Total Products</span>
              <strong>{productCount}</strong>
              <small>Active products in workspace</small>
            </div>

            <div className="stat-card">
              <span>Labels Created</span>
              <strong>—</strong>
              <small>Label statistics not connected yet</small>
            </div>

            <div className="stat-card">
              <span>Labels Printed</span>
              <strong>—</strong>
              <small>Print history not connected yet</small>
            </div>

            <div className="stat-card">
              <span>Templates</span>
              <strong>—</strong>
              <small>Template statistics not connected yet</small>
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <div>
                <span className="section-label">QUICK ACTIONS</span>
                <h3>Start working</h3>
              </div>

              <span className="section-note">Choose an operation</span>
            </div>

            <div className="actions-grid">
              {quickActions.map((action) => (
                <button
                  type="button"
                  className="action-card"
                  key={action.title}
                  onClick={() => navigateTo(action.title, action.path)}
                >
                  <span className="action-icon">{action.icon}</span>

                  <span className="action-content">
                    <strong>{action.title}</strong>
                    <small>{action.description}</small>
                  </span>

                  <span className="arrow">→</span>
                </button>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-heading">
              <div>
                <span className="section-label">WORKSPACE MODULES</span>
                <h3>Everything you need</h3>
              </div>
            </div>

            <div className="modules-grid">
              {modules.map((module) => (
                <button
                  type="button"
                  className="module-card"
                  key={module.title}
                  onClick={() => navigateTo(module.title, module.path)}
                >
                  <div className="module-icon">
                    {module.title.charAt(0)}
                  </div>

                  <div>
                    <strong>{module.title}</strong>
                    <p>{module.description}</p>
                  </div>

                  <span className="module-arrow">↗</span>
                </button>
              ))}
            </div>
          </section>

          <section className="bottom-grid">
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-label">RECENT ACTIVITY</span>
                  <h3>Latest work</h3>
                </div>

                <button
                  type="button"
                  className="text-button"
                  onClick={() => navigateTo("Reports", "/reports/")}
                >
                  View reports
                </button>
              </div>

              <div className="empty-state">
                <div className="empty-icon">○</div>
                <strong>Activity tracking not connected</strong>
                <p>
                  Activity history will appear here after the activity module
                  is implemented.
                </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-label">WORKSPACE STATUS</span>
                  <h3>Workspace overview</h3>
                </div>
              </div>

              <div className="status-list">
                <div>
                  <span>Product storage</span>
                  <strong>Available</strong>
                </div>

                <div>
                  <span>Label designer</span>
                  <strong>Page link configured</strong>
                </div>

                <div>
                  <span>Barcode tools</span>
                  <strong>Page link configured</strong>
                </div>

                <div>
                  <span>Print center</span>
                  <strong>Page link configured</strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
