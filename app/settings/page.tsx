"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type AppSettings = {
  workspaceName: string;
  businessName: string;
  labelWidth: number;
  labelHeight: number;
  unit: "mm" | "inch";
  defaultCopies: number;
  showBorder: boolean;
  labelSpacing: number;
  currency: string;
  theme: "light" | "dark";
};

const DEFAULT_SETTINGS: AppSettings = {
  workspaceName: "LabelPro Workspace",
  businessName: "",
  labelWidth: 50,
  labelHeight: 25,
  unit: "mm",
  defaultCopies: 1,
  showBorder: true,
  labelSpacing: 2,
  currency: "INR",
  theme: "light",
};

const STORAGE_KEY = "labelpro_settings";

function normalizeSettings(
  value: Partial<AppSettings>
): AppSettings {
  const width = Number(value.labelWidth ?? DEFAULT_SETTINGS.labelWidth);
  const height = Number(value.labelHeight ?? DEFAULT_SETTINGS.labelHeight);
  const copies = Number(value.defaultCopies ?? DEFAULT_SETTINGS.defaultCopies);
  const spacing = Number(value.labelSpacing ?? DEFAULT_SETTINGS.labelSpacing);

  return {
    workspaceName:
      typeof value.workspaceName === "string"
        ? value.workspaceName
        : DEFAULT_SETTINGS.workspaceName,

    businessName:
      typeof value.businessName === "string"
        ? value.businessName
        : DEFAULT_SETTINGS.businessName,

    labelWidth:
      Number.isFinite(width) && width > 0 && width <= 1000
        ? width
        : DEFAULT_SETTINGS.labelWidth,

    labelHeight:
      Number.isFinite(height) && height > 0 && height <= 1000
        ? height
        : DEFAULT_SETTINGS.labelHeight,

    unit: value.unit === "inch" ? "inch" : "mm",

    defaultCopies:
      Number.isInteger(copies) && copies >= 1 && copies <= 1000
        ? copies
        : DEFAULT_SETTINGS.defaultCopies,

    showBorder:
      typeof value.showBorder === "boolean"
        ? value.showBorder
        : DEFAULT_SETTINGS.showBorder,

    labelSpacing:
      Number.isFinite(spacing) && spacing >= 0 && spacing <= 100
        ? spacing
        : DEFAULT_SETTINGS.labelSpacing,

    currency: ["INR", "USD", "EUR", "GBP"].includes(
      String(value.currency)
    )
      ? String(value.currency)
      : DEFAULT_SETTINGS.currency,

    theme: value.theme === "dark" ? "dark" : "light",
  };
}

function loadInitialSettings(): AppSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      return normalizeSettings(
        JSON.parse(saved) as Partial<AppSettings>
      );
    }
  } catch {
    // Invalid or unavailable saved data falls back to defaults.
  }

  return DEFAULT_SETTINGS;
}

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<AppSettings>(DEFAULT_SETTINGS);

  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(loadInitialSettings());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      document.documentElement.dataset.theme = settings.theme;
    }
  }, [ready, settings.theme]);

  function update<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setMessage("");
  }

  function saveSettings() {
    try {
      const normalized = normalizeSettings(settings);

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(normalized)
      );

      setSettings(normalized);
      setMessage("Settings saved successfully.");
    } catch {
      setMessage(
        "Settings could not be saved. Please check browser storage."
      );
    }
  }

  function resetSettings() {
    const confirmed = window.confirm(
      "Reset LabelPro settings to their default values? Products and templates will not be deleted."
    );

    if (!confirmed) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      );

      setSettings(DEFAULT_SETTINGS);
      setMessage("Settings restored to defaults.");
    } catch {
      setMessage("Settings could not be reset.");
    }
  }

  function exportSettings() {
    try {
      const blob = new Blob(
        [JSON.stringify(settings, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "labelpro-settings.json";
      document.body.appendChild(link);
      link.click();
      link.remove();

      URL.revokeObjectURL(url);

      setMessage("Settings export started.");
    } catch {
      setMessage("Settings could not be exported.");
    }
  }

  function importSettings(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(
          String(reader.result)
        ) as Partial<AppSettings>;

        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed)
        ) {
          throw new Error("Invalid settings file");
        }

        const imported = normalizeSettings(parsed);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(imported)
        );

        setSettings(imported);
        setMessage("Settings imported successfully.");
      } catch {
        setMessage(
          "Invalid settings file. Please select a valid LabelPro settings JSON file."
        );
      }
    };

    reader.onerror = () => {
      setMessage("The selected file could not be read.");
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  if (!ready) {
    return (
      <main className="settings-loading">
        Loading settings...
      </main>
    );
  }

  return (
    <main className={`settings-page ${settings.theme}`}>
      <header className="settings-header">
        <div>
          <span className="settings-eyebrow">
            LABELPRO WORKSPACE
          </span>

          <h1>Settings</h1>

          <p>
            Manage your workspace, label defaults and preferences.
          </p>
        </div>

        <Link href="/" className="settings-back">
          ← Dashboard
        </Link>
      </header>

      {message && (
        <div className="settings-message" role="status">
          {message}
        </div>
      )}

      <section className="settings-card">
        <div className="card-heading">
          <span className="settings-icon">W</span>

          <div>
            <h2>Workspace</h2>
            <p>Customize your business workspace.</p>
          </div>
        </div>

        <div className="settings-grid">
          <label className="field">
            <span>Workspace name</span>

            <input
              value={settings.workspaceName}
              onChange={(e) =>
                update("workspaceName", e.target.value)
              }
              placeholder="My Workspace"
              maxLength={100}
            />
          </label>

          <label className="field">
            <span>Business name</span>

            <input
              value={settings.businessName}
              onChange={(e) =>
                update("businessName", e.target.value)
              }
              placeholder="Enter your business name"
              maxLength={100}
            />
          </label>
        </div>
      </section>

      <section className="settings-card">
        <div className="card-heading">
          <span className="settings-icon">L</span>

          <div>
            <h2>Default Label Size</h2>
            <p>Set the starting dimensions for new labels.</p>
          </div>
        </div>

        <div className="settings-grid three-columns">
          <label className="field">
            <span>Width</span>

            <input
              type="number"
              min="1"
              max="1000"
              value={settings.labelWidth}
              onChange={(e) =>
                update("labelWidth", Number(e.target.value))
              }
            />
          </label>

          <label className="field">
            <span>Height</span>

            <input
              type="number"
              min="1"
              max="1000"
              value={settings.labelHeight}
              onChange={(e) =>
                update("labelHeight", Number(e.target.value))
              }
            />
          </label>

          <label className="field">
            <span>Measurement unit</span>

            <select
              value={settings.unit}
              onChange={(e) =>
                update(
                  "unit",
                  e.target.value as AppSettings["unit"]
                )
              }
            >
              <option value="mm">Millimeters (mm)</option>
              <option value="inch">Inches (in)</option>
            </select>
          </label>
        </div>

        <div className="settings-note">
          Default size: {settings.labelWidth} ×{" "}
          {settings.labelHeight} {settings.unit}
        </div>
      </section>

      <section className="settings-card">
        <div className="card-heading">
          <span className="settings-icon">P</span>

          <div>
            <h2>Print Preferences</h2>
            <p>Choose default print options for your labels.</p>
          </div>
        </div>

        <div className="settings-grid three-columns">
          <label className="field">
            <span>Default copies</span>

            <input
              type="number"
              min="1"
              max="1000"
              value={settings.defaultCopies}
              onChange={(e) =>
                update("defaultCopies", Number(e.target.value))
              }
            />
          </label>

          <label className="field">
            <span>Spacing (mm)</span>

            <input
              type="number"
              min="0"
              max="100"
              value={settings.labelSpacing}
              onChange={(e) =>
                update("labelSpacing", Number(e.target.value))
              }
            />
          </label>

          <label className="toggle-field">
            <span>
              <strong>Label border</strong>
              <small>Show a border around labels</small>
            </span>

            <input
              type="checkbox"
              checked={settings.showBorder}
              onChange={(e) =>
                update("showBorder", e.target.checked)
              }
            />
          </label>
        </div>

        <div className="settings-note">
          These preferences are saved here. Print Center must be
          connected to use them automatically.
        </div>
      </section>

      <section className="settings-card">
        <div className="card-heading">
          <span className="settings-icon">A</span>

          <div>
            <h2>Appearance & Currency</h2>
            <p>Choose your preferred display options.</p>
          </div>
        </div>

        <div className="settings-grid">
          <label className="field">
            <span>Theme preference</span>

            <select
              value={settings.theme}
              onChange={(e) =>
                update(
                  "theme",
                  e.target.value as AppSettings["theme"]
                )
              }
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label className="field">
            <span>Currency</span>

            <select
              value={settings.currency}
              onChange={(e) =>
                update("currency", e.target.value)
              }
            >
              <option value="INR">Indian Rupee (₹ INR)</option>
              <option value="USD">US Dollar ($ USD)</option>
              <option value="EUR">Euro (€ EUR)</option>
              <option value="GBP">British Pound (£ GBP)</option>
            </select>
          </label>
        </div>

        <div className="settings-note">
          Theme preference applies to this page. Currency and
          print preferences require integration with other modules.
        </div>
      </section>

      <section className="settings-card">
        <div className="card-heading">
          <span className="settings-icon">D</span>

          <div>
            <h2>Settings Backup</h2>
            <p>Export or restore your LabelPro settings.</p>
          </div>
        </div>

        <div className="backup-actions">
          <button
            type="button"
            className="secondary-action"
            onClick={exportSettings}
          >
            Export Settings
          </button>

          <label className="secondary-action import-button">
            Import Settings

            <input
              type="file"
              accept=".json,application/json"
              onChange={importSettings}
              hidden
            />
          </label>
        </div>
      </section>

      <section className="settings-danger">
        <div>
          <h2>Reset Settings</h2>

          <p>
            Restore this page&apos;s settings to their default
            values. Products and saved templates will not be deleted.
          </p>
        </div>

        <button
          type="button"
          className="reset-button"
          onClick={resetSettings}
        >
          Reset Settings
        </button>
      </section>

      <footer className="settings-footer">
        <span>LabelPro · Label Management</span>

        <div>
          <button
            type="button"
            className="secondary-action"
            onClick={resetSettings}
          >
            Restore Defaults
          </button>

          <button
            type="button"
            className="save-button"
            onClick={saveSettings}
          >
            Save Settings
          </button>
        </div>
      </footer>

      <style jsx>{`
        .settings-page {
          --surface: #ffffff;
          --page-bg: #f4f7fb;
          --text: #172b4d;
          --muted: #66758b;
          --border: #e0e7f0;
          min-height: 100vh;
          padding: 32px;
          background: var(--page-bg);
          color: var(--text);
          font-family: Arial, Helvetica, sans-serif;
        }

        .settings-page.dark {
          --surface: #172033;
          --page-bg: #0d1424;
          --text: #f2f5fa;
          --muted: #aab7ca;
          --border: #344158;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
        }

        .settings-eyebrow {
          color: #3569d4;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
        }

        .settings-header h1 {
          margin: 8px 0;
          font-size: 32px;
          font-weight: 800;
        }

        .settings-header p,
        .card-heading p,
        .settings-danger p {
          margin: 0;
          color: var(--muted);
          font-size: 14px;
          line-height: 1.6;
        }

        .settings-back {
          padding: 11px 16px;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          background: var(--surface);
          text-decoration: none;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
        }

        .settings-message {
          margin-bottom: 18px;
          padding: 13px 16px;
          border: 1px solid #a9dfc1;
          border-radius: 10px;
          background: #eafaf1;
          color: #17653a;
          font-size: 14px;
        }

        .settings-card {
          margin-bottom: 18px;
          padding: 24px;
          border: 1px solid var(--border);
          border-radius: 16px;
          background: var(--surface);
          box-shadow: 0 5px 18px rgba(20, 40, 75, 0.035);
        }

        .card-heading {
          display: flex;
          align-items: center;
          gap: 13px;
          margin-bottom: 22px;
        }

        .settings-icon {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          border-radius: 12px;
          background: #eaf0ff;
          color: #2858c5;
          font-size: 17px;
          font-weight: 800;
        }

        .card-heading h2,
        .settings-danger h2 {
          margin: 0 0 5px;
          font-size: 18px;
          font-weight: 800;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 20px;
        }

        .three-columns {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
        }

        .field > span {
          font-size: 13px;
          font-weight: 700;
        }

        .field input,
        .field select {
          width: 100%;
          min-height: 45px;
          box-sizing: border-box;
          padding: 11px 12px;
          border: 1px solid var(--border);
          border-radius: 9px;
          outline: none;
          background: var(--surface);
          color: var(--text);
          font-size: 14px;
        }

        .field input:focus,
        .field select:focus {
          border-color: #4778e7;
          box-shadow: 0 0 0 3px rgba(71, 120, 231, 0.12);
        }

        .toggle-field {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 68px;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 10px;
        }

        .toggle-field span {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .toggle-field strong {
          font-size: 13px;
        }

        .toggle-field small {
          color: var(--muted);
          font-size: 12px;
        }

        .toggle-field input {
          width: 20px;
          height: 20px;
          accent-color: #3569d4;
        }

        .settings-note {
          margin-top: 16px;
          color: var(--muted);
          font-size: 12px;
          line-height: 1.6;
        }

        .backup-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .secondary-action,
        .save-button,
        .reset-button {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          min-height: 42px;
          padding: 10px 16px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        .secondary-action {
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
        }

        .import-button {
          cursor: pointer;
        }

        .settings-danger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-top: 22px;
          padding: 22px;
          border: 1px solid #f1c6c6;
          border-radius: 14px;
          background: #fff8f8;
          color: #702b2b;
        }

        .settings-danger p {
          max-width: 650px;
          color: #875858;
        }

        .reset-button {
          flex-shrink: 0;
          border: 1px solid #e5aaaa;
          background: #fff;
          color: #b42323;
        }

        .settings-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid var(--border);
          color: var(--muted);
          font-size: 13px;
        }

        .settings-footer > div {
          display: flex;
          gap: 10px;
        }

        .save-button {
          border: 1px solid #2858c5;
          background: #2858c5;
          color: #ffffff;
        }

        .settings-loading {
          padding: 40px;
          color: #172b4d;
          font-family: Arial, Helvetica, sans-serif;
        }

        @media (max-width: 800px) {
          .settings-page {
            padding: 20px 14px;
          }

          .settings-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .settings-header h1 {
            font-size: 28px;
          }

          .settings-grid,
          .three-columns {
            grid-template-columns: 1fr;
          }

          .settings-card {
            padding: 18px;
          }

          .settings-danger {
            align-items: flex-start;
            flex-direction: column;
          }

          .settings-footer {
            align-items: stretch;
            flex-direction: column;
          }

          .settings-footer > div {
            flex-wrap: wrap;
          }

          .settings-footer button {
            flex: 1;
          }
        }
      `}</style>
    </main>
  );
}
