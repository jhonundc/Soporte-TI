"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Eye, FileText, PackageCheck, Plus, Printer, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { actaEntregaService } from "@/services/acta-entrega.service";
import { apiFetch } from "@/services/http";
import type { ActaEntrega, ActaPayload } from "./types";
import { ActaEntregaPrintSection } from "./ActaEntregaPrintSection";
import { ActaEntregaDetailDialog } from "./ActaEntregaDetailDialog";

type Bien = { IdBien: number; CodigoInventario?: string; CodigoPatrimonial?: string; Descripcion?: string; NumeroSerie?: string };
type Area = { IdArea: number; NombreArea: string };
const initial = (): ActaPayload => ({ NumeroActa: "", FechaEntrega: new Date().toISOString().slice(0, 10), IdUsuarioEntrega: 0, NombreReceptor: "", CargoReceptor: "", ServicioArea: "", Observaciones: "", EstadoActa: "BORRADOR", Detalles: [] });

const statusClass = (status: string) => {
  const value = status.toUpperCase();
  if (value === "ENTREGADA") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
  if (value === "DEVUELTA") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
  if (value === "ANULADA") return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
  return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
};

export function ActaEntregaPageView({ centroNotificaciones = false }: { centroNotificaciones?: boolean }) {
  const [actas, setActas] = useState<ActaEntrega[]>([]);
  const [bienes, setBienes] = useState<Bien[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [detail, setDetail] = useState<ActaEntrega | null>(null);
  const [detailView, setDetailView] = useState<ActaEntrega | null>(null);
  const [form, setForm] = useState<ActaPayload>(initial());
  const [bienId, setBienId] = useState("");
  const [printOpen, setPrintOpen] = useState(false);
  const [printActa, setPrintActa] = useState<ActaEntrega | null>(null);
  const [evidence, setEvidence] = useState<File | null>(null);
  const [evidencePending, setEvidencePending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setActas(await actaEntregaService.list(centroNotificaciones)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudieron cargar las actas"); }
    finally { setLoading(false); }
  }, [centroNotificaciones]);

  useEffect(() => {
    let active = true;
    actaEntregaService.list(centroNotificaciones)
      .then((data) => { if (active) setActas(data); })
      .catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "No se pudieron cargar las actas"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [centroNotificaciones]);
  useEffect(() => {
    if (centroNotificaciones) return;
    Promise.all([apiFetch<Bien[]>("/api/bienes"), apiFetch<Area[]>("/api/areas")]).then(([b, a]) => { setBienes(b); setAreas(a); }).catch(() => toast.error("No se pudieron cargar los catálogos"));
  }, [centroNotificaciones]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? actas.filter((a) => [a.NumeroActa, a.NombreCreador, a.NombreReceptor, a.AreaReceptor, a.EstadoActa].some((v) => String(v || "").toLowerCase().includes(term))) : actas;
  }, [actas, search]);
  const deliveredCount = actas.filter((acta) => acta.EstadoActa === "ENTREGADA").length;
  const pendingCount = actas.filter((acta) => acta.Activo && acta.EstadoActa === "BORRADOR").length;

  const openDetail = async (id: number) => {
    try { setDetailView(await actaEntregaService.get(id)); } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo consultar el acta"); }
  };
  const openPrint = async (id: number) => {
    try {
      setPrintActa(await actaEntregaService.get(id));
      setPrintOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo preparar el acta");
    }
  };
  const openEdit = async (id: number) => {
    try { const value = await actaEntregaService.get(id); setEvidence(null); setForm({ ...value, FechaEntrega: value.FechaEntrega.slice(0, 10), Detalles: value.Detalles || [] }); setFormOpen(true); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo consultar el acta"); }
  };
  const openNew = async () => {
    try {
      const { NumeroActa } = await actaEntregaService.nextNumber();
      setEvidence(null);
      setForm({ ...initial(), NumeroActa });
      setFormOpen(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo obtener el número de acta");
    }
  };
  const addBien = () => {
    const id = Number(bienId); if (!id || form.Detalles.some((d) => d.IdBien === id)) return;
    setForm((old) => ({ ...old, Detalles: [...old.Detalles, { IdBien: id, ObservacionDetalle: "" }] })); setBienId("");
  };
  const save = async () => {
    if (evidence && !["image/jpeg", "image/png", "image/webp"].includes(evidence.type)) return toast.warning("La evidencia debe ser una imagen JPG, PNG o WEBP.");
    if (evidence && evidence.size > 5 * 1024 * 1024) return toast.warning("La imagen de evidencia no puede superar los 5 MB.");
    try { const result = form.IdActaEntrega ? await actaEntregaService.update(form) : await actaEntregaService.create(form); if (form.IdActaEntrega && evidence) await actaEntregaService.saveEvidence(form.IdActaEntrega, evidence); toast.success(result.Mensaje); setFormOpen(false); setForm(initial()); setEvidence(null); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo guardar"); }
  };
  const deleteEvidence = async () => {
    if (!form.IdActaEntrega || !form.EvidenciaFirma || !window.confirm("¿Eliminar la imagen firmada de esta acta?")) return;
    setEvidencePending(true);
    try { await actaEntregaService.removeEvidence(form.IdActaEntrega); setForm({ ...form, EvidenciaFirma: undefined }); setEvidence(null); toast.success("La imagen firmada fue eliminada."); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo eliminar la imagen"); }
    finally { setEvidencePending(false); }
  };
  const action = async (acta: ActaEntrega, accion: "E" | "V" | "N" | "T") => {
    if (accion === "N" && !window.confirm(`¿Anular el acta ${acta.NumeroActa}?`)) return;
    try { const result = await actaEntregaService.action(acta.IdActaEntrega, accion); toast.success(result.Mensaje); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo realizar la acción"); }
  };

  return <main className="space-y-7 px-4 py-6 lg:px-8">
    <PageHeader title={centroNotificaciones ? "Actas de entrega" : "Registro de actas de entrega"} description={centroNotificaciones ? "Control y seguimiento del ciclo de entrega de bienes institucionales." : "Gestiona la asignación y entrega de bienes a cada receptor."} actions={!centroNotificaciones ? <Button size="lg" className="gap-2 rounded-xl shadow-sm" onClick={openNew}><Plus className="size-4" />Nueva acta</Button> : undefined} />
    <section className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total de actas</p><p className="mt-2 text-3xl font-semibold tracking-tight">{actas.length}</p></div><span className="rounded-xl bg-primary/10 p-3 text-primary"><FileText className="size-5" /></span></div></div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Entregadas</p><p className="mt-2 text-3xl font-semibold tracking-tight text-emerald-600">{deliveredCount}</p></div><span className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600"><PackageCheck className="size-5" /></span></div></div>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">En borrador</p><p className="mt-2 text-3xl font-semibold tracking-tight text-blue-600">{pendingCount}</p></div><span className="rounded-xl bg-blue-500/10 p-3 text-blue-600"><ClipboardList className="size-5" /></span></div></div>
    </section>
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)]">
      <div className="border-b border-border bg-gradient-to-r from-primary/[0.08] via-primary/[0.03] to-transparent px-5 py-5 sm:px-6"><p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{centroNotificaciones ? "Seguimiento de entregas" : "Gestión documental"}</p><div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold tracking-tight">Listado de actas</h2><p className="text-sm text-muted-foreground">Consulta los datos, bienes asociados y estado actual de cada registro.</p></div><span className="text-sm font-medium text-muted-foreground">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</span></div></div>
      <div className="flex flex-col gap-3 border-b border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="relative max-w-xl flex-1"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 rounded-xl bg-background pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por número, creador, receptor, área o estado" /></div><Button className="h-11 rounded-xl" variant="outline" onClick={load}><RefreshCw className="mr-2 size-4" />Actualizar</Button></div>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-muted/40 text-left"><tr className="[&_th]:whitespace-nowrap [&_th]:px-4 [&_th]:py-3.5 [&_th]:text-[11px] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-[0.1em] [&_th]:text-muted-foreground"><th>N.º acta</th><th>Fecha</th><th>Creado por</th><th>Receptor / área</th><th>Bienes</th><th>Estado</th><th className="text-right">Acciones</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Cargando actas...</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="p-12 text-center"><FileText className="mx-auto mb-3 size-9 text-muted-foreground/50" /><p className="font-medium">No se encontraron actas</p><p className="mt-1 text-sm text-muted-foreground">Prueba con otro término de búsqueda.</p></td></tr> : filtered.map((a) => <tr key={a.IdActaEntrega} className="border-t border-border transition-colors hover:bg-muted/30"><td className="px-4 py-4"><span className="inline-flex min-w-10 justify-center rounded-lg bg-primary/10 px-2.5 py-1.5 font-bold text-primary">{a.NumeroActa}</span></td><td className="whitespace-nowrap px-4 py-4 text-muted-foreground">{new Date(a.FechaEntrega).toLocaleDateString("es-PE")}</td><td className="px-4 py-4 font-medium">{a.NombreCreador || "-"}</td><td className="px-4 py-4"><div className="font-medium">{a.NombreReceptor}</div><div className="mt-0.5 text-xs text-muted-foreground">{a.AreaReceptor || a.ServicioArea || "Sin área asignada"}</div></td><td className="px-4 py-4"><span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{a.CantidadBienes ?? 0}</span></td><td className="px-4 py-4"><Badge variant="outline" className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(a.EstadoActa)}`}>{a.EstadoActa}</Badge></td><td className="px-4 py-4"><div className="flex flex-wrap justify-end gap-1.5"><Button size="sm" variant="ghost" className="rounded-lg" title="Ver detalle" onClick={() => openDetail(a.IdActaEntrega)}><Eye className="mr-1.5 size-4" />Ver</Button><Button size="icon-sm" variant="ghost" className="rounded-lg text-primary hover:bg-primary/10 hover:text-primary" title="Imprimir o exportar" onClick={() => openPrint(a.IdActaEntrega)}><Printer className="size-4" /></Button>{!centroNotificaciones && a.Activo ? <Button size="sm" variant="outline" className="rounded-lg" onClick={() => openEdit(a.IdActaEntrega)}>Editar</Button> : null}{a.Activo && a.EstadoActa !== "ENTREGADA" ? <Button size="sm" className="rounded-lg bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => action(a, "E")}>Entregada</Button> : null}{a.Activo && a.EstadoActa !== "DEVUELTA" ? <Button size="sm" variant="outline" className="rounded-lg border-amber-300 text-amber-700 hover:bg-amber-50" onClick={() => action(a, "V")}>Devuelta</Button> : null}{a.Activo ? <Button size="sm" variant="ghost" className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive" title="Anular acta" onClick={() => action(a, "N")}><Trash2 className="size-4" /></Button> : <Button size="sm" variant="outline" className="rounded-lg" onClick={() => action(a, "T")}>Reactivar</Button>}</div></td></tr>)}
      </tbody></table></div>
    </section>

    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="max-h-[92vh] gap-0 overflow-hidden rounded-2xl border border-border p-0 sm:max-w-4xl"><DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-primary/10 p-2.5 text-primary"><FileText className="size-5" /></span><div><DialogTitle className="text-xl">{form.IdActaEntrega ? "Editar acta" : "Nueva acta de entrega"}</DialogTitle><DialogDescription className="mt-1">Complete los datos del receptor y agregue los bienes entregados.</DialogDescription></div></div></DialogHeader><div className="grid max-h-[calc(92vh-10rem)] gap-5 overflow-y-auto px-6 py-5 sm:grid-cols-2 [&_label]:mb-2 [&_label]:block [&_label]:text-sm [&_label]:font-semibold">
      <div><Label>Número de acta</Label><Input value={form.NumeroActa} readOnly disabled className="font-medium" /></div><div><Label>Fecha de entrega *</Label><Input type="date" value={form.FechaEntrega} onChange={(e) => setForm({ ...form, FechaEntrega: e.target.value })} /></div><div><Label>Nombre del receptor *</Label><Input value={form.NombreReceptor} onChange={(e) => setForm({ ...form, NombreReceptor: e.target.value })} /></div><div><Label>Cargo</Label><Input value={form.CargoReceptor || ""} onChange={(e) => setForm({ ...form, CargoReceptor: e.target.value })} /></div><div><Label>Área receptora</Label><select className="h-10 w-full rounded-md border bg-background px-3" value={form.IdAreaReceptor || ""} onChange={(e) => setForm({ ...form, IdAreaReceptor: e.target.value ? Number(e.target.value) : undefined })}><option value="">Seleccione</option>{areas.map((a) => <option key={a.IdArea} value={a.IdArea}>{a.NombreArea}</option>)}</select></div><div><Label>Servicio / ambiente</Label><Input value={form.ServicioArea || ""} onChange={(e) => setForm({ ...form, ServicioArea: e.target.value })} /></div><div className="sm:col-span-2"><Label>Observaciones</Label><Textarea value={form.Observaciones || ""} onChange={(e) => setForm({ ...form, Observaciones: e.target.value })} /></div>
      <div className="space-y-4 rounded-2xl border border-primary/15 bg-primary/[0.025] p-5 sm:col-span-2"><div className="flex items-center justify-between"><div><Label>Bienes incluidos *</Label><p className="text-xs text-muted-foreground">Busca por código patrimonial y agrega los bienes que serán entregados.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{form.Detalles.length} bien{form.Detalles.length === 1 ? "" : "es"}</span></div><div className="flex gap-2"><SearchableSelect className="min-w-0 flex-1" value={bienId} onValueChange={setBienId} placeholder="Escriba el código patrimonial para buscar..." emptyMessage="No se encontró un bien con ese código" options={bienes.filter((b) => !form.Detalles.some((d) => d.IdBien === b.IdBien)).map((b) => ({ value: String(b.IdBien), label: `${b.CodigoPatrimonial || "Sin código patrimonial"} — ${b.Descripcion || "Sin descripción"}${b.CodigoInventario ? ` · Inv. ${b.CodigoInventario}` : ""}` }))} /><Button type="button" className="rounded-lg" variant="outline" onClick={addBien} disabled={!bienId}>Agregar</Button></div>{form.Detalles.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-card/60 px-4 py-8 text-center"><PackageCheck className="mx-auto mb-2 size-7 text-muted-foreground/50" /><p className="text-sm text-muted-foreground">Aún no se agregaron bienes al acta.</p></div> : form.Detalles.map((d, index) => { const b = bienes.find((x) => x.IdBien === d.IdBien); return <div key={d.IdBien} className="grid items-center gap-3 rounded-xl border border-border bg-card p-3.5 shadow-sm sm:grid-cols-[1fr_1fr_auto]"><div className="text-sm"><b className="text-primary">{b?.CodigoPatrimonial || b?.CodigoInventario || `Bien ${d.IdBien}`}</b><div className="mt-0.5 text-muted-foreground">{b?.Descripcion || d.Descripcion}</div></div><Input className="bg-background" placeholder="Observación del bien" value={d.ObservacionDetalle || ""} onChange={(e) => setForm({ ...form, Detalles: form.Detalles.map((x, i) => i === index ? { ...x, ObservacionDetalle: e.target.value } : x) })} /><Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" title="Quitar bien" onClick={() => setForm({ ...form, Detalles: form.Detalles.filter((_, i) => i !== index) })}><Trash2 className="size-4" /></Button></div>; })}</div>
      {form.IdActaEntrega ? <div className="rounded-2xl border border-primary/15 bg-primary/[0.025] p-5 sm:col-span-2"><Label>Imagen firmada</Label><p className="mb-3 text-xs text-muted-foreground">JPG, PNG o WEBP, hasta 5 MB. Solo se puede adjuntar al editar.</p><Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setEvidence(event.target.files?.[0] ?? null)} className="cursor-pointer bg-background" />{evidence ? <p className="mt-2 text-xs font-medium text-primary">Seleccionada: {evidence.name}</p> : null}{form.EvidenciaFirma ? <Button type="button" size="sm" variant="destructive" className="mt-4 gap-2" disabled={evidencePending} onClick={deleteEvidence}><Trash2 className="size-4" />{evidencePending ? "Eliminando..." : "Eliminar imagen actual"}</Button> : null}</div> : null}
    </div><DialogFooter className="border-t border-border bg-muted/20 px-6 py-4"><Button className="rounded-lg" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button><Button className="rounded-lg px-6" onClick={save}>Guardar acta</Button></DialogFooter></DialogContent></Dialog>

    <ActaEntregaPrintSection open={printOpen} onOpenChange={setPrintOpen} acta={printActa} />

    <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}><DialogContent className="max-h-[90vh] gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl"><DialogHeader className="border-b border-primary/10 bg-gradient-to-r from-primary/10 via-primary/5 to-card px-6 py-5"><div className="flex items-center justify-between gap-3"><div><p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-primary">Documento de entrega</p><DialogTitle className="text-xl">Acta N.º {detail?.NumeroActa}</DialogTitle><DialogDescription className="mt-1">Detalle completo del registro y sus bienes asociados.</DialogDescription></div>{detail ? <Badge variant="outline" className={`rounded-full px-3 py-1.5 font-bold ${statusClass(detail.EstadoActa)}`}>{detail.EstadoActa}</Badge> : null}</div></DialogHeader>{detail ? <div className="max-h-[calc(90vh-11rem)] space-y-5 overflow-y-auto px-6 py-5 text-sm"><section><h3 className="mb-3 inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">Información general</h3><div className="grid gap-3 sm:grid-cols-2 [&>p]:rounded-xl [&>p]:bg-primary/[0.045] [&>p]:px-4 [&>p]:py-3.5 [&>p>b]:mb-1.5 [&>p>b]:block [&>p>b]:text-[11px] [&>p>b]:uppercase [&>p>b]:tracking-wide [&>p>b]:text-primary"><p><b>Fecha de entrega</b>{new Date(detail.FechaEntrega).toLocaleString("es-PE")}</p><p><b>Creado por</b>{detail.NombreCreador || "-"}</p><p><b>Receptor</b>{detail.NombreReceptor}</p><p><b>Cargo</b>{detail.CargoReceptor || "-"}</p><p><b>Área receptora</b>{detail.AreaReceptor || "-"}</p><p><b>Servicio / ambiente</b>{detail.ServicioArea || "-"}</p></div></section><section><h3 className="mb-2 inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">Observaciones</h3><p className="rounded-xl bg-primary/[0.045] p-4 leading-6">{detail.Observaciones || "Sin observaciones"}</p></section><section><div className="mb-3 flex items-center justify-between"><h3 className="inline-flex rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-primary">Bienes entregados</h3><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">{detail.Detalles?.length || 0}</span></div>{detail.Detalles?.map((d) => <div key={d.IdActaEntregaDetalle || d.IdBien} className="mb-2 rounded-xl border border-primary/10 bg-primary/[0.025] p-4 shadow-sm"><b className="text-primary">{d.CodigoPatrimonial || d.CodigoInventario || `Bien ${d.IdBien}`}</b><span className="text-muted-foreground"> — {d.Descripcion}</span><div className="mt-1 text-xs text-muted-foreground">Serie: {d.NumeroSerie || "-"} · {d.Marca || ""} {d.Modelo || ""}</div>{d.ObservacionDetalle ? <p className="mt-3 rounded-lg bg-primary/[0.05] px-3 py-2 text-sm">{d.ObservacionDetalle}</p> : null}</div>)}</section></div> : null}<DialogFooter className="border-t border-border bg-muted/20 px-6 py-4"><Button className="rounded-lg" variant="outline" onClick={() => setDetail(null)}>Cerrar</Button></DialogFooter></DialogContent></Dialog>
    <ActaEntregaDetailDialog acta={detailView} onClose={() => setDetailView(null)} statusClass={statusClass} />
  </main>;
}
