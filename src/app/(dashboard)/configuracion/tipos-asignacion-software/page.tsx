"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { tiposAsignacionSoftwareCatalogConfig } from "@/lib/catalogs/configs";

export default function TiposAsignacionSoftwarePage() {
  return <CatalogCrudPage config={tiposAsignacionSoftwareCatalogConfig} />;
}
