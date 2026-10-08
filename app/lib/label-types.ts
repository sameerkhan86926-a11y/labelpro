export type LabelElementType =
  | "text"
  | "heading"
  | "product_name"
  | "sku"
  | "barcode"
  | "qr"
  | "price"
  | "mrp"
  | "batch"
  | "expiry"
  | "manufacturing_date"
  | "image"
  | "logo"
  | "line"
  | "rectangle"
  | "circle"
  | "custom";

export type LabelElement = {
  id: string;
  type: LabelElementType;

  x: number;
  y: number;
  width: number;
  height: number;

  rotation: number;

  text?: string;
  field?: string;

  fontSize?: number;
  fontWeight?: number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";

  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;

  opacity?: number;

  locked?: boolean;
  hidden?: boolean;

  imageUrl?: string;

  barcodeFormat?: string;
  qrValue?: string;
};

export type LabelSize = {
  width: number;
  height: number;
  unit: "mm";
};

export type LabelTemplate = {
  id: string;
  name: string;
  description: string;

  size: LabelSize;

  backgroundColor: string;

  elements: LabelElement[];

  createdAt: string;
  updatedAt: string;
};

export const DEFAULT_LABEL_SIZES: {
  name: string;
  width: number;
  height: number;
}[] = [
  {
    name: "40 × 20 mm",
    width: 40,
    height: 20,
  },
  {
    name: "50 × 25 mm",
    width: 50,
    height: 25,
  },
  {
    name: "60 × 30 mm",
    width: 60,
    height: 30,
  },
  {
    name: "70 × 40 mm",
    width: 70,
    height: 40,
  },
  {
    name: "100 × 50 mm",
    width: 100,
    height: 50,
  },
  {
    name: "100 × 150 mm",
    width: 100,
    height: 150,
  },
];

export const LABEL_ELEMENT_LABELS: Record<LabelElementType, string> = {
  text: "Text",
  heading: "Heading",
  product_name: "Product Name",
  sku: "SKU",
  barcode: "Barcode",
  qr: "QR Code",
  price: "Selling Price",
  mrp: "MRP",
  batch: "Batch Number",
  expiry: "Expiry Date",
  manufacturing_date: "Manufacturing Date",
  image: "Image",
  logo: "Logo",
  line: "Line",
  rectangle: "Rectangle",
  circle: "Circle",
  custom: "Custom Field",
};

export function createLabelElement(
  type: LabelElementType,
  overrides: Partial<LabelElement> = {},
): LabelElement {
  return {
    id: crypto.randomUUID(),
    type,

    x: 10,
    y: 10,
    width: 80,
    height: 20,

    rotation: 0,

    fontSize: 12,
    fontWeight: 500,
    fontFamily: "Arial",
    textAlign: "left",

    color: "#111827",
    backgroundColor: "transparent",
    borderColor: "#111827",
    borderWidth: 1,

    opacity: 1,

    locked: false,
    hidden: false,

    ...overrides,
  };
}

export function createLabelTemplate(
  name = "Untitled Label",
  width = 50,
  height = 25,
): LabelTemplate {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),

    name,

    description: "Custom LabelPro label template",

    size: {
      width,
      height,
      unit: "mm",
    },

    backgroundColor: "#ffffff",

    elements: [],

    createdAt: now,
    updatedAt: now,
  };
}
