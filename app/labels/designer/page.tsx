"use client";

import { useMemo, useState } from "react";
import {
  createLabelElement,
  createLabelTemplate,
  DEFAULT_LABEL_SIZES,
  LABEL_ELEMENT_LABELS,
  type LabelElement,
  type LabelElementType,
  type LabelTemplate,
} from "../../lib/label-types";

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

const FIELD_PREVIEWS: Record<string, string> = {
  product_name: "Premium Product",
  sku: "SKU-10001",
  barcode: "8901234567890",
  qr: "QR",
  price: "₹499",
  mrp: "MRP ₹599",
  batch: "BATCH-001",
  expiry: "31/12/2027",
  manufacturing_date: "01/01/2026",
};

function elementPreview(element: LabelElement) {
  if (element.type === "text") {
    return element.text || "Sample Text";
  }

  if (element.type === "heading") {
    return element.text || "Product Label";
  }

  return FIELD_PREVIEWS[element.type] || LABEL_ELEMENT_LABELS[element.type];
}

export default function LabelDesignerPage() {
  const [template, setTemplate] = useState<LabelTemplate>(() =>
    createLabelTemplate("New Product Label", 50, 25),
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedElement = useMemo(
    () =>
      template.elements.find((element) => element.id === selectedId) ?? null,
    [template.elements, selectedId],
  );

  const updateTemplate = (updates: Partial<LabelTemplate>) => {
    setTemplate((current) => ({
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  };

  const addElement = (type: LabelElementType) => {
    const element = createLabelElement(type);

    if (type === "heading") {
      element.width = 80;
      element.height = 12;
      element.fontSize = 18;
      element.fontWeight = 700;
      element.text = "Product Label";
      element.textAlign = "center";
    }

    if (type === "text") {
      element.width = 70;
      element.height = 10;
      element.text = "Sample Text";
    }

    if (type === "product_name") {
      element.width = 80;
      element.height = 12;
      element.fontSize = 14;
      element.fontWeight = 700;
      element.textAlign = "center";
    }

    if (type === "barcode") {
      element.width = 75;
      element.height = 20;
    }

    if (type === "qr") {
      element.width = 25;
      element.height = 25;
    }

    if (type === "line") {
      element.width = 80;
      element.height = 2;
      element.backgroundColor = "#111827";
    }

    if (type === "rectangle") {
      element.width = 80;
      element.height = 30;
      element.backgroundColor = "transparent";
      element.borderColor = "#111827";
      element.borderWidth = 1;
    }

    if (type === "circle") {
      element.width = 25;
      element.height = 25;
      element.backgroundColor = "transparent";
      element.borderColor = "#111827";
      element.borderWidth = 1;
    }

    setTemplate((current) => ({
      ...current,
      elements: [...current.elements, element],
      updatedAt: new Date().toISOString(),
    }));

    setSelectedId(element.id);
  };

  const updateElement = (
    id: string,
    updates: Partial<LabelElement>,
  ) => {
    setTemplate((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === id
          ? {
              ...element,
              ...updates,
            }
          : element,
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const deleteSelected = () => {
    if (!selectedId) return;

    setTemplate((current) => ({
      ...current,
      elements: current.elements.filter(
        (element) => element.id !== selectedId,
      ),
      updatedAt: new Date().toISOString(),
    }));

    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selectedElement) return;

    const duplicate: LabelElement = {
      ...selectedElement,
      id: crypto.randomUUID(),
      x: selectedElement.x + 5,
      y: selectedElement.y + 5,
    };

    setTemplate((current) => ({
      ...current,
      elements: [...current.elements, duplicate],
      updatedAt: new Date().toISOString(),
    }));

    setSelectedId(duplicate.id);
  };

  const moveSelected = (
    direction: "up" | "down" | "left" | "right",
  ) => {
    if (!selectedElement || selectedElement.locked) return;

    const amount = 1;

    updateElement(selectedElement.id, {
      x:
        direction === "left"
          ? Math.max(0, selectedElement.x - amount)
          : direction === "right"
            ? Math.min(
                template.size.width - selectedElement.width,
                selectedElement.x + amount,
              )
            : selectedElement.x,

      y:
        direction === "up"
          ? Math.max(0, selectedElement.y - amount)
          : direction === "down"
            ? Math.min(
                template.size.height - selectedElement.height,
                selectedElement.y + amount,
              )
            : selectedElement.y,
    });
  };

  const saveTemplate = () => {
    const templates = JSON.parse(
      localStorage.getItem("labelpro_templates") || "[]",
    );

    const existingIndex = templates.findIndex(
      (item: LabelTemplate) => item.id === template.id,
    );

    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    localStorage.setItem(
      "labelpro_templates",
      JSON.stringify(templates),
    );

    alert("Template saved successfully.");
  };

  const clearCanvas = () => {
    if (!confirm("Remove all elements from this label?")) return;

    setTemplate((current) => ({
      ...current,
      elements: [],
      updatedAt: new Date().toISOString(),
    }));

    setSelectedId(null);
  };

  return (
    <main className="module-page label-designer-page">
      <div className="module-header">
        <div>
          <span className="eyebrow">LABEL DESIGNER</span>
          <h2>Professional Label Designer</h2>
          <p>
            Create reusable product labels with dynamic fields,
            barcodes, QR codes and custom elements.
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

      <section className="designer-toolbar">
        <div className="designer-toolbar-group">
          <label>
            <span>Template Name</span>
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
            <span>Label Size</span>
            <select
              value={`${template.size.width}x${template.size.height}`}
              onChange={(event) => {
                const [width, height] = event.target.value
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
              {DEFAULT_LABEL_SIZES.map((size) => (
                <option
                  key={`${size.width}x${size.height}`}
                  value={`${size.width}x${size.height}`}
                >
                  {size.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Background</span>
            <input
              className="designer-color-input"
              type="color"
              value={template.backgroundColor}
              onChange={(event) =>
                updateTemplate({
                  backgroundColor: event.target.value,
                })
              }
            />
          </label>
        </div>

        <div className="designer-toolbar-status">
          <span>{template.elements.length} elements</span>
          <span>
            {template.size.width} × {template.size.height} mm
          </span>
        </div>
      </section>

      <section className="label-designer-workspace">
        <aside className="designer-panel designer-elements-panel">
          <div className="designer-panel-heading">
            <div>
              <span className="eyebrow">ELEMENTS</span>
              <h3>Add Elements</h3>
            </div>
          </div>

          <div className="element-tool-grid">
            {TOOL_ELEMENTS.map((type) => (
              <button
                key={type}
                type="button"
                className="element-tool"
                onClick={() => addElement(type)}
              >
                <strong>
                  {LABEL_ELEMENT_LABELS[type]}
                </strong>
                <span>+ Add</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="designer-canvas-panel">
          <div className="designer-canvas-header">
            <div>
              <span className="eyebrow">CANVAS</span>
              <h3>Label Preview</h3>
            </div>

            {selectedElement && (
              <span className="designer-selection-badge">
                Selected:{" "}
                {LABEL_ELEMENT_LABELS[selectedElement.type]}
              </span>
            )}
          </div>

          <div className="designer-canvas-stage">
            <div
              className="label-canvas"
              style={{
                width: `${template.size.width * 3}px`,
                height: `${template.size.height * 3}px`,
                backgroundColor: template.backgroundColor,
              }}
              onClick={() => setSelectedId(null)}
            >
              {template.elements.map((element) => {
                if (element.hidden) return null;

                const isSelected = element.id === selectedId;

                const commonStyle = {
                  left: `${element.x * 3}px`,
                  top: `${element.y * 3}px`,
                  width: `${element.width * 3}px`,
                  height: `${element.height * 3}px`,
                  transform: `rotate(${element.rotation}deg)`,
                  opacity: element.opacity ?? 1,
                  color: element.color ?? "#111827",
                  backgroundColor:
                    element.backgroundColor ?? "transparent",
                  borderColor:
                    element.borderColor ?? "#111827",
                  borderWidth: `${element.borderWidth ?? 0}px`,
                  fontSize: `${Math.max(
                    7,
                    (element.fontSize ?? 12) * 0.75,
                  )}px`,
                  fontWeight: element.fontWeight ?? 500,
                  fontFamily: element.fontFamily ?? "Arial",
                  textAlign: element.textAlign ?? "left",
                };

                if (element.type === "line") {
                  return (
                    <button
                      key={element.id}
                      type="button"
                      className={`label-element label-line ${
                        isSelected ? "selected" : ""
                      }`}
                      style={commonStyle}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(element.id);
                      }}
                    />
                  );
                }

                if (element.type === "rectangle") {
                  return (
                    <button
                      key={element.id}
                      type="button"
                      className={`label-element label-shape ${
                        isSelected ? "selected" : ""
                      }`}
                      style={commonStyle}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(element.id);
                      }}
                    />
                  );
                }

                if (element.type === "circle") {
                  return (
                    <button
                      key={element.id}
                      type="button"
                      className={`label-element label-shape label-circle ${
                        isSelected ? "selected" : ""
                      }`}
                      style={commonStyle}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedId(element.id);
                      }}
                    />
                  );
                }

                return (
                  <button
                    key={element.id}
                    type="button"
                    className={`label-element ${
                      isSelected ? "selected" : ""
                    }`}
                    style={commonStyle}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedId(element.id);
                    }}
                  >
                    {element.type === "barcode" ? (
                      <span className="designer-barcode-preview">
                        ||| || |||| ||| || ||
                      </span>
                    ) : element.type === "qr" ? (
                      <span className="designer-qr-preview">
                        QR
                      </span>
                    ) : element.type === "image" ||
                      element.type === "logo" ? (
                      <span className="designer-image-placeholder">
                        {element.type === "logo"
                          ? "LOGO"
                          : "IMAGE"}
                      </span>
                    ) : (
                      elementPreview(element)
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <aside className="designer-panel designer-properties-panel">
          <div className="designer-panel-heading">
            <div>
              <span className="eyebrow">PROPERTIES</span>
              <h3>Element Settings</h3>
            </div>
          </div>

          {!selectedElement ? (
            <div className="designer-empty-properties">
              <strong>No element selected</strong>
              <span>
                Add an element and select it on the canvas to edit
                its properties.
              </span>
            </div>
          ) : (
            <div className="designer-properties">
              <div className="property-section">
                <label>
                  <span>Element Type</span>
                  <input
                    type="text"
                    value={LABEL_ELEMENT_LABELS[selectedElement.type]}
                    disabled
                  />
                </label>

                {(selectedElement.type === "text" ||
                  selectedElement.type === "heading") && (
                  <label>
                    <span>Text</span>
                    <textarea
                      rows={3}
                      value={selectedElement.text ?? ""}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          text: event.target.value,
                        })
                      }
                    />
                  </label>
                )}
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
                      value={selectedElement.x}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          x: Number(event.target.value),
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Y</span>
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          y: Number(event.target.value),
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Width</span>
                    <input
                      type="number"
                      min="1"
                      value={selectedElement.width}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          width: Number(event.target.value),
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Height</span>
                    <input
                      type="number"
                      min="1"
                      value={selectedElement.height}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          height: Number(event.target.value),
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Rotation</span>
                    <input
                      type="number"
                      value={selectedElement.rotation}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          rotation: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="property-section">
                <div className="property-section-title">
                  Typography
                </div>

                <div className="property-grid">
                  <label>
                    <span>Font Size</span>
                    <input
                      type="number"
                      min="6"
                      value={selectedElement.fontSize ?? 12}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          fontSize: Number(event.target.value),
                        })
                      }
                    />
                  </label>

                  <label>
                    <span>Font Weight</span>
                    <select
                      value={selectedElement.fontWeight ?? 500}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          fontWeight: Number(event.target.value),
                        })
                      }
                    >
                      <option value="400">Regular</option>
                      <option value="500">Medium</option>
                      <option value="600">Semi Bold</option>
                      <option value="700">Bold</option>
                      <option value="800">Extra Bold</option>
                    </select>
                  </label>

                  <label>
                    <span>Alignment</span>
                    <select
                      value={selectedElement.textAlign ?? "left"}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          textAlign: event.target.value as
                            | "left"
                            | "center"
                            | "right",
                        })
                      }
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>

                  <label>
                    <span>Color</span>
                    <input
                      className="designer-property-color"
                      type="color"
                      value={selectedElement.color ?? "#111827"}
                      onChange={(event) =>
                        updateElement(selectedElement.id, {
                          color: event.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="property-section">
                <div className="property-section-title">
                  Element Controls
                </div>

                <div className="designer-position-controls">
                  <button
                    type="button"
                    onClick={() => moveSelected("up")}
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    onClick={() => moveSelected("left")}
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={() => moveSelected("right")}
                  >
                    →
                  </button>

                  <button
                    type="button"
                    onClick={() => moveSelected("down")}
                  >
                    ↓
                  </button>
                </div>

                <div className="designer-property-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={duplicateSelected}
                  >
                    Duplicate
                  </button>

                  <button
                    className="secondary-button danger-outline"
                    type="button"
                    onClick={deleteSelected}
                  >
                    Delete
                  </button>
                </div>

                <label className="designer-toggle">
                  <input
                    type="checkbox"
                    checked={selectedElement.locked ?? false}
                    onChange={(event) =>
                      updateElement(selectedElement.id, {
                        locked: event.target.checked,
                      })
                    }
                  />
                  <span>Lock element</span>
                </label>

                <label className="designer-toggle">
                  <input
                    type="checkbox"
                    checked={selectedElement.hidden ?? false}
                    onChange={(event) =>
                      updateElement(selectedElement.id, {
                        hidden: event.target.checked,
                      })
                    }
                  />
                  <span>Hide element</span>
                </label>
              </div>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
