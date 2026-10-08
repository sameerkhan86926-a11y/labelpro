import JsBarcode from "jsbarcode";
import QRCode from "qrcode";

import type { StoredProduct } from "./storage";
import type { LabelElement } from "./label-types";

export const DYNAMIC_FIELDS = [
  { value: "{{product_name}}", label: "Product Name" },
  { value: "{{sku}}", label: "SKU" },
  { value: "{{barcode}}", label: "Barcode" },
  { value: "{{price}}", label: "Selling Price" },
  { value: "{{mrp}}", label: "MRP" },
  { value: "{{batch}}", label: "Batch Number" },
  { value: "{{expiry}}", label: "Expiry Date" },
  {
    value: "{{manufacturing_date}}",
    label: "Manufacturing Date",
  },
  { value: "{{category}}", label: "Category" },
  { value: "{{weight}}", label: "Weight" },
  { value: "{{unit}}", label: "Unit" },
  { value: "{{manufacturer}}", label: "Manufacturer" },
  { value: "{{supplier}}", label: "Supplier" },
  { value: "{{country}}", label: "Country of Origin" },
];

export function getProductFieldValue(
  field: string,
  product: StoredProduct | null,
): string {
  if (!product) return "";

  switch (field) {
    case "{{product_name}}":
      return product.name;

    case "{{sku}}":
      return product.sku;

    case "{{barcode}}":
      return product.barcode;

    case "{{price}}":
      return product.price
        ? `₹${product.price}`
        : "";

    case "{{mrp}}":
      return product.mrp
        ? `₹${product.mrp}`
        : "";

    case "{{batch}}":
      return product.batchNumber;

    case "{{expiry}}":
      return formatDate(product.expiryDate);

    case "{{manufacturing_date}}":
      return formatDate(
        product.manufacturingDate,
      );

    case "{{category}}":
      return product.category;

    case "{{weight}}":
      return product.weight;

    case "{{unit}}":
      return product.unit;

    case "{{manufacturer}}":
      return product.manufacturer;

    case "{{supplier}}":
      return product.supplier;

    case "{{country}}":
      return product.countryOfOrigin;

    default:
      return field;
  }
}

export function replaceDynamicFields(
  text: string,
  product: StoredProduct | null,
): string {
  if (!text) return "";

  return text.replace(
    /\{\{[^}]+\}\}/g,
    (field) =>
      getProductFieldValue(
        field,
        product,
      ),
  );
}

export function getElementDisplayText(
  element: LabelElement,
  product: StoredProduct | null,
): string {
  if (
    element.type === "product_name" &&
    product
  ) {
    return product.name;
  }

  if (
    element.type === "sku" &&
    product
  ) {
    return product.sku;
  }

  if (
    element.type === "price" &&
    product
  ) {
    return product.price
      ? `₹${product.price}`
      : "";
  }

  if (
    element.type === "mrp" &&
    product
  ) {
    return product.mrp
      ? `₹${product.mrp}`
      : "";
  }

  if (
    element.type === "batch" &&
    product
  ) {
    return product.batchNumber;
  }

  if (
    element.type === "expiry" &&
    product
  ) {
    return formatDate(
      product.expiryDate,
    );
  }

  if (
    element.type ===
      "manufacturing_date" &&
    product
  ) {
    return formatDate(
      product.manufacturingDate,
    );
  }

  if (element.text) {
    return replaceDynamicFields(
      element.text,
      product,
    );
  }

  return "";
}

export function renderBarcode(
  svg: SVGSVGElement,
  value: string,
  format = "CODE128",
) {
  if (!value) {
    svg.innerHTML = "";
    return;
  }

  try {
    JsBarcode(svg, value, {
      format,
      width: 2,
      height: 45,
      displayValue: true,
      fontSize: 10,
      margin: 2,
      lineColor: "#111827",
      background: "#ffffff",
    });
  } catch {
    svg.innerHTML = "";
  }
}

export async function renderQRCode(
  canvas: HTMLCanvasElement,
  value: string,
) {
  if (!value) {
    const context =
      canvas.getContext("2d");

    context?.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return;
  }

  try {
    await QRCode.toCanvas(
      canvas,
      value,
      {
        width: 150,
        margin: 1,
        errorCorrectionLevel: "M",
        color: {
          dark: "#111827",
          light: "#ffffff",
        },
      },
    );
  } catch {
    const context =
      canvas.getContext("2d");

    context?.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }
}

function formatDate(
  value: string,
): string {
  if (!value) return "";

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    },
  );
}
