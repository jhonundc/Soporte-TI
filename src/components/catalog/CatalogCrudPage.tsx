"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Edit, Eye, Plus, Power, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-display/DataTable";
import { TableRowActions, TableActionButton } from "@/components/data-display/TableRowActions";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { notify } from "@/lib/feedback/toast";
import type { CatalogCrudConfig } from "@/lib/catalogs/configs";
import { catalogService } from "@/services/catalog.service";

interface CatalogCrudPageProps {
  config: CatalogCrudConfig;
}

async function fetchCatalog(apiPath: string) {
  return catalogService.list(apiPath);
}

function defaultFormValues(
  config: CatalogCrudConfig,
  item: Record<string, unknown> | null
): Record<string, string> {
  if (config.getFormValues) return config.getFormValues(item);
  const values: Record<string, string> = {};
  for (const field of config.fields) {
    values[field.name] = item ? String(item[field.name] ?? "") : "";
  }
  return values;
}

export function CatalogCrudPage({ config }: CatalogCrudPageProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: "delete"; id: number }
    | { type: "toggle"; item: Record<string, unknown> }
    | null
  >(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Record<string, string>>();

  const { data, isLoading, error } = useQuery({
    queryKey: config.queryKey,
    queryFn: () => fetchCatalog(config.apiPath),
  });

  useEffect(() => {
    if (!open) {
      reset(defaultFormValues(config, null));
      return;
    }
    reset(defaultFormValues(config, editingItem));
  }, [open, editingItem, reset, config]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: config.queryKey });

  const saveMutation = useMutation({
    mutationFn: async (formData: Record<string, string>) => {
      const isEdit = Boolean(editingItem);
      const body = isEdit
        ? (config.buildUpdateBody?.(formData, editingItem!) ?? {
            ...formData,
            [config.idField]: editingItem![config.idField],
          })
        : (config.buildCreateBody?.(formData) ?? formData);

      if (isEdit) {
        return catalogService.update(config.apiPath, body);
      }
      return catalogService.create(config.apiPath, body);
    },
    onSuccess: () => {
      invalidate();
      closeDialog();
      notify.success(
        editingItem
          ? `${config.entityLabel.charAt(0).toUpperCase()}${config.entityLabel.slice(1)} actualizado`
          : `${config.entityLabel.charAt(0).toUpperCase()}${config.entityLabel.slice(1)} creado`
      );
    },
    onError: (err) =>
      notify.fromError(err, `No se pudo guardar ${config.entityLabel}`),
  });

  const toggleMutation = useMutation({
    mutationFn: async (item: Record<string, unknown>) => {
      const body = {
        [config.idField]: item[config.idField],
        Activo: !item.Activo,
      };
      return catalogService.update(config.apiPath, body);
    },
    onSuccess: () => invalidate(),
    onError: (err) =>
      notify.fromError(err, `No se pudo cambiar el estado de ${config.entityLabel}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => catalogService.remove(config.apiPath, id),
    onSuccess: () => {
      invalidate();
      notify.success(`${config.entityLabel.charAt(0).toUpperCase()}${config.entityLabel.slice(1)} desactivado`);
    },
    onError: (err) =>
      notify.fromError(err, `No se pudo desactivar ${config.entityLabel}`),
  });

  const closeDialog = () => {
    setOpen(false);
    setEditingItem(null);
    setReadOnly(false);
  };

  const openCreate = () => {
    setEditingItem(null);
    setReadOnly(false);
    setOpen(true);
  };

  const openEdit = (item: Record<string, unknown>) => {
    setEditingItem(item);
    setReadOnly(false);
    setOpen(true);
  };

  const openView = (item: Record<string, unknown>) => {
    setEditingItem(item);
    setReadOnly(true);
    setOpen(true);
  };

  const handleToggle = (item: Record<string, unknown>) => {
    setPendingAction({ type: "toggle", item });
  };

  const handleDelete = (id: number) => {
    setPendingAction({ type: "delete", id });
  };

  const confirmDialogProps =
    pendingAction?.type === "delete"
      ? {
          title: "Confirmar baja",
          description: `¿Está seguro de dar de baja este ${config.entityLabel}?`,
          variant: "destructive" as const,
          confirmLabel: "Dar de baja",
          onConfirm: async () => {
            deleteMutation.mutate(pendingAction.id);
            setPendingAction(null);
          },
        }
      : pendingAction?.type === "toggle"
        ? {
            title: "Confirmar cambio de estado",
            description: `¿Está seguro de ${
              pendingAction.item.Activo ? "desactivar" : "activar"
            } este ${config.entityLabel}?`,
            variant: "default" as const,
            confirmLabel: pendingAction.item.Activo ? "Desactivar" : "Activar",
            onConfirm: async () => {
              toggleMutation.mutate(pendingAction.item);
              setPendingAction(null);
            },
          }
        : null;

  const tableFieldNames = config.tableFields ?? config.fields.map((f) => f.name);

  const columns = useMemo<ColumnDef<Record<string, unknown>>[]>(() => {
    const baseColumns: ColumnDef<Record<string, unknown>>[] = tableFieldNames.map((name) => {
      const field = config.fields.find((f) => f.name === name);
      return {
        accessorKey: name,
        header: field?.label ?? name,
        cell: ({ getValue }) => (
          <span className={name === tableFieldNames[0] ? "font-medium text-foreground" : "text-muted-foreground"}>
            {String(getValue() ?? "-") || "-"}
          </span>
        ),
      };
    });

    if (config.showStatusColumn) {
      baseColumns.push({
        accessorKey: "Activo",
        header: "Estado",
        cell: ({ getValue }) => <StatusBadge active={getValue() as boolean} />,
      });
    }

    baseColumns.push({
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const item = row.original;
        const id = Number(item[config.idField]);
        return (
          <TableRowActions>
            {config.enableView ? (
              <TableActionButton
                aria-label="Ver detalle"
                title="Ver detalle"
                onClick={() => openView(item)}
              >
                <Eye className="size-4" />
              </TableActionButton>
            ) : null}
            <TableActionButton
              actionVariant="primary"
              aria-label="Editar"
              title="Editar"
              onClick={() => openEdit(item)}
            >
              <Edit className="size-4" />
            </TableActionButton>
            {config.enableToggle ? (
              <TableActionButton
                actionVariant="warning"
                aria-label={item.Activo ? "Desactivar" : "Activar"}
                title={item.Activo ? "Desactivar" : "Activar"}
                onClick={() => handleToggle(item)}
              >
                <Power className="size-4" />
              </TableActionButton>
            ) : null}
            {config.enableDelete ? (
              <TableActionButton
                actionVariant="destructive"
                aria-label="Dar de baja"
                title="Dar de baja"
                onClick={() => handleDelete(id)}
              >
                <Trash2 className="size-4" />
              </TableActionButton>
            ) : null}
          </TableRowActions>
        );
      },
    });

    return baseColumns;
  }, [config, tableFieldNames]);

  const onSubmit = (formData: Record<string, string>) => {
    if (readOnly) return;
    saveMutation.mutate(formData);
  };

  const dialogTitle = readOnly
    ? `Detalle del ${config.entityLabel}`
    : editingItem
      ? `Editar ${config.entityLabel}`
      : `Agregar ${config.entityLabel}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <Button size="lg" className="gap-2" onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            {config.newButtonLabel ?? "Nuevo"}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        error={error as Error | null}
        emptyMessage={config.emptyMessage ?? "No hay registros."}
        getRowClassName={(row) =>
          config.showStatusColumn && !row.original.Activo
            ? "text-muted-foreground opacity-75"
            : undefined
        }
      />

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeDialog();
          else setOpen(true);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold capitalize">
              {dialogTitle}
            </DialogTitle>
          </DialogHeader>

          {readOnly ? (
            <div className="mt-4 space-y-4">
              {config.fields.map((field) => (
                <div key={field.name}>
                  <p className="text-sm text-muted-foreground">{field.label}</p>
                  <p className="mt-1 text-base text-foreground">
                    {String(editingItem?.[field.name] ?? "-") || "-"}
                  </p>
                </div>
              ))}
              <div className="mt-6 flex justify-end">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
              {config.fields.map((field) => (
                <div key={field.name} className="space-y-1">
                  <label htmlFor={`catalog-${field.name}`} className="text-sm font-medium text-foreground">
                    {field.label}
                    {field.required ? " *" : ""}
                  </label>
                  <Input
                    id={`catalog-${field.name}`}
                    {...register(field.name, field.required ? { required: field.required } : {})}
                    placeholder={field.placeholder}
                    aria-invalid={Boolean(errors[field.name])}
                    aria-describedby={errors[field.name] ? `catalog-${field.name}-error` : undefined}
                  />
                  {errors[field.name] ? (
                    <p id={`catalog-${field.name}-error`} className="text-xs text-destructive" role="alert">
                      {String(errors[field.name]?.message)}
                    </p>
                  ) : null}
                </div>
              ))}
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? "Guardando..." : editingItem ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {confirmDialogProps ? (
        <ConfirmDialog
          open={Boolean(pendingAction)}
          onOpenChange={(open) => {
            if (!open) setPendingAction(null);
          }}
          title={confirmDialogProps.title}
          description={confirmDialogProps.description}
          variant={confirmDialogProps.variant}
          confirmLabel={confirmDialogProps.confirmLabel}
          loading={deleteMutation.isPending || toggleMutation.isPending}
          onConfirm={confirmDialogProps.onConfirm}
        />
      ) : null}
    </div>
  );
}
