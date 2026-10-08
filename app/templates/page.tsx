"use client";

import { useState } from "react";

import {
  deleteTemplate,
  duplicateTemplate,
  getTemplates,
} from "../lib/template-storage";

import type { LabelTemplate } from "../lib/label-types";

export default function TemplatesPage() {
  const [templates, setTemplates] =
    useState<LabelTemplate[]>(() =>
      getTemplates(),
    );

  function refreshTemplates() {
    setTemplates(getTemplates());
  }

  function handleDelete(id: string) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this template?",
      );

    if (!confirmed) return;

    deleteTemplate(id);
    refreshTemplates();
  }

  function handleDuplicate(id: string) {
    duplicateTemplate(id);
    refreshTemplates();
  }

  function openTemplate(
    template: LabelTemplate,
  ) {
    try {
      window.localStorage.setItem(
        "labelpro_editor_template",
        JSON.stringify(template),
      );

      window.location.assign(
        "/labelpro/labels/designer/",
      );
    } catch {
      window.alert(
        "Unable to open template.",
      );
    }
  }

  return (
    <main className="templates-page">
      <div className="templates-header">
        <div>
          <div className="templates-breadcrumb">
            LabelPro / Templates
          </div>

          <h1 className="templates-title">
            Templates
          </h1>

          <p className="templates-subtitle">
            Create, manage and reuse
            professional label templates.
          </p>
        </div>

        <a
          href="/labelpro/labels/designer/"
          className="templates-primary-button"
        >
          Create Template
        </a>
      </div>

      {templates.length === 0 && (
        <div className="templates-empty">
          <div className="templates-empty-icon">
            +
          </div>

          <h2>
            No templates yet
          </h2>

          <p>
            Create your first label
            template from the Label
            Designer.
          </p>

          <a
            href="/labelpro/labels/designer/"
            className="templates-primary-button"
          >
            Create First Template
          </a>
        </div>
      )}

      {templates.length > 0 && (
        <div className="templates-grid">
          {templates.map(
            (template) => (
              <article
                key={template.id}
                className="template-card"
              >
                <div className="template-preview-area">
                  <div
                    className="template-preview"
                    style={{
                      width: `${Math.min(
                        template.size.width * 2,
                        260,
                      )}px`,
                      height: `${Math.min(
                        template.size.height * 2,
                        180,
                      )}px`,
                      backgroundColor:
                        template.backgroundColor,
                    }}
                  >
                    {template.elements
                      .slice(0, 8)
                      .map(
                        (element) => (
                          <div
                            key={
                              element.id
                            }
                            className="template-preview-element"
                            style={{
                              left: `${element.x * 2}px`,
                              top: `${element.y * 2}px`,
                              width: `${Math.min(
                                element.width *
                                  2,
                                200,
                              )}px`,
                              height: `${Math.min(
                                element.height *
                                  2,
                                80,
                              )}px`,
                              fontSize: `${Math.max(
                                6,
                                (element.fontSize ??
                                  10) *
                                  0.7,
                              )}px`,
                              fontWeight:
                                element.fontWeight ??
                                500,
                              color:
                                element.color ??
                                "#111827",
                              opacity:
                                element.opacity ??
                                1,
                            }}
                          >
                            {element.text ||
                              element.type.replace(
                                /_/g,
                                " ",
                              )}
                          </div>
                        ),
                      )}
                  </div>
                </div>

                <div className="template-card-content">
                  <div className="template-card-top">
                    <div>
                      <h2>
                        {template.name}
                      </h2>

                      <p>
                        {template.description ||
                          "Custom LabelPro template"}
                      </p>
                    </div>
                  </div>

                  <div className="template-meta">
                    <span>
                      {template.size.width} ×{" "}
                      {template.size.height} mm
                    </span>

                    <span>
                      {
                        template.elements
                          .length
                      }{" "}
                      elements
                    </span>
                  </div>

                  <div className="template-actions">
                    <button
                      type="button"
                      className="template-edit-button"
                      onClick={() =>
                        openTemplate(
                          template,
                        )
                      }
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="template-secondary-button"
                      onClick={() =>
                        handleDuplicate(
                          template.id,
                        )
                      }
                    >
                      Duplicate
                    </button>

                    <button
                      type="button"
                      className="template-danger-button"
                      onClick={() =>
                        handleDelete(
                          template.id,
                        )
                      }
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ),
          )}
        </div>
      )}
    </main>
  );
}
