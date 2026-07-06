import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src/app/api");

const catalogRoutes = [
  "marcas",
  "areas",
  "categorias",
  "proveedores",
  "modelos",
  "software-catalogo",
  "tipos-licencia",
  "tipos-software",
  "tipos-asignacion-software",
  "condiciones",
  "estados",
  "tipos-estacion",
];

const guardImport =
  'import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";';

function addCatalogGuards(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  if (content.includes("authSession")) return false;

  content = content.replace(
    'import { executeQuery } from "@/lib/db";',
    `import { executeQuery } from "@/lib/db";\n${guardImport}`
  );

  content = content.replace(
    /export async function GET\([^)]*\) \{\n  try \{/g,
    `export async function GET() {\n  const auth = await authSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
  );

  content = content.replace(
    /export async function POST\(request: Request\) \{\n  try \{/g,
    `export async function POST(request: Request) {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
  );

  content = content.replace(
    /export async function PATCH\(request: Request\) \{\n  try \{/g,
    `export async function PATCH(request: Request) {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
  );

  content = content.replace(
    /export async function DELETE\(request: Request\) \{\n  try \{/g,
    `export async function DELETE(request: Request) {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
  );

  fs.writeFileSync(filePath, content);
  return true;
}

let updated = 0;
for (const route of catalogRoutes) {
  const filePath = path.join(root, route, "route.ts");
  if (fs.existsSync(filePath) && addCatalogGuards(filePath)) {
    updated += 1;
    console.log("Updated", route);
  }
}

console.log(`Done. ${updated} catalog routes updated.`);
