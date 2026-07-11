import { CatalogCrudPage } from "@/components/catalog/CatalogCrudPage";
import { componentesCatalogConfig } from "@/lib/catalogs/configs";

export default function ComponentesConfigPage() {
  return <CatalogCrudPage config={componentesCatalogConfig} />;
}
