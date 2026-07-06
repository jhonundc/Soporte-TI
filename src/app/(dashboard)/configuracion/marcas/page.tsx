"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { marcasCatalogConfig } from "@/lib/catalogs/configs";

export default function MarcasPage() {
  return <CatalogCrudPage config={marcasCatalogConfig} />;
}
