"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { tiposSoftwareCatalogConfig } from "@/lib/catalogs/configs";

export default function TiposSoftwarePage() {
  return <CatalogCrudPage config={tiposSoftwareCatalogConfig} />;
}
