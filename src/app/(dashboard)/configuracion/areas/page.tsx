"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { areasCatalogConfig } from "@/lib/catalogs/configs";

export default function AreasPage() {
  return <CatalogCrudPage config={areasCatalogConfig} />;
}
