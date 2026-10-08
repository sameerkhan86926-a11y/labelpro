export type NavigationItem = {
  label: string;
  description: string;
  path: string;
  section: "main" | "management" | "tools" | "system";
};

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    description: "Workspace overview and quick actions",
    path: "/",
    section: "main",
  },
  {
    label: "Products",
    description: "Manage products, SKUs, prices and inventory details",
    path: "/products/",
    section: "management",
  },
  {
    label: "Labels",
    description: "Manage created labels and label designs",
    path: "/labels/",
    section: "management",
  },
  {
    label: "Templates",
    description: "Create and manage reusable label templates",
    path: "/templates/",
    section: "management",
  },
  {
    label: "Barcodes",
    description: "Generate and manage product barcodes",
    path: "/barcodes/",
    section: "tools",
  },
  {
    label: "QR Codes",
    description: "Create QR codes for products and custom data",
    path: "/qr-codes/",
    section: "tools",
  },
  {
    label: "Print Center",
    description: "Preview, configure and print labels",
    path: "/print-center/",
    section: "tools",
  },
  {
    label: "Reports",
    description: "View workspace statistics and reports",
    path: "/reports/",
    section: "system",
  },
  {
    label: "Settings",
    description: "Manage company branding and workspace settings",
    path: "/settings/",
    section: "system",
  },
];

export function getNavigationItem(path: string) {
  return navigationItems.find((item) => item.path === path);
}
