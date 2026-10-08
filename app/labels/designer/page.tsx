"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  calculateDragPosition,
  calculateResize,
  type DragStart,
  type ResizeStart,
} from "../../lib/label-editor";

import {
  createLabelElement,
  createLabelTemplate,
  DEFAULT_LABEL_SIZES,
  LABEL_ELEMENT_LABELS,
  type LabelElement,
  type LabelElementType,
  type LabelTemplate,
} from "../../lib/label-types";

import {
  DYNAMIC_FIELDS,
  getElementDisplayText,
  renderBarcode,
  renderQRCode,
} from "../../lib/label-render";

import {
  getProducts,
  type StoredProduct,
} from "../../lib/storage";

const CANVAS_SCALE = 3;

const TOOL_ELEMENTS: LabelElementType[] = [
  "text",
  "heading",
  "product_name",
  "sku",
  "barcode",
  "qr",
  "price",
  "mrp",
  "batch",
  "expiry",
  "manufacturing_date",
  "image",
  "logo",
  "line",
  "rectangle",
  "circle",
  "custom",
];

const ELEMENT_DEFAULTS: Record<
  LabelElementType,
  Partial<LabelElement>
> = {
  text: {
    width: 60,
    height: 10,
    fontSize: 12,
    fontWeight: 400,
  },

  heading: {
    width: 80,
    height: 12,
    fontSize: 18,
    fontWeight: 700,
  },

  product_name: {
    width: 80,
    height: 12,
    fontSize: 14,
    fontWeight: 600,
  },

  sku: {
    width: 50,
    height: 10,
    fontSize: 10,
    fontWeight: 500,
  },

  barcode: {
    width: 70,
    height: 25,
  },

  qr: {
    width: 25,
    height: 25,
  },

  price: {
    width: 40,
    height: 10,
    fontSize: 14,
    fontWeight: 700,
  },

  mrp: {
    width: 40,
    height: 10,
    fontSize: 11,
    fontWeight: 500,
  },

  batch: {
    width: 50,
    height: 10,
    fontSize: 10,
  },

  expiry: {
    width: 50,
    height: 10,
    fontSize: 10,
  },

  manufacturing_date: {
    width: 60,
    height: 10,
    fontSize: 10,
  },

  image: {
    width: 30,
    height: 30,
  },

  logo: {
    width: 30,
    height: 20,
  },

  line: {
    width: 70,
    height: 2,
  },

  rectangle: {
    width: 50,
    height: 25,
  },

  circle: {
    width: 25,
    height: 25,
  },

  custom: {
    width: 60,
    height: 10,
    fontSize: 11,
  },
};

function getDefaultText(type: LabelElementType): string {
  switch (type) {
    case "text":
      return "Sample Text";

    case "heading":
      return "Heading";

    case "custom":
      return "Custom Field";

    default:
      return "";
  }
}

function getCanvasElementStyle(
  element: LabelElement,
) {
  return {
    position: "absolute" as const,
    left: `${element.x * CANVAS_SCALE}px`,
    top: `${element.y * CANVAS_SCALE}px`,
    width: `${element.width * CANVAS_SCALE}px`,
    height: `${element.height * CANVAS_SCALE}px`,
    transform: `rotate(${element.rotation}deg)`,
    opacity: element.opacity ?? 1,
    zIndex: element.type === "line" ? 2 : 3,
    overflow: "hidden" as const,
  };
}

function BarcodeElement({
  value,
  format,
}: {
  value: string;
  format: string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;

    if (!svg) return;

    renderBarcode(svg, value, format);
  }, [value, format]);

  return (
    <svg
      ref={svgRef}
      className="designer-barcode-svg"
      aria-label="Barcode"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
      }}
    />
  );
}

function QRElement({
  value,
}: {
  value: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    void renderQRCode(canvas, value);
  }, [value]);

  return (
    <canvas
      ref={canvasRef}
      className="designer-qr-canvas"
      aria-label="QR code"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "contain",
      }}
    />
  );
}

export default function LabelDesignerPage() {
  const [template, setTemplate] =
    useState<LabelTemplate>(() =>
      createLabelTemplate(
        "New Product Label",
        50,
        25,
      ),
    );

  const [selectedElementId, setSelectedElementId] =
    useState<string | null>(null);

  const [products, setProducts] =
    useState<StoredProduct[]>([]);

  const [selectedProductId, setSelectedProductId] =
    useState<string>("");

  const [savedMessage, setSavedMessage] =
    useState("");

  const dragRef = useRef<DragStart | null>(null);

  const resizeRef =
    useRef<ResizeStart | null>(null);

  const selectedProduct = useMemo(
    () =>
      products.find(
        (product) =>
          product.id === selectedProductId,
      ) ?? null,
    [products, selectedProductId],
  );

  const selectedElement = useMemo(
    () =>
      template.elements.find(
        (element) =>
          element.id === selectedElementId,
      ) ?? null,
    [
      template.elements,
      selectedElementId,
    ],
  );

  function loadProducts() {
    setProducts(getProducts());
  }

  function updateTemplate(
    updates: Partial<LabelTemplate>,
  ) {
    setTemplate((current) => ({
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  }

  function addElement(
    type: LabelElementType,
  ) {
    const defaults =
      ELEMENT_DEFAULTS[type] ?? {};

    const element = createLabelElement(
      type,
      {
        ...defaults,
        text: getDefaultText(type),
        x: 5,
        y: 5,
      },
    );

    setTemplate((current) => ({
      ...current,
      elements: [
        ...current.elements,
        element,
      ],
      updatedAt:
        new Date().toISOString(),
    }));

    setSelectedElementId(element.id);
  }

  function deleteElement(id: string) {
    setTemplate((current) => ({
      ...current,
      elements:
        current.elements.filter(
          (element) =>
            element.id !== id,
        ),
      updatedAt:
        new Date().toISOString(),
    }));

    if (selectedElementId === id) {
      setSelectedElementId(null);
    }
  }

  function duplicateElement(id: string) {
    const source =
      template.elements.find(
        (element) =>
          element.id === id,
      );

    if (!source) return;

    const {
      id: _id,
      ...sourceWithoutId
    } = source;

    const duplicate =
      createLabelElement(
        source.type,
        {
          ...sourceWithoutId,
          x: Math.min(
            source.x + 5,
            template.size.width -
              source.width,
          ),
          y: Math.min(
            source.y + 5,
            template.size.height -
              source.height,
          ),
        },
      );

    setTemplate((current) => ({
      ...current,
      elements: [
        ...current.elements,
        duplicate,
      ],
      updatedAt:
        new Date().toISOString(),
    }));

    setSelectedElementId(
      duplicate.id,
    );
  }

  function updateElement(
    id: string,
    updates: Partial<LabelElement>,
  ) {
    setTemplate((current) => ({
      ...current,
      elements:
        current.elements.map(
          (element) =>
            element.id === id
              ? {
                  ...element,
                  ...updates,
                }
              : element,
        ),
      updatedAt:
        new Date().toISOString(),
    }));
  }

  function handleElementPointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    element: LabelElement,
  ) {
    if (element.locked) return;

    event.preventDefault();
    event.stopPropagation();

    setSelectedElementId(element.id);

    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      elementX: element.x,
      elementY: element.y,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
  }

  function handleElementPointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
    element: LabelElement,
  ) {
    if (!dragRef.current) return;

    const position =
      calculateDragPosition(
        dragRef.current,
        event.clientX,
        event.clientY,
        CANVAS_SCALE,
        element,
        template.size.width,
        template.size.height,
      );

    updateElement(
      element.id,
      position,
    );
  }

  function handleElementPointerUp(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    dragRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    } catch {
      // Pointer capture may already be released.
    }
  }

  function handleResizePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    element: LabelElement,
  ) {
    if (element.locked) return;

    event.preventDefault();
    event.stopPropagation();

    setSelectedElementId(element.id);

    resizeRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      elementWidth: element.width,
      elementHeight: element.height,
    };

    event.currentTarget.setPointerCapture(
      event.pointerId,
    );
  }

  function handleResizePointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
    element: LabelElement,
  ) {
    if (!resizeRef.current) return;

    const size =
      calculateResize(
        resizeRef.current,
        event.clientX,
        event.clientY,
        CANVAS_SCALE,
        element,
        template.size.width,
        template.size.height,
      );

    updateElement(
      element.id,
      size,
    );
  }

  function handleResizePointerUp(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    resizeRef.current = null;

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    } catch {
      // Pointer capture may already be released.
    }
  }

  function insertDynamicField(
    value: string,
  ) {
    if (!selectedElement) return;

    const currentText =
      selectedElement.text ?? "";

    updateElement(
      selectedElement.id,
      {
        text:
          currentText +
          value,
      },
    );
  }

  function saveTemplate() {
    const key =
      "labelpro_label_templates";

    try {
      const existing =
        window.localStorage.getItem(
          key,
        );

      const templates: LabelTemplate[] =
        existing
          ? JSON.parse(existing)
          : [];

      const filtered =
        templates.filter(
          (item) =>
            item.id !== template.id,
        );

      window.localStorage.setItem(
        key,
        JSON.stringify([
          ...filtered,
          template,
        ]),
      );

      setSavedMessage(
        "Template saved successfully.",
      );

      window.setTimeout(() => {
        setSavedMessage("");
      }, 2500);
    } catch {
      setSavedMessage(
        "Unable to save template.",
      );
    }
  }

  function createNewTemplate() {
    const newTemplate =
      createLabelTemplate(
        "New Product Label",
        template.size.width,
        template.size.height,
      );

    setTemplate(newTemplate);
    setSelectedElementId(null);
    setSavedMessage("");
  }

  function changeLabelSize(
    value: string,
  ) {
    const selected =
      DEFAULT_LABEL_SIZES.find(
        (size) =>
          `${size.width}x${size.height}` ===
          value,
      );

    if (!selected) return;

    updateTemplate({
      size: {
        width: selected.width,
        height: selected.height,
        unit: "mm",
      },
    });
  }

  function renderElementContent(
    element: LabelElement,
  ) {
    if (element.type === "barcode") {
      return (
        <BarcodeElement
          value={
            selectedProduct?.barcode ||
            element.text ||
            ""
          }
          format={
            element.barcodeFormat ||
            "CODE128"
          }
        />
      );
    }

    if (element.type === "qr") {
      const qrValue =
        element.qrValue ||
        selectedProduct?.barcode ||
        selectedProduct?.sku ||
        selectedProduct?.name ||
        "";

      return (
        <QRElement
          value={qrValue}
        />
      );
    }

    if (
      element.type === "image" ||
      element.type === "logo"
    ) {
      if (element.imageUrl) {
        return (
          <img
            src={element.imageUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        );
      }

      return (
        <div className="designer-image-placeholder">
          {element.type === "logo"
            ? "LOGO"
            : "IMAGE"}
        </div>
      );
    }

    if (element.type === "line") {
      return null;
    }

    if (
      element.type === "rectangle" ||
      element.type === "circle"
    ) {
      return null;
    }

    return getElementDisplayText(
      element,
      selectedProduct,
    );
  }

  function getElementClassName(
    element: LabelElement,
  ) {
    const classes = [
      "label-element",
    ];

    if (
      element.id ===
      selectedElementId
    ) {
      classes.push(
        "label-element-selected",
      );
    }

    if (element.locked) {
      classes.push(
        "label-element-locked",
      );
    }

    if (element.type === "line") {
      classes.push(
        "label-element-line",
      );
    }

    if (
      element.type === "rectangle"
    ) {
      classes.push(
        "label-element-rectangle",
      );
    }

    if (
      element.type === "circle"
    ) {
      classes.push(
        "label-element-circle",
      );
    }

    return classes.join(" ");
  }

  const canvasWidth =
    template.size.width *
    CANVAS_SCALE;

  const canvasHeight =
    template.size.height *
    CANVAS_SCALE;

  return (
    <main className="designer-page">
      <div className="designer-header">
        <div>
          <div className="designer-breadcrumb">
            LabelPro / Labels / Designer
          </div>

          <h1 className="designer-title">
            Label Designer
          </h1>

          <p className="designer-subtitle">
            Design professional
            product labels with
            dynamic fields, barcodes
            and QR codes.
          </p>
        </div>

        <div className="designer-header-actions">
          <button
            type="button"
            className="designer-secondary-button"
            onClick={createNewTemplate}
          >
            New
          </button>

          <button
            type="button"
            className="designer-primary-button"
            onClick={saveTemplate}
          >
            Save Template
          </button>
        </div>
      </div>

      {savedMessage && (
        <div className="designer-save-message">
          {savedMessage}
        </div>
      )}

      <div className="designer-toolbar">
        <div className="designer-toolbar-group">
          <label
            className="designer-field-label"
            htmlFor="template-name"
          >
            Template Name
          </label>

          <input
            id="template-name"
            className="designer-input"
            value={template.name}
            onChange={(event) =>
              updateTemplate({
                name:
                  event.target.value,
              })
            }
          />
        </div>

        <div className="designer-toolbar-group">
          <label
            className="designer-field-label"
            htmlFor="label-size"
          >
            Label Size
          </label>

          <select
            id="label-size"
            className="designer-select"
            value={`${template.size.width}x${template.size.height}`}
            onChange={(event) =>
              changeLabelSize(
                event.target.value,
              )
            }
          >
            {DEFAULT_LABEL_SIZES.map(
              (size) => (
                <option
                  key={`${size.width}x${size.height}`}
                  value={`${size.width}x${size.height}`}
                >
                  {size.name}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="designer-toolbar-group">
          <label
            className="designer-field-label"
            htmlFor="preview-product"
          >
            Preview Product
          </label>

          <select
            id="preview-product"
            className="designer-select"
            value={selectedProductId}
            onFocus={loadProducts}
            onChange={(event) =>
              setSelectedProductId(
                event.target.value,
              )
            }
          >
            <option value="">
              No Product Selected
            </option>

            {products.map(
              (product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.name}
                  {product.sku
                    ? ` — ${product.sku}`
                    : ""}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="designer-toolbar-status">
          <span className="designer-status-dot" />
          Local Workspace
        </div>
      </div>

      <div className="designer-workspace">
        <aside className="designer-panel designer-elements-panel">
          <div className="designer-panel-header">
            <div>
              <h2>Elements</h2>
              <p>
                Add elements to your
                label
              </p>
            </div>
          </div>

          <div className="designer-tool-grid">
            {TOOL_ELEMENTS.map(
              (type) => (
                <button
                  type="button"
                  key={type}
                  className="designer-tool-button"
                  onClick={() =>
                    addElement(type)
                  }
                >
                  <span className="designer-tool-name">
                    {
                      LABEL_ELEMENT_LABELS[
                        type
                      ]
                    }
                  </span>

                  <span className="designer-tool-plus">
                    +
                  </span>
                </button>
              ),
            )}
          </div>

          <div className="designer-panel-section">
            <div className="designer-section-title">
              Dynamic Fields
            </div>

            <p className="designer-section-description">
              Insert product data
              automatically.
            </p>

            <div className="designer-dynamic-fields">
              {DYNAMIC_FIELDS.map(
                (field) => (
                  <button
                    type="button"
                    key={field.value}
                    className="designer-dynamic-field"
                    disabled={
                      !selectedElement
                    }
                    onClick={() =>
                      insertDynamicField(
                        field.value,
                      )
                    }
                  >
                    <span>
                      {field.label}
                    </span>

                    <small>
                      {field.value}
                    </small>
                  </button>
                ),
              )}
            </div>
          </div>
        </aside>

        <section className="designer-canvas-panel">
          <div className="designer-canvas-header">
            <div>
              <h2>Canvas</h2>
              <span>
                {template.size.width} ×{" "}
                {template.size.height} mm
              </span>
            </div>

            {selectedProduct && (
              <div className="designer-preview-product">
                Preview:{" "}
                <strong>
                  {selectedProduct.name}
                </strong>
              </div>
            )}
          </div>

          <div className="designer-canvas-wrapper">
            <div
              className="designer-canvas"
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                backgroundColor:
                  template.backgroundColor,
              }}
              onPointerDown={() =>
                setSelectedElementId(null)
              }
            >
              {template.elements.map(
                (element) => (
                  <div
                    key={element.id}
                    className={getElementClassName(
                      element,
                    )}
                    style={{
                      ...getCanvasElementStyle(
                        element,
                      ),
                      backgroundColor:
                        element.type ===
                          "rectangle" ||
                        element.type ===
                          "circle"
                          ? element
                              .backgroundColor ||
                            "transparent"
                          : element
                              .backgroundColor ||
                            "transparent",
                      border:
                        element.type ===
                          "rectangle" ||
                        element.type ===
                          "circle"
                          ? `${element.borderWidth ?? 1}px solid ${
                              element.borderColor ??
                              "#111827"
                            }`
                          : element.type ===
                            "line"
                          ? "none"
                          : `${element.borderWidth ?? 0}px solid ${
                              element.borderColor ??
                              "transparent"
                            }`,
                      borderRadius:
                        element.type ===
                        "circle"
                          ? "50%"
                          : "0",
                      color:
                        element.color ??
                        "#111827",
                      fontSize: `${
                        (element.fontSize ??
                          12) *
                        CANVAS_SCALE
                      }px`,
                      fontWeight:
                        element.fontWeight ??
                        500,
                      fontFamily:
                        element.fontFamily ??
                        "Arial",
                      textAlign:
                        element.textAlign ??
                        "left",
                      justifyContent:
                        element.textAlign ===
                        "center"
                          ? "center"
                          : element.textAlign ===
                            "right"
                          ? "flex-end"
                          : "flex-start",
                      display:
                        element.type ===
                          "rectangle" ||
                        element.type ===
                          "circle"
                          ? "block"
                          : "flex",
                      alignItems:
                        element.type ===
                          "rectangle" ||
                        element.type ===
                          "circle"
                          ? undefined
                          : "center",
                      pointerEvents:
                        element.hidden
                          ? "none"
                          : "auto",
                    }}
                    onPointerDown={(
                      event,
                    ) =>
                      handleElementPointerDown(
                        event,
                        element,
                      )
                    }
                    onPointerMove={(
                      event,
                    ) =>
                      handleElementPointerMove(
                        event,
                        element,
                      )
                    }
                    onPointerUp={(
                      event,
                    ) =>
                      handleElementPointerUp(
                        event,
                      )
                    }
                  >
                    {!element.hidden &&
                      renderElementContent(
                        element,
                      )}

                    {element.id ===
                      selectedElementId &&
                      !element.locked && (
                        <div
                          className="label-resize-handle"
                          onPointerDown={(
                            event,
                          ) =>
                            handleResizePointerDown(
                              event,
                              element,
                            )
                          }
                          onPointerMove={(
                            event,
                          ) =>
                            handleResizePointerMove(
                              event,
                              element,
                            )
                          }
                          onPointerUp={(
                            event,
                          ) =>
                            handleResizePointerUp(
                              event,
                            )
                          }
                        />
                      )}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="designer-canvas-footer">
            <span>
              Drag elements to
              reposition
            </span>

            <span>
              Select an element to
              edit properties
            </span>
          </div>
        </section>

        <aside className="designer-panel designer-properties-panel">
          <div className="designer-panel-header">
            <div>
              <h2>Properties</h2>
              <p>
                Configure selected
                element
              </p>
            </div>
          </div>

          {!selectedElement && (
            <div className="designer-empty-properties">
              <div className="designer-empty-icon">
                —
              </div>

              <h3>
                No element selected
              </h3>

              <p>
                Select an element on
                the canvas to edit
                its properties.
              </p>
            </div>
          )}

          {selectedElement && (
            <div className="designer-properties">
              <div className="designer-property-title">
                {
                  LABEL_ELEMENT_LABELS[
                    selectedElement.type
                  ]
                }
              </div>

              <div className="designer-property-grid">
                <div className="designer-property">
                  <label>
                    X
                  </label>

                  <input
                    type="number"
                    value={selectedElement.x}
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          x: Number(
                            event.target.value,
                          ),
                        },
                      )
                    }
                  />
                </div>

                <div className="designer-property">
                  <label>
                    Y
                  </label>

                  <input
                    type="number"
                    value={selectedElement.y}
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          y: Number(
                            event.target.value,
                          ),
                        },
                      )
                    }
                  />
                </div>

                <div className="designer-property">
                  <label>
                    Width
                  </label>

                  <input
                    type="number"
                    min="5"
                    value={
                      selectedElement.width
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          width: Number(
                            event.target.value,
                          ),
                        },
                      )
                    }
                  />
                </div>

                <div className="designer-property">
                  <label>
                    Height
                  </label>

                  <input
                    type="number"
                    min="5"
                    value={
                      selectedElement.height
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          height: Number(
                            event.target.value,
                          ),
                        },
                      )
                    }
                  />
                </div>
              </div>

              {[
                "text",
                "heading",
                "product_name",
                "sku",
                "price",
                "mrp",
                "batch",
                "expiry",
                "manufacturing_date",
                "custom",
              ].includes(
                selectedElement.type,
              ) && (
                <div className="designer-property">
                  <label htmlFor="element-text">
                    Text
                  </label>

                  <textarea
                    id="element-text"
                    rows={4}
                    value={
                      selectedElement.text ??
                      ""
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          text:
                            event.target
                              .value,
                        },
                      )
                    }
                  />
                </div>
              )}

              {selectedElement.type ===
                "barcode" && (
                <div className="designer-property">
                  <label htmlFor="barcode-format">
                    Barcode Format
                  </label>

                  <select
                    id="barcode-format"
                    value={
                      selectedElement.barcodeFormat ??
                      "CODE128"
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          barcodeFormat:
                            event.target
                              .value,
                        },
                      )
                    }
                  >
                    <option value="CODE128">
                      CODE 128
                    </option>

                    <option value="CODE39">
                      CODE 39
                    </option>

                    <option value="EAN13">
                      EAN-13
                    </option>

                    <option value="EAN8">
                      EAN-8
                    </option>

                    <option value="UPC">
                      UPC-A
                    </option>

                    <option value="ITF14">
                      ITF-14
                    </option>
                  </select>
                </div>
              )}

              {selectedElement.type ===
                "qr" && (
                <div className="designer-property">
                  <label htmlFor="qr-value">
                    QR Value
                  </label>

                  <textarea
                    id="qr-value"
                    rows={4}
                    placeholder="Leave empty to use selected product data"
                    value={
                      selectedElement.qrValue ??
                      ""
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          qrValue:
                            event.target
                              .value,
                        },
                      )
                    }
                  />
                </div>
              )}

              {[
                "text",
                "heading",
                "product_name",
                "sku",
                "price",
                "mrp",
                "batch",
                "expiry",
                "manufacturing_date",
                "custom",
              ].includes(
                selectedElement.type,
              ) && (
                <>
                  <div className="designer-property-grid">
                    <div className="designer-property">
                      <label>
                        Font Size
                      </label>

                      <input
                        type="number"
                        min="6"
                        max="100"
                        value={
                          selectedElement.fontSize ??
                          12
                        }
                        onChange={(
                          event,
                        ) =>
                          updateElement(
                            selectedElement.id,
                            {
                              fontSize:
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                            },
                          )
                        }
                      />
                    </div>

                    <div className="designer-property">
                      <label>
                        Weight
                      </label>

                      <select
                        value={
                          selectedElement.fontWeight ??
                          500
                        }
                        onChange={(
                          event,
                        ) =>
                          updateElement(
                            selectedElement.id,
                            {
                              fontWeight:
                                Number(
                                  event
                                    .target
                                    .value,
                                ),
                            },
                          )
                        }
                      >
                        <option value="400">
                          Normal
                        </option>

                        <option value="500">
                          Medium
                        </option>

                        <option value="600">
                          Semi Bold
                        </option>

                        <option value="700">
                          Bold
                        </option>

                        <option value="800">
                          Extra Bold
                        </option>
                      </select>
                    </div>
                  </div>

                  <div className="designer-property">
                    <label>
                      Alignment
                    </label>

                    <select
                      value={
                        selectedElement.textAlign ??
                        "left"
                      }
                      onChange={(event) =>
                        updateElement(
                          selectedElement.id,
                          {
                            textAlign:
                              event.target
                                .value as
                                | "left"
                                | "center"
                                | "right",
                          },
                        )
                      }
                    >
                      <option value="left">
                        Left
                      </option>

                      <option value="center">
                        Center
                      </option>

                      <option value="right">
                        Right
                      </option>
                    </select>
                  </div>
                </>
              )}

              {[
                "text",
                "heading",
                "product_name",
                "sku",
                "price",
                "mrp",
                "batch",
                "expiry",
                "manufacturing_date",
                "custom",
              ].includes(
                selectedElement.type,
              ) && (
                <div className="designer-property-grid">
                  <div className="designer-property">
                    <label>
                      Text Color
                    </label>

                    <input
                      type="color"
                      value={
                        selectedElement.color ??
                        "#111827"
                      }
                      onChange={(event) =>
                        updateElement(
                          selectedElement.id,
                          {
                            color:
                              event.target
                                .value,
                          },
                        )
                      }
                    />
                  </div>

                  <div className="designer-property">
                    <label>
                      Background
                    </label>

                    <input
                      type="color"
                      value={
                        selectedElement.backgroundColor ===
                        "transparent"
                          ? "#ffffff"
                          : selectedElement.backgroundColor ??
                            "#ffffff"
                      }
                      onChange={(event) =>
                        updateElement(
                          selectedElement.id,
                          {
                            backgroundColor:
                              event.target
                                .value,
                          },
                        )
                      }
                    />
                  </div>
                </div>
              )}

              <div className="designer-property">
                <label>
                  Rotation
                </label>

                <input
                  type="number"
                  min="-360"
                  max="360"
                  value={
                    selectedElement.rotation
                  }
                  onChange={(event) =>
                    updateElement(
                      selectedElement.id,
                      {
                        rotation:
                          Number(
                            event.target
                              .value,
                          ),
                      },
                    )
                  }
                />
              </div>

              <div className="designer-property">
                <label>
                  Opacity
                </label>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={
                    selectedElement.opacity ??
                    1
                  }
                  onChange={(event) =>
                    updateElement(
                      selectedElement.id,
                      {
                        opacity:
                          Number(
                            event.target
                              .value,
                          ),
                      },
                    )
                  }
                />
              </div>

              <div className="designer-property-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      selectedElement.locked ??
                      false
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          locked:
                            event.target
                              .checked,
                        },
                      )
                    }
                  />

                  <span>
                    Lock element
                  </span>
                </label>
              </div>

              <div className="designer-property-toggle">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      selectedElement.hidden ??
                      false
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          hidden:
                            event.target
                              .checked,
                        },
                      )
                    }
                  />

                  <span>
                    Hide element
                  </span>
                </label>
              </div>

              <div className="designer-element-actions">
                <button
                  type="button"
                  className="designer-secondary-button"
                  onClick={() =>
                    duplicateElement(
                      selectedElement.id,
                    )
                  }
                >
                  Duplicate
                </button>

                <button
                  type="button"
                  className="designer-danger-button"
                  onClick={() =>
                    deleteElement(
                      selectedElement.id,
                    )
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
