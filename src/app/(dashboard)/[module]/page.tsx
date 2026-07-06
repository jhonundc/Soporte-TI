import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

interface PageProps {
  params: Promise<{ module: string }>;
}

export default async function ModulePage({ params }: PageProps) {
  const { module } = await params;
  const title = module.charAt(0).toUpperCase() + module.slice(1);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Módulo de ${title}`}
        description="Esta sección está actualmente en construcción."
      />

      <Card className="border-border shadow-[var(--shadow-soft)]">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Próximamente</CardTitle>
          <CardDescription>
            Aquí se implementará el CRUD y las funcionalidades para el módulo de {module}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Mientras tanto, utiliza las secciones disponibles del menú lateral.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
