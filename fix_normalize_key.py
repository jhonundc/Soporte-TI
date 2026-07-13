from pathlib import Path

path = Path('src/app/api/componentes/importar/bienes/route.ts')
text = path.read_text(encoding='utf-8')
start = text.index('function normalizeKey')
end = text.index('function buildComponentNameMap')
replacement = '''function normalizeKey(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase();
}

'''
new_text = text[:start] + replacement + text[end:]
path.write_text(new_text, encoding='utf-8')
print('done')
