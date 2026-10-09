import type { StoredProduct } from "./storage";

export type ProductImportRow = Omit<
  StoredProduct,
  "id" | "createdAt" | "updatedAt" | "archived"
>;

export type ProductImportError = {
  row: number;
  field: string;
  message: string;
  value: string;
};

export type ProductImportPreviewRow = {
  row: number;
  product: ProductImportRow;
  errors: ProductImportError[];
  valid: boolean;
};

export type ProductImportResult = {
  rows: ProductImportPreviewRow[];
  validCount: number;
  errorCount: number;
  totalRows: number;
};

export type CsvColumn = {
  key: keyof ProductImportRow;
  label: string;
};

export const PRODUCT_CSV_COLUMNS: CsvColumn[] = [
  { key: "name", label: "Product Name" },
  { key: "sku", label: "SKU" },
  { key: "barcode", label: "Barcode" },
  { key: "category", label: "Category" },
  { key: "description", label: "Description" },
  { key: "mrp", label: "MRP" },
  { key: "price", label: "Selling Price" },
  { key: "costPrice", label: "Cost Price" },
  { key: "stock", label: "Stock" },
  { key: "minimumStock", label: "Minimum Stock" },
  { key: "batchNumber", label: "Batch Number" },
  { key: "manufacturingDate", label: "Manufacturing Date" },
  { key: "expiryDate", label: "Expiry Date" },
  { key: "supplier", label: "Supplier" },
  { key: "manufacturer", label: "Manufacturer" },
  { key: "weight", label: "Weight" },
  { key: "unit", label: "Unit" },
  { key: "countryOfOrigin", label: "Country of Origin" },
  { key: "productImage", label: "Product Image" },
];

const HEADER_ALIASES: Record<string, keyof ProductImportRow> = {
  name: "name",
  productname: "name",
  sku: "sku",
  productsku: "sku",
  barcode: "barcode",
  barcodenumber: "barcode",
  category: "category",
  description: "description",
  mrp: "mrp",
  maximumretailprice: "mrp",
  price: "price",
  sellingprice: "price",
  costprice: "costPrice",
  purchaseprice: "costPrice",
  stock: "stock",
  quantity: "stock",
  minimumstock: "minimumStock",
  reorderlevel: "minimumStock",
  batch: "batchNumber",
  batchnumber: "batchNumber",
  manufacturingdate: "manufacturingDate",
  mfgdate: "manufacturingDate",
  expirydate: "expiryDate",
  supplier: "supplier",
  manufacturer: "manufacturer",
  weight: "weight",
  unit: "unit",
  country: "countryOfOrigin",
  countryoforigin: "countryOfOrigin",
  productimage: "productImage",
  image: "productImage",
};

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeCell(value: string | undefined): string {
  return (value ?? "").trim();
}

export function parseCsv(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];

  let row: string[] = [];
  let field = "";
  let insideQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const character = input[i];

    if (insideQuotes) {
      if (character === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          insideQuotes = false;
        }
      } else {
        field += character;
      }

      continue;
    }

    if (character === '"' && field.length === 0) {
      insideQuotes = true;
      continue;
    }

    if (character === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (character === "\n" || character === "\r") {
      if (character === "\r" && input[i + 1] === "\n") {
        i += 1;
      }

      row.push(field);

      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }

      row = [];
      field = "";
      continue;
    }

    field += character;
  }

  if (insideQuotes) {
    throw new Error(
      "CSV contains an unclosed quoted field. Check the quotation marks.",
    );
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);

    if (row.some((value) => value.trim() !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function emptyProduct(): ProductImportRow {
  return {
    name: "",
    sku: "",
    barcode: "",
    category: "",
    description: "",
    mrp: "",
    price: "",
    costPrice: "",
    stock: "",
    minimumStock: "",
    batchNumber: "",
    manufacturingDate: "",
    expiryDate: "",
    supplier: "",
    manufacturer: "",
    weight: "",
    unit: "",
    countryOfOrigin: "",
    productImage: "",
  };
}

function validateNonNegativeNumber(
  value: string,
  field: string,
  row: number,
  errors: ProductImportError[],
): void {
  if (value === "") {
    return;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number < 0) {
    errors.push({
      row,
      field,
      message: `${field} must be a valid non-negative number.`,
      value,
    });
  }
}

function isValidDate(value: string): boolean {
  if (!value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}

function validateProduct(
  product: ProductImportRow,
  row: number,
): ProductImportError[] {
  const errors: ProductImportError[] = [];

  if (!product.name) {
    errors.push({
      row,
      field: "name",
      message: "Product Name is required.",
      value: product.name,
    });
  }

  if (!product.sku) {
    errors.push({
      row,
      field: "sku",
      message: "SKU is required.",
      value: product.sku,
    });
  }

  validateNonNegativeNumber(product.mrp, "MRP", row, errors);
  validateNonNegativeNumber(product.price, "Selling Price", row, errors);
  validateNonNegativeNumber(product.costPrice, "Cost Price", row, errors);
  validateNonNegativeNumber(product.stock, "Stock", row, errors);
  validateNonNegativeNumber(
    product.minimumStock,
    "Minimum Stock",
    row,
    errors,
  );
  validateNonNegativeNumber(product.weight, "Weight", row, errors);

  if (!isValidDate(product.manufacturingDate)) {
    errors.push({
      row,
      field: "manufacturingDate",
      message: "Manufacturing Date must use YYYY-MM-DD format.",
      value: product.manufacturingDate,
    });
  }

  if (!isValidDate(product.expiryDate)) {
    errors.push({
      row,
      field: "expiryDate",
      message: "Expiry Date must use YYYY-MM-DD format.",
      value: product.expiryDate,
    });
  }

  if (
    product.manufacturingDate &&
    product.expiryDate &&
    isValidDate(product.manufacturingDate) &&
    isValidDate(product.expiryDate) &&
    product.expiryDate < product.manufacturingDate
  ) {
    errors.push({
      row,
      field: "expiryDate",
      message: "Expiry Date cannot be earlier than Manufacturing Date.",
      value: product.expiryDate,
    });
  }

  return errors;
}

export function previewProductCsv(
  csvText: string,
  existingProducts: StoredProduct[] = [],
): ProductImportResult {
  const parsedRows = parseCsv(csvText);

  if (parsedRows.length === 0) {
    throw new Error("The CSV file is empty.");
  }

  const headers = parsedRows[0].map(normalizeHeader);

  const mappedHeaders = headers.map(
    (header) => HEADER_ALIASES[header] ?? null,
  );

  if (!mappedHeaders.includes("name")) {
    throw new Error(
      "Missing Product Name column. Download the LabelPro CSV template and use its headers.",
    );
  }

  if (!mappedHeaders.includes("sku")) {
    throw new Error(
      "Missing SKU column. SKU is required for product imports.",
    );
  }

  const seenHeaders = new Set<string>();
  const duplicateHeaders = new Set<string>();

  for (const header of mappedHeaders) {
    if (!header) {
      continue;
    }

    if (seenHeaders.has(header)) {
      duplicateHeaders.add(header);
    }

    seenHeaders.add(header);
  }

  if (duplicateHeaders.size > 0) {
    throw new Error(
      `Duplicate CSV columns found: ${Array.from(duplicateHeaders).join(", ")}.`,
    );
  }

  const activeProducts = existingProducts.filter(
    (product) => !product.archived,
  );

  const existingSkus = new Set(
    activeProducts
      .map((product) => normalizeIdentifier(product.sku))
      .filter(Boolean),
  );

  const existingBarcodes = new Set(
    activeProducts
      .map((product) => normalizeIdentifier(product.barcode))
      .filter(Boolean),
  );

  const seenSkus = new Set<string>();
  const seenBarcodes = new Set<string>();

  const rows: ProductImportPreviewRow[] = [];

  for (let index = 1; index < parsedRows.length; index += 1) {
    const csvRow = parsedRows[index];
    const product = emptyProduct();

    for (
      let columnIndex = 0;
      columnIndex < mappedHeaders.length;
      columnIndex += 1
    ) {
      const key = mappedHeaders[columnIndex];

      if (!key) {
        continue;
      }

      product[key] = normalizeCell(csvRow[columnIndex]);
    }

    const rowNumber = index + 1;
    const errors = validateProduct(product, rowNumber);

    const sku = normalizeIdentifier(product.sku);
    const barcode = normalizeIdentifier(product.barcode);

    if (sku && existingSkus.has(sku)) {
      errors.push({
        row: rowNumber,
        field: "sku",
        message: "This SKU already exists in your products.",
        value: product.sku,
      });
    } else if (sku && seenSkus.has(sku)) {
      errors.push({
        row: rowNumber,
        field: "sku",
        message: "This SKU is duplicated within the CSV file.",
        value: product.sku,
      });
    }

    if (barcode && existingBarcodes.has(barcode)) {
      errors.push({
        row: rowNumber,
        field: "barcode",
        message: "This barcode already exists in your products.",
        value: product.barcode,
      });
    } else if (barcode && seenBarcodes.has(barcode)) {
      errors.push({
        row: rowNumber,
        field: "barcode",
        message: "This barcode is duplicated within the CSV file.",
        value: product.barcode,
      });
    }

    if (sku) {
      seenSkus.add(sku);
    }

    if (barcode) {
      seenBarcodes.add(barcode);
    }

    rows.push({
      row: rowNumber,
      product,
      errors,
      valid: errors.length === 0,
    });
  }

  const validCount = rows.filter((row) => row.valid).length;

  return {
    rows,
    validCount,
    errorCount: rows.length - validCount,
    totalRows: rows.length,
  };
}

export function getValidImportProducts(
  result: ProductImportResult,
): ProductImportRow[] {
  return result.rows
    .filter((row) => row.valid)
    .map((row) => ({ ...row.product }));
}

function escapeCsvValue(value: unknown): string {
  let text = String(value ?? "");

  // Protect spreadsheet applications from formula injection.
  if (/^[\s]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function createCsv(
  headers: string[],
  rows: string[][],
): string {
  const content = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\r\n");

  return `\uFEFF${content}`;
}

export function createProductCsvTemplate(): string {
  return createCsv(
    PRODUCT_CSV_COLUMNS.map((column) => column.key),
    [],
  );
}

export function exportProductsToCsv(
  products: StoredProduct[],
): string {
  const headers = PRODUCT_CSV_COLUMNS.map((column) => column.key);

  const rows = products.map((product) =>
    PRODUCT_CSV_COLUMNS.map(
      (column) => String(product[column.key] ?? ""),
    ),
  );

  return createCsv(headers, rows);
}

export function downloadCsv(
  filename: string,
  csvContent: string,
): void {
  if (typeof window === "undefined") {
    throw new Error("CSV downloads are available only in the browser.");
  }

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
