import type { QueryKey } from "@/lib/query-keys";
import { queryKeys } from "@/lib/query-keys";

export type CatalogField = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean | string;
};

export type CatalogCrudConfig = {
  title: string;
  description: string;
  entityLabel: string;
  apiPath: string;
  queryKey: QueryKey;
  idField: string;
  fields: CatalogField[];
  tableFields?: string[];
  showStatusColumn?: boolean;
  enableView?: boolean;
  enableToggle?: boolean;
  enableDelete?: boolean;
  newButtonLabel?: string;
  emptyMessage?: string;
  buildCreateBody?: (data: Record<string, string>) => Record<string, unknown>;
  buildUpdateBody?: (data: Record<string, string>, item: Record<string, unknown>) => Record<string, unknown>;
  buildToggleBody?: (item: Record<string, unknown>) => Record<string, unknown>;
  getFormValues?: (item: Record<string, unknown> | null) => Record<string, string>;
};

export const marcasCatalogConfig: CatalogCrudConfig = {
  title: "Configuración de Marcas",
  description: "Gestiona las marcas de los equipos.",
  entityLabel: "marca",
  apiPath: "/api/marcas",
  queryKey: queryKeys.catalogs.marcas,
  idField: "IdMarca",
  newButtonLabel: "Nueva Marca",
  emptyMessage: "No hay marcas registradas. Crea una para comenzar.",
  enableDelete: true,
  fields: [
    {
      name: "Marca",
      label: "Nombre de la Marca",
      placeholder: "Ej. HP",
      required: "El nombre es requerido",
    },
  ],
  tableFields: ["Marca"],
};

export const modelosCatalogConfig: CatalogCrudConfig = {
  title: "Configuración de Modelos",
  description: "Gestiona los modelos de equipos.",
  entityLabel: "modelo",
  apiPath: "/api/modelos",
  queryKey: queryKeys.catalogs.modelos,
  idField: "IdModelo",
  newButtonLabel: "Nuevo Modelo",
  emptyMessage: "No hay modelos registrados. Crea uno para comenzar.",
  showStatusColumn: true,
  enableView: true,
  enableToggle: true,
  enableDelete: true,
  fields: [
    {
      name: "Modelo",
      label: "Nombre del Modelo",
      placeholder: "Ej. ProBook 450 G8",
      required: "El nombre es requerido",
    },
  ],
  tableFields: ["Modelo"],
};

export const areasCatalogConfig: CatalogCrudConfig = {
  title: "Configuración de Áreas",
  description: "Gestiona las áreas físicas de la institución.",
  entityLabel: "área",
  apiPath: "/api/areas",
  queryKey: queryKeys.catalogs.areas,
  idField: "IdArea",
  newButtonLabel: "Nueva Área",
  emptyMessage: "No hay áreas registradas. Crea una para comenzar.",
  enableView: true,
  enableDelete: true,
  fields: [
    {
      name: "NombreArea",
      label: "Nombre del Área",
      placeholder: "Ej. Contabilidad",
      required: "El nombre es requerido",
    },
    { name: "Piso", label: "Piso", placeholder: "Ej. 2do Piso" },
    { name: "Referencia", label: "Referencia", placeholder: "Ej. Frente al ascensor" },
  ],
  tableFields: ["NombreArea", "Piso", "Referencia"],
  getFormValues: (item) => ({
    NombreArea: String(item?.NombreArea ?? ""),
    Piso: String(item?.Piso ?? ""),
    Referencia: String(item?.Referencia ?? ""),
  }),
};

export const categoriasCatalogConfig: CatalogCrudConfig = {
  title: "Configuración de Categorías",
  description: "Gestiona las categorías de los bienes.",
  entityLabel: "categoría",
  apiPath: "/api/categorias",
  queryKey: queryKeys.catalogs.categorias,
  idField: "IdCategoria",
  newButtonLabel: "Nueva Categoría",
  emptyMessage: "No hay categorías registradas. Crea una para comenzar.",
  enableView: true,
  enableToggle: true,
  enableDelete: true,
  fields: [
    {
      name: "CategoriaBien",
      label: "Nombre de la Categoría",
      placeholder: "Ej. Laptops",
      required: "El nombre es requerido",
    },
  ],
  tableFields: ["CategoriaBien"],
};

export const condicionesCatalogConfig: CatalogCrudConfig = {
  title: "Configuración de Condiciones",
  description: "Gestiona las condiciones de los bienes.",
  entityLabel: "condición",
  apiPath: "/api/condiciones",
  queryKey: queryKeys.catalogs.condiciones,
  idField: "IdCondicion",
  newButtonLabel: "Nueva Condición",
  emptyMessage: "No hay condiciones registradas. Crea una para comenzar.",
  enableDelete: true,
  fields: [
    {
      name: "Condicion",
      label: "Condición del Bien",
      placeholder: "Ej. Operativo",
      required: "La condición es requerida",
    },
  ],
  tableFields: ["Condicion"],
};

export const estadosCatalogConfig: CatalogCrudConfig = {
  title: "Configuración de Estados",
  description: "Gestiona los estados de los bienes.",
  entityLabel: "estado",
  apiPath: "/api/estados",
  queryKey: queryKeys.catalogs.estados,
  idField: "IdEstadoBien",
  newButtonLabel: "Nuevo Estado",
  emptyMessage: "No hay estados registrados. Crea uno para comenzar.",
  enableDelete: true,
  fields: [
    {
      name: "EstadoBien",
      label: "Estado del Bien",
      placeholder: "Ej. Bueno",
      required: "El estado es requerido",
    },
  ],
  tableFields: ["EstadoBien"],
};

export const proveedoresCatalogConfig: CatalogCrudConfig = {
  title: "Configuración de Proveedores",
  description: "Gestiona los proveedores registrados.",
  entityLabel: "proveedor",
  apiPath: "/api/proveedores",
  queryKey: queryKeys.catalogs.proveedores,
  idField: "IdProveedor",
  newButtonLabel: "Nuevo Proveedor",
  emptyMessage: "No hay proveedores registrados. Crea uno para comenzar.",
  enableToggle: true,
  enableDelete: true,
  fields: [
    {
      name: "Proveedor",
      label: "Proveedor",
      placeholder: "Ej. Soluciones TI",
      required: "El nombre del proveedor es requerido",
    },
  ],
  tableFields: ["Proveedor"],
};

export const componentesCatalogConfig: CatalogCrudConfig = {
  title: "Configuración de Componentes",
  description: "Gestiona los componentes disponibles del inventario.",
  entityLabel: "componente",
  apiPath: "/api/componentes-catalogo",
  queryKey: queryKeys.catalogs.componentes,
  idField: "IdComponente",
  newButtonLabel: "Nuevo Componente",
  emptyMessage: "No hay componentes registrados. Crea uno para comenzar.",
  showStatusColumn: true,
  enableView: true,
  enableToggle: true,
  enableDelete: true,
  fields: [
    {
      name: "NombreComponente",
      label: "Nombre del Componente",
      placeholder: "Ej. Mouse USB",
      required: "El nombre es requerido",
    },
  ],
  tableFields: ["NombreComponente"],
};

export const tiposLicenciaCatalogConfig: CatalogCrudConfig = {
  title: "Tipos de Licencia",
  description: "Gestiona los tipos de licencia disponibles.",
  entityLabel: "tipo de licencia",
  apiPath: "/api/tipos-licencia",
  queryKey: queryKeys.catalogs.tiposLicencia,
  idField: "IdTipoLicencia",
  newButtonLabel: "Nuevo Tipo",
  emptyMessage: "No hay tipos de licencia. Agrega uno nuevo para empezar.",
  enableDelete: true,
  fields: [
    {
      name: "TipoLicencia",
      label: "Nombre del Tipo de Licencia",
      placeholder: "Ej. Licencia Perpetua, Licencia Anual",
      required: "El nombre es requerido",
    },
  ],
  tableFields: ["TipoLicencia"],
};

export const tiposSoftwareCatalogConfig: CatalogCrudConfig = {
  title: "Tipos de Software",
  description: "Gestiona los tipos de software disponibles.",
  entityLabel: "tipo de software",
  apiPath: "/api/tipos-software",
  queryKey: queryKeys.catalogs.tiposSoftware,
  idField: "IdTipoSoftware",
  newButtonLabel: "Nuevo Tipo",
  emptyMessage: "No hay tipos de software. Agrega uno nuevo para empezar.",
  enableDelete: true,
  fields: [
    {
      name: "TipoSoftware",
      label: "Nombre del Tipo de Software",
      placeholder: "Ej. Sistema Operativo, Aplicación de Oficina",
      required: "El nombre es requerido",
    },
  ],
  tableFields: ["TipoSoftware"],
};

export const softwareCatalogoConfig: CatalogCrudConfig = {
  title: "Catálogo de Software",
  description: "Gestiona el catálogo de software disponible.",
  entityLabel: "software",
  apiPath: "/api/software-catalogo",
  queryKey: queryKeys.catalogs.softwareCatalogo,
  idField: "IdSoftwareCatalogo",
  newButtonLabel: "Nuevo Software",
  emptyMessage: "No hay software en el catálogo. Agrega uno nuevo para empezar.",
  enableDelete: true,
  fields: [
    {
      name: "NombreSoftware",
      label: "Nombre del Software",
      placeholder: "Ej. Microsoft Office",
      required: "El nombre es requerido",
    },
  ],
  tableFields: ["NombreSoftware"],
};

export const tiposAsignacionSoftwareCatalogConfig: CatalogCrudConfig = {
  title: "Tipos de Asignación de Software",
  description: "Gestiona los tipos de asignación de licencias de software.",
  entityLabel: "tipo de asignación",
  apiPath: "/api/tipos-asignacion-software",
  queryKey: queryKeys.catalogs.tiposAsignacionSoftware,
  idField: "IdTipoAsignacion",
  newButtonLabel: "Nuevo Tipo",
  emptyMessage: "No hay tipos de asignación. Agrega uno nuevo para empezar.",
  enableDelete: true,
  fields: [
    {
      name: "TipoAsignacion",
      label: "Nombre del Tipo de Asignación",
      placeholder: "Ej. Por usuario, Por equipo",
      required: "El nombre es requerido",
    },
  ],
  tableFields: ["TipoAsignacion"],
};
