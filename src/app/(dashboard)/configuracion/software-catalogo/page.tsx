"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { softwareCatalogoConfig } from "@/lib/catalogs/configs";

export default function SoftwareCatalogoPage() {
  return <CatalogCrudPage config={softwareCatalogoConfig} />;
}
