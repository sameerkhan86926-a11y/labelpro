"use client";

import { useState } from "react";

const quickActions = [
  {
    title: "Create Label",
    description: "Design a new professional label",
    icon: "▣",
  },
  {
    title: "Add Product",
    description: "Add product and SKU information",
    icon: "+",
  },
  {
    title: "Generate Barcode",
    description: "Create a barcode instantly",
    icon: "▥",
  },
  {
    title: "Generate QR",
    description: "Create a QR code",
    icon: "⌁",
  },
];

const modules = [
  {
    title: "Products",
    description: "Manage products, SKUs, prices, stock and product details.",
  },
    {
    title: "Label Designer",
    description: "Create professional labels with a flexible visual editor.",
  },
  {
    title: "Barcodes",
    description: "Generate and manage multiple professional barcode formats.",
  },
  {
    title: "QR Codes",
    description: "Create QR codes for products, URLs and custom information.",
  },
  {
    title: "Templates",
    description: "Save reusable label designs for repeated printing.",
  },
  {
    title: "Print Center",
    description: "Preview, generate and print labels with precise settings.",
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState("Dashboard");

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
          {[
            "Dashboard",
            "Products",
            "Labels",
            "Barcodes",
            "QR Codes",
            "Templates",
            "Print Center",
            "Reports",
          ].map((item) => (
            <button
              key={item}
              className={`nav-item ${
                activeTab === item ? "active" : ""
              }`}
              onClick={() => setActiveTab(item)}
            >
              <span className="nav-dot" />
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item">
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
            <button className="secondary-button">Backup</button>
            <button className="primary-button">+ Create Label</button>
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
              <strong>0</strong>
              <small>Products in workspace</small>
            </div>

            <div className="stat-card">
              <span>Labels Created</span>
              <strong>0</strong>
              <small>All label designs</small>
            </div>

            <div className="stat-card">
              <span>Labels Printed</span>
              <strong>0</strong>
              <small>Printing activity</small>
            </div>

            <div className="stat-card">
              <span>Templates</span>
              <strong>0</strong>
              <small>Saved templates</small>
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
                <button className="action-card" key={action.title}>
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
                <button className="module-card" key={module.title}>
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

                <button className="text-button">View all</button>
              </div>

              <div className="empty-state">
                <div className="empty-icon">○</div>
                <strong>No activity yet</strong>
                <p>
                  Your label, product and printing activity will appear here.
                </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-label">WORKSPACE STATUS</span>
                  <h3>System ready</h3>
                </div>
              </div>

              <div className="status-list">
                <div>
                  <span>Product storage</span>
                  <strong>Ready</strong>
                </div>

                <div>
                  <span>Label designer</span>
                  <strong>Ready</strong>
                </div>

                <div>
                  <span>Barcode engine</span>
                  <strong>Ready</strong>
                </div>

                <div>
                  <span>Print system</span>
                  <strong>Ready</strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
