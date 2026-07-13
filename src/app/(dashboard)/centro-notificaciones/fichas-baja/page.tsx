import { PageHeader } from "@/components/layout/PageHeader";

export default function CentroNotificacionesFichasBajaPage() {
  return (
    <main className="space-y-6 px-4 py-6 lg:px-8">
      <PageHeader title="Centro de Notificaciones" />
      <section className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Fichas Baja</h2>
        <p className="mt-2 text-sm text-muted-foreground">Aquí se mostrará el contenido de las fichas de baja en el Centro de Notificaciones.</p>
      </section>
    </main>
  );
}
