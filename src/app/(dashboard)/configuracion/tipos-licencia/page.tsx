"use client";

import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { tiposLicenciaCatalogConfig } from "@/lib/catalogs/configs";

export default function TiposLicenciaPage() {
  return <CatalogCrudPage config={tiposLicenciaCatalogConfig} />;
}
