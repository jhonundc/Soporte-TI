"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { condicionesCatalogConfig } from "@/lib/catalogs/configs";

export default function CondicionesPage() {
  return <CatalogCrudPage config={condicionesCatalogConfig} />;
}
