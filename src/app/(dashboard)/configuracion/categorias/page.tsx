"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { categoriasCatalogConfig } from "@/lib/catalogs/configs";

export default function CategoriasPage() {
  return <CatalogCrudPage config={categoriasCatalogConfig} />;
}
