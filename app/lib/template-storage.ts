import type { LabelTemplate } from "./label-types";
import {
  createSampleTemplates,
  SAMPLE_TEMPLATE_PREFIX,
} from "./sample-templates";

const TEMPLATES_KEY = "labelpro_templates";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getTemplates(): LabelTemplate[] {
  if (!isBrowser()) return [];

  try {
    const stored = window.localStorage.getItem(TEMPLATES_KEY);

    if (!stored) {
      const samples = createSampleTemplates();
      window.localStorage.setItem(
        TEMPLATES_KEY,
        JSON.stringify(samples),
      );
      return samples;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    const templates = parsed as LabelTemplate[];

    // Add any missing sample templates without overwriting
    // templates that the user has already saved or edited.
    const existingSampleNames = new Set(
      templates
        .filter((template) =>
          template.name.startsWith(SAMPLE_TEMPLATE_PREFIX),
        )
        .map((template) => template.name),
    );

    const samples = createSampleTemplates().filter(
      (sample) =>
        !templates.some(
          (template) => template.id === sample.id,
        ) &&
        !templates.some(
          (template) =>
            template.name === sample.name &&
            [
              "Retail Price Label",
              "Product Barcode Label",
              "Perfume Label",
            ].includes(template.name),
        ) &&
        !existingSampleNames.has(sample.name),
    );

    if (samples.length > 0) {
      const updated = [...templates, ...samples];
      window.localStorage.setItem(
        TEMPLATES_KEY,
        JSON.stringify(updated),
      );
      return updated;
    }

    return templates;
  } catch {
    return [];
  }
}

export function saveTemplates(templates: LabelTemplate[]) {
  if (!isBrowser()) return;

  window.localStorage.setItem(
    TEMPLATES_KEY,
    JSON.stringify(templates),
  );
}

export function getTemplateById(
  id: string,
): LabelTemplate | null {
  const templates = getTemplates();

  return (
    templates.find((template) => template.id === id) ?? null
  );
}

export function addTemplate(template: LabelTemplate) {
  const templates = getTemplates();

  const updatedTemplates = [...templates, template];

  saveTemplates(updatedTemplates);

  return template;
}

export function updateTemplate(
  id: string,
  updates: Partial<LabelTemplate>,
) {
  const templates = getTemplates();

  const updatedTemplates = templates.map((template) => {
    if (template.id !== id) return template;

    return {
      ...template,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  });

  saveTemplates(updatedTemplates);

  return updatedTemplates;
}

export function deleteTemplate(id: string) {
  const templates = getTemplates();

  const updatedTemplates = templates.filter(
    (template) => template.id !== id,
  );

  saveTemplates(updatedTemplates);

  return updatedTemplates;
}

export function duplicateTemplate(id: string) {
  const template = getTemplateById(id);

  if (!template) return null;

  const now = new Date().toISOString();

  const duplicatedTemplate: LabelTemplate = {
    ...template,
    id: crypto.randomUUID(),
    name: `${template.name} Copy`,
    createdAt: now,
    updatedAt: now,
    elements: template.elements.map((element) => ({
      ...element,
      id: crypto.randomUUID(),
    })),
  };

  addTemplate(duplicatedTemplate);

  return duplicatedTemplate;
}

export function clearTemplates() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(TEMPLATES_KEY);
}
