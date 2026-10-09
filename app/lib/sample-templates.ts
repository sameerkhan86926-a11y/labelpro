import {
  createLabelElement,
  createLabelTemplate,
} from "./label-types";

import type {
  LabelTemplate,
} from "./label-types";

export const SAMPLE_TEMPLATE_PREFIX = "labelpro-sample-";

export function createSampleTemplates(): LabelTemplate[] {
  const retail = createLabelTemplate(
    `${SAMPLE_TEMPLATE_PREFIX}retail`,
    50,
    25,
  );

  retail.name = "Retail Price Label";
  retail.description =
    "Product name, selling price, MRP and barcode.";

  retail.elements = [
    createLabelElement("product_name", {
      x: 2,
      y: 2,
      width: 46,
      height: 5,
      fontSize: 10,
      fontWeight: 700,
      text: "{{product_name}}",
    }),
    createLabelElement("price", {
      x: 2,
      y: 8,
      width: 23,
      height: 5,
      fontSize: 11,
      fontWeight: 700,
      color: "#166534",
      text: "{{price}}",
    }),
    createLabelElement("mrp", {
      x: 26,
      y: 8,
      width: 22,
      height: 5,
      fontSize: 8,
      text: "MRP: {{mrp}}",
    }),
    createLabelElement("barcode", {
      x: 5,
      y: 14,
      width: 40,
      height: 9,
      barcodeFormat: "CODE128",
      text: "{{sku}}",
    }),
  ];

  const barcode = createLabelTemplate(
    `${SAMPLE_TEMPLATE_PREFIX}barcode`,
    50,
    25,
  );

  barcode.name = "Product Barcode Label";
  barcode.description =
    "Product name, SKU and scannable barcode.";

  barcode.elements = [
    createLabelElement("heading", {
      x: 2,
      y: 2,
      width: 46,
      height: 5,
      fontSize: 10,
      fontWeight: 700,
      text: "{{product_name}}",
    }),
    createLabelElement("sku", {
      x: 2,
      y: 8,
      width: 46,
      height: 4,
      fontSize: 8,
      text: "SKU: {{sku}}",
    }),
    createLabelElement("barcode", {
      x: 4,
      y: 13,
      width: 42,
      height: 10,
      barcodeFormat: "CODE128",
      text: "{{sku}}",
    }),
  ];

  const perfume = createLabelTemplate(
    `${SAMPLE_TEMPLATE_PREFIX}perfume`,
    50,
    25,
  );

  perfume.name = "Perfume Label";
  perfume.description =
    "Perfume product name, quantity and batch details.";

  perfume.elements = [
    createLabelElement("heading", {
      x: 2,
      y: 2,
      width: 46,
      height: 5,
      fontSize: 10,
      fontWeight: 700,
      text: "{{manufacturer}}",
      textAlign: "center",
    }),
    createLabelElement("product_name", {
      x: 2,
      y: 8,
      width: 46,
      height: 5,
      fontSize: 9,
      fontWeight: 600,
      text: "{{product_name}}",
      textAlign: "center",
    }),
    createLabelElement("text", {
      x: 2,
      y: 14,
      width: 46,
      height: 4,
      fontSize: 8,
      text: "Batch: {{batch}}",
    }),
    createLabelElement("text", {
      x: 2,
      y: 19,
      width: 46,
      height: 4,
      fontSize: 8,
      text: "MRP: {{mrp}}",
    }),
  ];

  return [retail, barcode, perfume];
}
