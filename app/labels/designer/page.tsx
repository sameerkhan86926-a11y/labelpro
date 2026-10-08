"use client";

import {
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

const ELEMENT_DEFAULTS: Partial<
  Record<LabelElementType, Partial<LabelElement>>
> = {
  heading: {
    width: 80,
    height: 12,
    fontSize: 16,
    fontWeight: 700,
    text: "Heading",
  },

  text: {
    width: 80,
    height: 10,
    fontSize: 11,
    text: "Text",
  },

  product_name: {
    width: 80,
    height: 12,
    fontSize: 14,
    fontWeight: 700,
    field: "{{product_name}}",
  },

  sku: {
    width: 55,
    height: 10,
    fontSize: 10,
    field: "{{sku}}",
  },

  barcode: {
    width: 75,
    height: 24,
  },

  qr: {
    width: 30,
    height: 30,
  },

  price: {
    width: 45,
    height: 12,
    fontSize: 14,
    fontWeight: 700,
    field: "{{price}}",
  },

  mrp: {
    width: 45,
    height: 10,
    fontSize: 10,
    field: "{{mrp}}",
  },

  batch: {
    width: 55,
    height: 10,
    fontSize: 10,
    field: "{{batch}}",
  },

  expiry: {
    width: 55,
    height: 10,
    fontSize: 10,
    field: "{{expiry}}",
  },

  manufacturing_date: {
    width: 55,
    height: 10,
    fontSize: 10,
    field: "{{manufacturing_date}}",
  },

  image: {
    width: 30,
    height: 30,
  },

  logo: {
    width: 35,
    height: 20,
  },

  line: {
    width: 80,
    height: 1,
    backgroundColor: "#111827",
    borderWidth: 0,
  },

  rectangle: {
    width: 60,
    height: 30,
    backgroundColor: "transparent",
    borderColor: "#111827",
    borderWidth: 1,
  },

  circle: {
    width: 30,
    height: 30,
    backgroundColor: "transparent",
    borderColor: "#111827",
    borderWidth: 1,
  },

  custom: {
    width: 80,
    height: 10,
    fontSize: 11,
    text: "{{category}}",
  },
};

function getDefaultText(type: LabelElementType) {
  switch (type) {
    case "heading":
      return "Heading";

    case "text":
      return "Text";

    case "custom":
      return "{{category}}";

    default:
      return "";
  }
}

function getCanvasElementStyle(
  element: LabelElement,
) {
  const style: React.CSSProperties = {
    left: `${element.x * CANVAS_SCALE}px`,
    top: `${element.y * CANVAS_SCALE}px`,
    width: `${element.width * CANVAS_SCALE}px`,
    height: `${element.height * CANVAS_SCALE}px`,
    transform: `rotate(${element.rotation}deg)`,
    opacity: element.opacity ?? 1,
    color: element.color ?? "#111827",
    backgroundColor:
      element.backgroundColor ?? "transparent",
    borderColor:
      element.borderColor ?? "#111827",
    borderWidth: `${element.borderWidth ?? 1}px`,
    fontSize: `${(element.fontSize ?? 12) * CANVAS_SCALE}px`,
    fontWeight: element.fontWeight ?? 500,
    fontFamily:
      element.fontFamily ?? "Arial",
    textAlign:
      element.textAlign ?? "left",
    zIndex: element.type === "line" ? 2 : 1,
  };

  if (
    element.type === "line"
  ) {
    style.backgroundColor =
      element.backgroundColor ??
      "#111827";
  }

  return style;
}
function BarcodeElement({
  value,
  format,
}: {
  value: string;
  format: string;
}) {
  const svgRef =
    useRef<SVGSVGElement | null>(null);

  useState(() => {
    if (!svgRef.current || !value) {
      return;
    }

    window.setTimeout(() => {
      if (!svgRef.current) return;

      renderBarcode(
        svgRef.current,
        value,
        format,
      );
    }, 0);
  });

  return (
    <svg
      ref={svgRef}
      className="designer-barcode-svg"
      aria-label={`Barcode ${value}`}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        maxWidth: "100%",
      }}
    />
  );
}

function QRElement({
  value,
}: {
  value: string;
}) {
  const canvasRef =
    useRef<HTMLCanvasElement | null>(null);

  useState(() => {
    if (!canvasRef.current || !value) {
      return;
    }

    window.setTimeout(() => {
      if (!canvasRef.current) return;

      void renderQRCode(
        canvasRef.current,
        value,
      );
    }, 0);
  });

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
    useState("");

  const [savedMessage, setSavedMessage] =
    useState("");

  const dragRef =
    useRef<DragStart | null>(null);

  const resizeRef =
    useRef<ResizeStart | null>(null);

  const draggingElementId =
    useRef<string | null>(null);

  const resizingElementId =
    useRef<string | null>(null);

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
    [template.elements, selectedElementId],
  );

  const canvasWidth =
    template.size.width *
    CANVAS_SCALE;

  const canvasHeight =
    template.size.height *
    CANVAS_SCALE;

  function loadProducts() {
    const storedProducts = getProducts();
    setProducts(storedProducts);

    if (
      storedProducts.length > 0 &&
      !selectedProductId
    ) {
      setSelectedProductId(
        storedProducts[0].id,
      );
    }
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

    const element =
      createLabelElement(type, {
        ...defaults,
        text:
          defaults.text ??
          getDefaultText(type),
      });

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

  function updateElement(
    id: string,
    updates: Partial<LabelElement>,
  ) {
    setTemplate((current) => ({
      ...current,
      elements: current.elements.map(
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

  function deleteElement(id: string) {
    setTemplate((current) => ({
      ...current,
      elements: current.elements.filter(
        (element) =>
          element.id !== id,
      ),
      updatedAt:
        new Date().toISOString(),
    }));

    setSelectedElementId(null);
  }

  function duplicateElement(id: string) {
    const source =
      template.elements.find(
        (element) =>
          element.id === id,
      );

    if (!source) return;

    const duplicate =
      createLabelElement(
        source.type,
        {
          ...source,
          id: undefined,
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

  function moveElement(
    id: string,
    direction:
      | "left"
      | "right"
      | "up"
      | "down",
  ) {
    const element =
      template.elements.find(
        (item) => item.id === id,
      );

    if (!element || element.locked) {
      return;
    }

    const step = 1;

    let x = element.x;
    let y = element.y;

    if (direction === "left") {
      x -= step;
    }

    if (direction === "right") {
      x += step;
    }

    if (direction === "up") {
      y -= step;
    }

    if (direction === "down") {
      y += step;
    }

    updateElement(id, {
      x: Math.max(
        0,
        Math.min(
          x,
          template.size.width -
            element.width,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          y,
          template.size.height -
            element.height,
        ),
      ),
    });
  }

  function saveTemplate() {
    try {
      const key =
        "labelpro_templates";

      const existing =
        JSON.parse(
          window.localStorage.getItem(
            key,
          ) ?? "[]",
        );

      const templates =
        Array.isArray(existing)
          ? existing
          : [];

      const index =
        templates.findIndex(
          (item: LabelTemplate) =>
            item.id === template.id,
        );

      if (index >= 0) {
        templates[index] = template;
      } else {
        templates.push(template);
      }

      window.localStorage.setItem(
        key,
        JSON.stringify(templates),
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

  function clearCanvas() {
    setTemplate((current) => ({
      ...current,
      elements: [],
      updatedAt:
        new Date().toISOString(),
    }));

    setSelectedElementId(null);
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLDivElement>,
    element: LabelElement,
  ) {
    if (
      element.locked ||
      resizingElementId.current
    ) {
      return;
    }

    event.stopPropagation();

    setSelectedElementId(element.id);

    draggingElementId.current =
      element.id;

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

  function handlePointerMove(
    event: ReactPointerEvent<HTMLDivElement>,
    element: LabelElement,
  ) {
    if (
      draggingElementId.current !==
        element.id ||
      !dragRef.current
    ) {
      return;
    }

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

    updateElement(element.id, {
      x: position.x,
      y: position.y,
    });
  }

  function handlePointerUp(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }

    draggingElementId.current = null;
    dragRef.current = null;
  }

  function handleResizeDown(
    event: ReactPointerEvent<HTMLDivElement>,
    element: LabelElement,
  ) {
    if (element.locked) return;

    event.stopPropagation();

    setSelectedElementId(element.id);

    resizingElementId.current =
      element.id;

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

  function handleResizeMove(
    event: ReactPointerEvent<HTMLDivElement>,
    element: LabelElement,
  ) {
    if (
      resizingElementId.current !==
        element.id ||
      !resizeRef.current
    ) {
      return;
    }

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

    updateElement(element.id, {
      width: size.width,
      height: size.height,
    });
  }

  function handleResizeUp(
    event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (
      event.currentTarget.hasPointerCapture(
        event.pointerId,
      )
    ) {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      );
    }

    resizingElementId.current = null;
    resizeRef.current = null;
  }

  function insertDynamicField(
    field: string,
  ) {
    if (!selectedElement) return;

    updateElement(
      selectedElement.id,
      {
        text: field,
        field,
      },
    );
  }
function renderElementContent(
  element: LabelElement,
) {
  if (element.type === "barcode") {
    return (
      <BarcodeElement
        value={
          selectedProduct?.barcode ??
          element.text ??
          ""
        }
        format={
          element.barcodeFormat ??
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
      <QRElement value={qrValue} />
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
  

    
    
    

  return (
    <main className="module-page label-designer-page">
      <div className="module-header">
        <div>
          <span className="eyebrow">
            LABEL DESIGNER
          </span>

          <h2>
            Professional Label Designer
          </h2>

          <p>
            Design reusable labels with
            real product data.
          </p>
        </div>

        <div className="module-header-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={clearCanvas}
          >
            Clear
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={saveTemplate}
          >
            Save Template
          </button>
        </div>
      </div>

      <div className="designer-toolbar">
        <div className="designer-toolbar-group">
          <label>
            <span>
              Template Name
            </span>

            <input
              type="text"
              value={template.name}
              onChange={(event) =>
                updateTemplate({
                  name: event.target.value,
                })
              }
            />
          </label>

          <label>
            <span>
              Label Size
            </span>

            <select
              value={`${template.size.width}x${template.size.height}`}
              onChange={(event) => {
                const [width, height] =
                  event.target.value
                    .split("x")
                    .map(Number);

                updateTemplate({
                  size: {
                    width,
                    height,
                    unit: "mm",
                  },
                });
              }}
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
          </label>

          <label>
            <span>
              Preview Product
            </span>

            <select
              value={selectedProductId}
              onChange={(event) =>
                setSelectedProductId(
                  event.target.value,
                )
              }
              onFocus={loadProducts}
            >
              <option value="">
                Select Product
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
          </label>
        </div>

        <div className="designer-toolbar-status">
          <span>
            {template.size.width} ×{" "}
            {template.size.height} mm
          </span>

          <span>
            {template.elements.length} elements
          </span>

          {selectedProduct && (
            <span>
              Product:{" "}
              {selectedProduct.name}
            </span>
          )}

          {savedMessage && (
            <span>
              {savedMessage}
            </span>
          )}
        </div>
      </div>

      <div className="label-designer-workspace">
        <section className="designer-panel designer-elements-panel">
          <div className="designer-panel-heading">
            <div>
              <span className="eyebrow">
                ELEMENTS
              </span>

              <h3>
                Add to Label
              </h3>
            </div>
          </div>

          <div className="element-tool-grid">
            {TOOL_ELEMENTS.map(
              (type) => (
                <button
                  key={type}
                  className="element-tool"
                  type="button"
                  onClick={() =>
                    addElement(type)
                  }
                >
                  <strong>
                    {
                      LABEL_ELEMENT_LABELS[
                        type
                      ]
                    }
                  </strong>

                  <span>
                    +
                  </span>
                </button>
              ),
            )}
          </div>

          <div
            className="property-section"
            style={{
              marginTop: 20,
            }}
          >
            <div className="property-section-title">
              Dynamic Fields
            </div>

            <div className="element-tool-grid">
              {DYNAMIC_FIELDS.map(
                (field) => (
                  <button
                    key={field.value}
                    className="element-tool"
                    type="button"
                    disabled={
                      !selectedElement
                    }
                    onClick={() =>
                      insertDynamicField(
                        field.value,
                      )
                    }
                  >
                    <strong>
                      {field.label}
                    </strong>

                    <span>
                      +
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        </section>

        <section className="designer-canvas-panel">
          <div className="designer-canvas-header">
            <div>
              <span className="eyebrow">
                CANVAS
              </span>

              <h3>
                {template.name}
              </h3>
            </div>

            <span className="designer-selection-badge">
              {selectedElement
                ? `${LABEL_ELEMENT_LABELS[selectedElement.type]} selected`
                : "Select an element"}
            </span>
          </div>

          <div className="designer-canvas-stage">
            <div
              className="label-canvas"
              style={{
                width: canvasWidth,
                height: canvasHeight,
                backgroundColor:
                  template.backgroundColor,
              }}
              onPointerDown={() =>
                setSelectedElementId(null)
              }
            >
              {template.elements.map(
                (element) => {
                  if (element.hidden) {
                    return null;
                  }

                  const isSelected =
                    element.id ===
                    selectedElementId;

                  return (
                    <div
                      key={element.id}
                      className={`label-element ${
                        isSelected
                          ? "selected"
                          : ""
                      } ${
                        element.type ===
                          "line"
                          ? "label-line"
                          : ""
                      } ${
                        element.type ===
                          "rectangle" ||
                        element.type ===
                          "circle"
                          ? "label-shape"
                          : ""
                      } ${
                        element.type ===
                          "circle"
                          ? "label-circle"
                          : ""
                      }`}
                      style={getCanvasElementStyle(
                        element,
                      )}
                      onPointerDown={(
                        event,
                      ) =>
                        handlePointerDown(
                          event,
                          element,
                        )
                      }
                      onPointerMove={(
                        event,
                      ) =>
                        handlePointerMove(
                          event,
                          element,
                        )
                      }
                      onPointerUp={
                        handlePointerUp
                      }
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                    >
                      {renderElementContent(
                        element,
                      )}

                      {isSelected &&
                        !element.locked && (
                          <div
                            className="label-resize-handle"
                            onPointerDown={(
                              event,
                            ) =>
                              handleResizeDown(
                                event,
                                element,
                              )
                            }
                            onPointerMove={(
                              event,
                            ) =>
                              handleResizeMove(
                                event,
                                element,
                              )
                            }
                            onPointerUp={
                              handleResizeUp
                            }
                          />
                        )}
                    </div>
                  );
                },
              )}
            </div>
          </div>
        </section>

        <section className="designer-panel designer-properties-panel">
          <div className="designer-panel-heading">
            <div>
              <span className="eyebrow">
                PROPERTIES
              </span>

              <h3>
                Element Settings
              </h3>
            </div>
          </div>

          {!selectedElement && (
            <div className="designer-empty-properties">
              <strong>
                No element selected
              </strong>

              <span>
                Select an element on the
                canvas to edit its
                properties.
              </span>
            </div>
          )}

          {selectedElement && (
            <div className="designer-properties">
              <div className="property-section">
                <div className="property-section-title">
                  Element
                </div>

                <label>
                  <span>
                    Type
                  </span>

                  <input
                    type="text"
                    value={
                      LABEL_ELEMENT_LABELS[
                        selectedElement.type
                      ]
                    }
                    readOnly
                  />
                </label>

                <label>
                  <span>
                    Text / Dynamic Value
                  </span>

                  <textarea
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
                </label>

                <label>
                  <span>
                    Field
                  </span>

                  <select
                    value={
                      selectedElement.field ??
                      ""
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          field:
                            event.target
                              .value,
                          text:
                            event.target
                              .value,
                        },
                      )
                    }
                  >
                    <option value="">
                      No Dynamic Field
                    </option>

                    {DYNAMIC_FIELDS.map(
                      (field) => (
                        <option
                          key={field.value}
                          value={
                            field.value
                          }
                        >
                          {field.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <div className="property-section">
                <div className="property-section-title">
                  Position & Size
                </div>

                <div className="property-grid">
                  <label>
                    <span>X</span>

                    <input
                      type="number"
                      value={
                        selectedElement.x
                      }
                      onChange={(
                        event,
                      ) =>
                        updateElement(
                          selectedElement.id,
                          {
                            x: Number(
                              event.target
                                .value,
                            ),
                          },
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>Y</span>

                    <input
                      type="number"
                      value={
                        selectedElement.y
                      }
                      onChange={(
                        event,
                      ) =>
                        updateElement(
                          selectedElement.id,
                          {
                            y: Number(
                              event.target
                                .value,
                            ),
                          },
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Width
                    </span>

                    <input
                      type="number"
                      min="5"
                      value={
                        selectedElement.width
                      }
                      onChange={(
                        event,
                      ) =>
                        updateElement(
                          selectedElement.id,
                          {
                            width: Math.max(
                              5,
                              Number(
                                event.target
                                  .value,
                              ),
                            ),
                          },
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Height
                    </span>

                    <input
                      type="number"
                      min="5"
                      value={
                        selectedElement.height
                      }
                      onChange={(
                        event,
                      ) =>
                        updateElement(
                          selectedElement.id,
                          {
                            height:
                              Math.max(
                                5,
                                Number(
                                  event.target
                                    .value,
                                ),
                              ),
                          },
                        )
                      }
                    />
                  </label>
                </div>

                <div className="designer-position-controls">
                  <button
                    type="button"
                    onClick={() =>
                      moveElement(
                        selectedElement.id,
                        "left",
                      )
                    }
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveElement(
                        selectedElement.id,
                        "up",
                      )
                    }
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveElement(
                        selectedElement.id,
                        "down",
                      )
                    }
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      moveElement(
                        selectedElement.id,
                        "right",
                      )
                    }
                  >
                    →
                  </button>
                </div>
              </div>

              <div className="property-section">
                <div className="property-section-title">
                  Typography
                </div>

                <div className="property-grid">
                  <label>
                    <span>
                      Font Size
                    </span>

                    <input
                      type="number"
                      min="6"
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
                              Math.max(
                                6,
                                Number(
                                  event.target
                                    .value,
                                ),
                              ),
                          },
                        )
                      }
                    />
                  </label>

                  <label>
                    <span>
                      Weight
                    </span>

                    <select
                      value={
                        selectedElement.fontWeight ??
                        500
                      }
                      onChange={(event) =>
                        updateElement(
                          selectedElement.id,
                          {
                            fontWeight:
                              Number(
                                event.target
                                  .value,
                              ),
                          },
                        )
                      }
                    >
                      <option value="400">
                        Regular
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
                  </label>
                </div>

                <label>
                  <span>
                    Text Align
                  </span>

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
                </label>

                <label>
                  <span>
                    Text Color
                  </span>

                  <input
                    className="designer-property-color"
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
                            event.target.value,
                        },
                      )
                    }
                  />
                </label>
              </div>

              <div className="property-section">
                <div className="property-section-title">
                  Appearance
                </div>

                <label>
                  <span>
                    Background
                  </span>

                  <input
                    className="designer-property-color"
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
                            event.target.value,
                        },
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Border Color
                  </span>

                  <input
                    className="designer-property-color"
                    type="color"
                    value={
                      selectedElement.borderColor ??
                      "#111827"
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          borderColor:
                            event.target.value,
                        },
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Border Width
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={
                      selectedElement.borderWidth ??
                      1
                    }
                    onChange={(event) =>
                      updateElement(
                        selectedElement.id,
                        {
                          borderWidth:
                            Math.max(
                              0,
                              Number(
                                event.target
                                  .value,
                              ),
                            ),
                        },
                      )
                    }
                  />
                </label>

                <label>
                  <span>
                    Rotation
                  </span>

                  <input
                    type="number"
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
                </label>
              </div>

              <div className="property-section">
                <div className="designer-property-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      duplicateElement(
                        selectedElement.id,
                      )
                    }
                  >
                    Duplicate
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      updateElement(
                        selectedElement.id,
                        {
                          locked:
                            !selectedElement.locked,
                        },
                      )
                    }
                  >
                    {selectedElement.locked
                      ? "Unlock"
                      : "Lock"}
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      updateElement(
                        selectedElement.id,
                        {
                          hidden:
                            !selectedElement.hidden,
                        },
                      )
                    }
                  >
                    {selectedElement.hidden
                      ? "Show"
                      : "Hide"}
                  </button>

                  <button
                    className="secondary-button danger-outline"
                    type="button"
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
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
