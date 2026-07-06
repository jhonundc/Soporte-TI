"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { estadosCatalogConfig } from "@/lib/catalogs/configs";

export default function EstadosPage() {
  return <CatalogCrudPage config={estadosCatalogConfig} />;
}
