import fs from "node:fs";
import path from "node:path";

const root = path.join(process.cwd(), "src/app/api");
const guardImport =
  'import { adminSession, authSession, guardFailed } from "@/lib/auth/guards";';

function ensureImport(content) {
  if (content.includes("authSession")) return content;
  return content.replace(
    'import { executeQuery } from "@/lib/db";',
    `import { executeQuery } from "@/lib/db";\n${guardImport}`
  );
}

function addAuthGet(content) {
  return content
    .replace(
      /export async function GET\(\) \{\n  try \{/g,
      `export async function GET() {\n  const auth = await authSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    )
    .replace(
      /export async function GET\(request: Request\) \{\n  try \{/g,
      `export async function GET(request: Request) {\n  const auth = await authSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    );
}

function addAuthMutations(content) {
  return content
    .replace(
      /export async function POST\(request: Request\) \{\n  try \{/g,
      `export async function POST(request: Request) {\n  const auth = await authSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    )
    .replace(
      /export async function PATCH\(request: Request\) \{\n  try \{/g,
      `export async function PATCH(request: Request) {\n  const auth = await authSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    )
    .replace(
      /export async function DELETE\(request: Request\) \{\n  try \{/g,
      `export async function DELETE(request: Request) {\n  const auth = await authSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    );
}

function addAdminGet(content) {
  return content.replace(
    /export async function GET\(\) \{\n  try \{/g,
    `export async function GET() {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
  );
}

function patchFile(relativePath, transform) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    console.log("Skip missing", relativePath);
    return false;
  }
  const original = fs.readFileSync(filePath, "utf8");
  let content = ensureImport(original);
  content = transform(content);
  if (content === original) {
    console.log("No changes", relativePath);
    return false;
  }
  fs.writeFileSync(filePath, content);
  console.log("Updated", relativePath);
  return true;
}

const authOnlyRoutes = [
  "dashboard/estadisticas/route.ts",
  "soporte/ficha/route.ts",
  "soporte/ficha/buscar/route.ts",
  "soporte/ficha/exportar/route.ts",
  "soporte/baja/route.ts",
  "bienes/exportar/route.ts",
];

for (const route of authOnlyRoutes) {
  patchFile(route, (content) => addAuthMutations(addAuthGet(content)));
}

patchFile("redes/route.ts", (content) => {
  content = addAuthGet(content);
  content = content
    .replace(
      /export async function POST\(request: Request\) \{\n  const auth = await authSession\(\);\n  if \(guardFailed\(auth\)\) return auth;\n\n  try \{/g,
      `export async function POST(request: Request) {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    )
    .replace(
      /export async function PATCH\(request: Request\) \{\n  const auth = await authSession\(\);\n  if \(guardFailed\(auth\)\) return auth;\n\n  try \{/g,
      `export async function PATCH(request: Request) {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    )
    .replace(
      /export async function DELETE\(request: Request\) \{\n  const auth = await authSession\(\);\n  if \(guardFailed\(auth\)\) return auth;\n\n  try \{/g,
      `export async function DELETE(request: Request) {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    );
  return content
    .replace(
      /export async function POST\(request: Request\) \{\n  try \{/g,
      `export async function POST(request: Request) {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    )
    .replace(
      /export async function PATCH\(request: Request\) \{\n  try \{/g,
      `export async function PATCH(request: Request) {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    )
    .replace(
      /export async function DELETE\(request: Request\) \{\n  try \{/g,
      `export async function DELETE(request: Request) {\n  const auth = await adminSession();\n  if (guardFailed(auth)) return auth;\n\n  try {`
    );
});

patchFile("roles/route.ts", addAdminGet);

console.log("P1 routes done.");
