export const queryKeys = {
  session: () => ["session"] as const,

  bienes: {
    all: () => ["bienes"] as const,
  },

  usuarios: {
    all: () => ["usuarios"] as const,
  },

  roles: {
    all: () => ["roles"] as const,
  },

  componentes: (codigo = "", serie = "") =>
    ["componentes", codigo, serie] as const,

  software: (search = "") => ["software", search] as const,

  fichasSoporte: (numeroFicha = "") => ["fichasSoporte", numeroFicha] as const,

  fichasBaja: (numeroFicha = "") => ["fichasBaja", numeroFicha] as const,

  catalogs: {
    marcas: ["marcas"] as const,
    modelos: ["modelos"] as const,
    areas: ["areas"] as const,
    categorias: ["categorias"] as const,
    proveedores: ["proveedores"] as const,
    componentes: ["componentes-catalogo"] as const,
    condiciones: ["condicionesList"] as const,
    estados: ["estadosList"] as const,
    tiposLicencia: ["tipos-licencia"] as const,
    tiposSoftware: ["tipos-software"] as const,
    softwareCatalogo: ["software-catalogo"] as const,
    tiposAsignacionSoftware: ["tipos-asignacion-software"] as const,
    prioridades: ["prioridades"] as const,
    tiposBien: ["tiposBien"] as const,
  },
} as const;

export type QueryKey = readonly unknown[];
