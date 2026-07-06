"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { modelosCatalogConfig } from "@/lib/catalogs/configs";

export default function ModelosPage() {
  return <CatalogCrudPage config={modelosCatalogConfig} />;
}
