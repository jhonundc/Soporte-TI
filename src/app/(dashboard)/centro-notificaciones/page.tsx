import { PageHeader } from "@/components/layout/PageHeader";

export default function CentroNotificacionesPage() {
  return (
    <main className="space-y-6 px-4 py-6 lg:px-8">
      <PageHeader title="Centro de Notificaciones" />
      <section className="rounded-lg border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Aquí irá el contenido del Centro de Notificaciones.</p>
      </section>
    </main>
  );
}
