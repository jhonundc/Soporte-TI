"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { proveedoresCatalogConfig } from "@/lib/catalogs/configs";

export default function ProveedoresPage() {
  return <CatalogCrudPage config={proveedoresCatalogConfig} />;
}
