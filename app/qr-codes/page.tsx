"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  getProducts,
  type StoredProduct,
} from "../lib/storage";

type QRType =
  | "text"
  | "url"
  | "product"
  | "contact"
  | "email"
  | "phone"
  | "wifi";

const qrTypes: { value: QRType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "url", label: "Website / URL" },
  { value: "product", label: "Product" },
  { value: "contact", label: "Contact" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "wifi", label: "Wi-Fi" },
];

export default function QRCodesPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [products, setProducts] = useState<StoredProduct[]>([]);
  const [type, setType] = useState<QRType>("text");
  const [value, setValue] = useState("LabelPro");
  const [selectedProductId, setSelectedProductId] = useState("");

  const [size, setSize] = useState(260);
  const [margin, setMargin] = useState(3);
  const [errorCorrection, setErrorCorrection] = useState<
    "L" | "M" | "Q" | "H"
  >("M");

  const [foreground, setForeground] = useState("#111827");
  const [background, setBackground] = useState("#ffffff");

  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");

  const [wifiName, setWifiName] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSecurity, setWifiSecurity] = useState("WPA");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setProducts(getProducts());
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  function buildQRData() {
    if (type === "url") {
      return value.trim();
    }

    if (type === "product") {
      const product = products.find(
        (item) => item.id === selectedProductId
      );

      if (!product) {
        return "";
      }

      return [
        `Product: ${product.name}`,
        product.sku ? `SKU: ${product.sku}` : "",
        product.barcode ? `Barcode: ${product.barcode}` : "",
        product.mrp ? `MRP: ₹${product.mrp}` : "",
        product.price ? `Price: ₹${product.price}` : "",
        product.category ? `Category: ${product.category}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    }

    if (type === "contact") {
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${contactName}`,
        `TEL:${contactPhone}`,
        `EMAIL:${contactEmail}`,
        "END:VCARD",
      ].join("\n");
    }

    if (type === "email") {
      return `mailto:${emailAddress}?subject=${encodeURIComponent(
        emailSubject
      )}&body=${encodeURIComponent(emailBody)}`;
    }

    if (type === "phone") {
      return `tel:${phoneNumber}`;
    }

    if (type === "wifi") {
      return `WIFI:T:${wifiSecurity};S:${wifiName};P:${wifiPassword};;`;
    }

    return value.trim();
  }

  const qrData = buildQRData();

  useEffect(() => {
    if (!canvasRef.current || !qrData) {
      return;
    }

    const timer = window.setTimeout(() => {
      QRCode.toCanvas(
        canvasRef.current,
        qrData,
        {
          width: size,
          margin,
          errorCorrectionLevel: errorCorrection,
          color: {
            dark: foreground,
            light: background,
          },
        },
        (generationError) => {
          if (generationError) {
            setError("Unable to generate the QR code.");
          }
        }
      );
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    qrData,
    size,
    margin,
    errorCorrection,
    foreground,
    background,
  ]);

  function handleTypeChange(nextType: QRType) {
    setType(nextType);
    setSuccess("");
    setError("");
    setSelectedProductId("");

    if (nextType === "text") {
      setValue("LabelPro");
    }

    if (nextType === "url") {
      setValue("https://example.com");
    }
  }

  function handleProductChange(productId: string) {
    setSelectedProductId(productId);
    setSuccess("");
    setError("");
  }

  function downloadPng() {
    if (!canvasRef.current || !qrData) {
      setError("Generate a QR code first.");
      return;
    }

    const link = document.createElement("a");

    link.href = canvasRef.current.toDataURL("image/png");
    link.download = `labelpro-qr-${Date.now()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function printQRCode() {
    if (!canvasRef.current || !qrData) {
      setError("Generate a QR code first.");
      return;
    }

    const image = canvasRef.current.toDataURL("image/png");

    const printWindow = window.open(
      "",
      "_blank",
      "width=600,height=700"
    );

    if (!printWindow) {
      setError(
        "Please allow pop-ups in your browser to print the QR code."
      );
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>LabelPro QR Code</title>
          <style>
            body {
              margin: 0;
              padding: 40px;
              background: white;
              font-family: Arial, sans-serif;
              text-align: center;
            }

            img {
              width: ${size}px;
              height: ${size}px;
              max-width: 100%;
            }

            @media print {
              body {
                padding: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <img src="${image}" alt="QR Code" />
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
    setType("text");
    setValue("");
    setSelectedProductId("");
    setContactName("");
    setContactPhone("");
    setContactEmail("");
    setEmailAddress("");
    setEmailSubject("");
    setEmailBody("");
    setPhoneNumber("");
    setWifiName("");
    setWifiPassword("");
    setWifiSecurity("WPA");
    setSuccess("");
    setError("");
  }

  function renderTypeFields() {
    if (type === "product") {
      return (
        <div className="form-field qr-wide">
          <label htmlFor="qr-product">
            Product
          </label>

          <select
            id="qr-product"
            value={selectedProductId}
            onChange={(event) =>
              handleProductChange(event.target.value)
            }
          >
            <option value="">Select product</option>

            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
                {product.sku ? ` — ${product.sku}` : ""}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (type === "contact") {
      return (
        <>
          <div className="form-field">
            <label htmlFor="contact-name">
              Name
            </label>

            <input
              id="contact-name"
              type="text"
              value={contactName}
              onChange={(event) =>
                setContactName(event.target.value)
              }
              placeholder="John Doe"
            />
          </div>

          <div className="form-field">
            <label htmlFor="contact-phone">
              Phone
            </label>

            <input
              id="contact-phone"
              type="tel"
              value={contactPhone}
              onChange={(event) =>
                setContactPhone(event.target.value)
              }
              placeholder="+91 9876543210"
            />
          </div>

          <div className="form-field qr-wide">
            <label htmlFor="contact-email">
              Email
            </label>

            <input
              id="contact-email"
              type="email"
              value={contactEmail}
              onChange={(event) =>
                setContactEmail(event.target.value)
              }
              placeholder="contact@example.com"
            />
          </div>
        </>
      );
    }

    if (type === "email") {
      return (
        <>
          <div className="form-field qr-wide">
            <label htmlFor="email-address">
              Email Address
            </label>

            <input
              id="email-address"
              type="email"
              value={emailAddress}
              onChange={(event) =>
                setEmailAddress(event.target.value)
              }
              placeholder="hello@example.com"
            />
          </div>

          <div className="form-field">
            <label htmlFor="email-subject">
              Subject
            </label>

            <input
              id="email-subject"
              type="text"
              value={emailSubject}
              onChange={(event) =>
                setEmailSubject(event.target.value)
              }
              placeholder="Hello"
            />
          </div>

          <div className="form-field">
            <label htmlFor="email-body">
              Message
            </label>

            <input
              id="email-body"
              type="text"
              value={emailBody}
              onChange={(event) =>
                setEmailBody(event.target.value)
              }
              placeholder="Your message"
            />
          </div>
        </>
      );
    }

    if (type === "phone") {
      return (
        <div className="form-field qr-wide">
          <label htmlFor="phone-number">
            Phone Number
          </label>

          <input
            id="phone-number"
            type="tel"
            value={phoneNumber}
            onChange={(event) =>
              setPhoneNumber(event.target.value)
            }
            placeholder="+91 9876543210"
          />
        </div>
      );
    }

    if (type === "wifi") {
      return (
        <>
          <div className="form-field">
            <label htmlFor="wifi-name">
              Network Name
            </label>

            <input
              id="wifi-name"
              type="text"
              value={wifiName}
              onChange={(event) =>
                setWifiName(event.target.value)
              }
              placeholder="Wi-Fi name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="wifi-password">
              Password
            </label>

            <input
              id="wifi-password"
              type="text"
              value={wifiPassword}
              onChange={(event) =>
                setWifiPassword(event.target.value)
              }
              placeholder="Wi-Fi password"
            />
          </div>

          <div className="form-field qr-wide">
            <label htmlFor="wifi-security">
              Security
            </label>

            <select
              id="wifi-security"
              value={wifiSecurity}
              onChange={(event) =>
                setWifiSecurity(event.target.value)
              }
            >
              <option value="WPA">WPA / WPA2 / WPA3</option>
              <option value="WEP">WEP</option>
              <option value="">Open network</option>
            </select>
          </div>
        </>
      );
    }

    return (
      <div className="form-field qr-wide">
        <label htmlFor="qr-value">
          {type === "url" ? "Website URL" : "Text"}
        </label>

        <textarea
          id="qr-value"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError("");
            setSuccess("");
          }}
          placeholder={
            type === "url"
              ? "https://example.com"
              : "Enter text to encode"
          }
          rows={4}
        />
      </div>
    );
  }

  return (
    <main className="module-page">
      <section className="module-header">
        <div>
          <span className="eyebrow">
            TOOLS / QR CODE GENERATOR
          </span>

          <h2>QR Code Generator</h2>

          <p>
            Create professional QR codes for products, websites,
            contacts, email, phone numbers, Wi-Fi networks and
            custom text.
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

      <section className="qr-workspace">
        <div className="qr-controls-panel">
          <div className="qr-section-heading">
            <div>
              <span className="eyebrow">QR SETUP</span>
              <h3>Create QR Code</h3>
            </div>
          </div>

          <div className="qr-form">
            <div className="form-field">
              <label htmlFor="qr-type">
                QR Type
              </label>

              <select
                id="qr-type"
                value={type}
                onChange={(event) =>
                  handleTypeChange(
                    event.target.value as QRType
                  )
                }
              >
                {qrTypes.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label htmlFor="qr-error-correction">
                Error Correction
              </label>

              <select
                id="qr-error-correction"
                value={errorCorrection}
                onChange={(event) =>
                  setErrorCorrection(
                    event.target.value as
                      | "L"
                      | "M"
                      | "Q"
                      | "H"
                  )
                }
              >
                <option value="L">Low — 7%</option>
                <option value="M">Medium — 15%</option>
                <option value="Q">Quartile — 25%</option>
                <option value="H">High — 30%</option>
              </select>
            </div>

            {renderTypeFields()}

            <div className="form-section-title">
              Appearance
            </div>

            <div className="form-field">
              <label htmlFor="qr-size">
                Size
              </label>

              <input
                id="qr-size"
                type="number"
                min="120"
                max="1000"
                step="10"
                value={size}
                onChange={(event) =>
                  setSize(Number(event.target.value))
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="qr-margin">
                Margin
              </label>

              <input
                id="qr-margin"
                type="number"
                min="0"
                max="20"
                step="1"
                value={margin}
                onChange={(event) =>
                  setMargin(Number(event.target.value))
                }
              />
            </div>

            <div className="form-field">
              <label htmlFor="qr-foreground">
                QR Color
              </label>

              <div className="qr-color-control">
                <input
                  id="qr-foreground"
                  type="color"
                  value={foreground}
                  onChange={(event) =>
                    setForeground(event.target.value)
                  }
                />

                <span>{foreground}</span>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="qr-background">
                Background
              </label>

              <div className="qr-color-control">
                <input
                  id="qr-background"
                  type="color"
                  value={background}
                  onChange={(event) =>
                    setBackground(event.target.value)
                  }
                />

                <span>{background}</span>
              </div>
            </div>

            {error && (
              <div className="qr-message qr-error">
                {error}
              </div>
            )}

            {success && (
              <div className="qr-message qr-success">
                {success}
              </div>
            )}

            <div className="qr-form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={downloadPng}
              >
                Download PNG
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={printQRCode}
              >
                Print QR Code
              </button>
            </div>
          </div>
        </div>

        <div className="qr-preview-panel">
          <div className="qr-preview-header">
            <div>
              <span className="eyebrow">LIVE PREVIEW</span>
              <h3>QR Preview</h3>
            </div>

            <span className="qr-type-badge">
              {qrTypes.find(
                (item) => item.value === type
              )?.label}
            </span>
          </div>

          <div className="qr-preview-stage">
            {qrData ? (
              <canvas
                ref={canvasRef}
                className="qr-canvas"
              />
            ) : (
              <div className="qr-empty">
                <strong>No QR data</strong>

                <span>
                  Enter or select information to generate
                  the QR code.
                </span>
              </div>
            )}
          </div>

          <div className="qr-preview-info">
            <div>
              <span>Type</span>

              <strong>
                {qrTypes.find(
                  (item) => item.value === type
                )?.label}
              </strong>
            </div>

            <div>
              <span>Size</span>

              <strong>{size}px</strong>
            </div>

            <div>
              <span>Correction</span>

              <strong>{errorCorrection}</strong>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
