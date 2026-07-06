export type BreadcrumbItem = {
  label: string;
  href?: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  inventario: "Inventario",
  bienes: "Bienes",
  componentes: "Componentes",
  software: "Software",
  soporte: "Soporte",
  ficha: "Ficha de soporte",
  baja: "Ficha de baja",
  mantenimiento: "Mantenimiento",
  configuracion: "Configuración",
  areas: "Áreas",
  categorias: "Categorías",
  marcas: "Marcas",
  modelos: "Modelos",
  proveedores: "Proveedores",
  condiciones: "Condiciones",
  estados: "Estados",
  "tipos-software": "Tipos de software",
  "tipos-licencia": "Tipos de licencia",
  "tipos-asignacion-software": "Tipos de asignación",
  "software-catalogo": "Catálogo de software",
  reportes: "Reportes",
  fichas: "Registro de fichas",
  usuarios: "Usuarios",
  redes: "Redes",
};

function formatSegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  if (pathname === "/") {
    return [{ label: "Dashboard" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const items: BreadcrumbItem[] = [{ label: "Dashboard", href: "/" }];

  let path = "";
  for (let i = 0; i < segments.length; i += 1) {
    path += `/${segments[i]}`;
    const isLast = i === segments.length - 1;
    items.push({
      label: formatSegment(segments[i]),
      href: isLast ? undefined : path,
    });
  }

  return items;
}

export function getPageTitle(pathname: string): string {
  const items = buildBreadcrumbs(pathname);
  return items[items.length - 1]?.label ?? "Panel de Control";
}
