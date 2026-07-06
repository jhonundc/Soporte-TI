export {
  nullableString,
  nullableInt,
  requiredString,
  requiredPositiveInt,
  optionalBooleanLike,
  idQuerySchema,
  validationError,
  parseJsonBody,
  parseSearchParams,
  searchParamsToObject,
} from "./common";

export {
  bienFormSchema,
  bienCreateApiSchema,
  bienUpdateApiSchema,
  bienToggleApiSchema,
  bienDeleteQuerySchema,
  type BienFormInput,
  type BienCreateApiInput,
  type BienUpdateApiInput,
  type BienToggleApiInput,
} from "./bienes.schema";

export {
  fichaCreateApiSchema,
  fichaUpdateApiSchema,
  fichaDeleteQuerySchema,
  fichaListQuerySchema,
  fichaBuscarQuerySchema,
  type FichaCreateApiInput,
  type FichaUpdateApiInput,
} from "./ficha.schema";

export {
  bajaCreateApiSchema,
  bajaUpdateApiSchema,
  bajaDeleteQuerySchema,
  type BajaCreateApiInput,
  type BajaUpdateApiInput,
} from "./baja.schema";
