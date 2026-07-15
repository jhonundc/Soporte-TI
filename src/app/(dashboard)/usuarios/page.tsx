"use client";

import { useState, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Edit,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Power,
  ShieldCheck,
  KeyRound,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  UserX,
} from "lucide-react";
import { notify } from "@/lib/feedback/toast";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { DataTable } from "@/components/data-display/DataTable";
import { StatCard } from "@/components/data-display/StatCard";
import { TableRowActions, TableActionButton } from "@/components/data-display/TableRowActions";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconInput } from "@/components/forms/IconInput";
import { queryKeys } from "@/lib/query-keys";
import { usuariosService } from "@/services/usuarios.service";
import { exportStyledReportExcel } from "@/lib/export/styled-report-excel";

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function UsuariosPage() {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<any>();

  // QUERIES
  const { data: usuarios, isLoading } = useQuery({
    queryKey: queryKeys.usuarios.all(),
    queryFn: usuariosService.list,
  });

  const { data: roles } = useQuery({
    queryKey: queryKeys.roles.all(),
    queryFn: usuariosService.roles,
  });

  const { data: sessionData } = useQuery({
    queryKey: queryKeys.session(),
    queryFn: fetchSessionClient,
  });

  const userRole = sessionData?.user?.role?.toLowerCase() || "";
  const isAdmin = userRole === "admin";

  // MUTATIONS
  const saveUsuarioMutation = useMutation({
    mutationFn: async (data: any) => {
      const isEditing = !!editingUser;
      const bodyData = { ...data };

      if (isEditing) {
        bodyData.IdUsuario = editingUser.IdUsuario;
        bodyData.Activo = data.Activo === true || data.Activo === "true";
        return usuariosService.update(bodyData);
      }
      return usuariosService.create(bodyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all() });
      reset();
      setEditingUser(null);
      setOpen(false);
    },
  });

  const deleteUsuarioMutation = useMutation({
    mutationFn: (id: number) => usuariosService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all() });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (user: any) =>
      usuariosService.update({
        IdUsuario: user.IdUsuario,
        Usuario: user.Usuario,
        Nombres: user.Nombres,
        Cargo: user.Cargo,
        IdRol: user.IdRol,
        Activo: !user.Activo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.usuarios.all() });
    },
  });

  // HANDLERS
  const handleOpenNew = () => {
    reset({
      Usuario: "",
      Nombres: "",
      Cargo: "",
      Clave: "",
      IdRol: "",
      Activo: true,
    });
    setEditingUser(null);
    setOpen(true);
  };

  const handleEdit = (user: any) => {
    reset({
      Usuario: user.Usuario,
      Nombres: user.Nombres,
      Cargo: user.Cargo || "",
      IdRol: String(user.IdRol),
      Activo: user.Activo,
    });
    setEditingUser(user);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Está seguro de eliminar este usuario permanentemente?")) {
      try {
        await deleteUsuarioMutation.mutateAsync(id);
      } catch (error: any) {
        notify.error(error.message);
      }
    }
  };

  const handleToggleStatus = async (user: any) => {
    const action = user.Activo ? "desactivar" : "activar";
    if (confirm(`¿Está seguro de ${action} a este usuario?`)) {
      try {
        await toggleStatusMutation.mutateAsync(user);
      } catch (error: any) {
        notify.error(error.message);
      }
    }
  };

  const onSubmit = async (data: any) => {
    if (!editingUser && !data.Clave) {
      notify.warning("La contraseña es requerida para usuarios nuevos.");
      return;
    }
    try {
      await saveUsuarioMutation.mutateAsync(data);
    } catch (error: any) {
      notify.error(error.message);
    }
  };

  const exportToExcel = async () => {
    if (!usuarios || usuarios.length === 0) {
      notify.warning("No hay usuarios para exportar");
      return;
    }
    
    try {
      await exportStyledReportExcel({
        title: "Listado de usuarios",
        sheetName: "Usuarios",
        filename: `Usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`,
        filters: searchTerm.trim() ? [`Búsqueda: ${searchTerm.trim()}`] : [],
        columns: [
          { header: "ID", key: "id", width: 10 },
          { header: "Usuario", key: "usuario", width: 20 },
          { header: "Nombres y apellidos", key: "nombres", width: 34 },
          { header: "Cargo", key: "cargo", width: 28 },
          { header: "Rol", key: "rol", width: 22 },
          { header: "Estado", key: "estado", width: 15 },
          { header: "Fecha de creación", key: "fecha", width: 21 },
        ],
        rows: filteredUsuarios.map((usuario: any) => ({
          id: usuario.IdUsuario,
          usuario: usuario.Usuario,
          nombres: usuario.Nombres,
          cargo: usuario.Cargo || "N/A",
          rol: usuario.NombreRol,
          estado: usuario.Activo ? "Activo" : "Inactivo",
          fecha: usuario.FechaCreacion ? new Date(usuario.FechaCreacion).toLocaleDateString("es-PE") : "",
        })),
      });
      notify.success("Listado de usuarios exportado correctamente.");
    } catch (error) {
      notify.fromError(error, "No se pudo exportar el listado de usuarios.");
    }
  };

  // FILTERS
  const filteredUsuarios = useMemo(() => {
    if (!usuarios) return [];
    if (!searchTerm) return usuarios;
    const term = searchTerm.toLowerCase();
    return usuarios.filter(
      (u: any) =>
        u.Usuario.toLowerCase().includes(term) ||
        u.Nombres.toLowerCase().includes(term) ||
        (u.Cargo && u.Cargo.toLowerCase().includes(term)) ||
        u.NombreRol.toLowerCase().includes(term)
    );
  }, [usuarios, searchTerm]);

  const userStats = useMemo(() => {
    const allUsers = usuarios ?? [];
    const activeUsers = allUsers.filter((user) => user.Activo);
    const rolesInUse = new Set(
      allUsers.map((user) => String(user.NombreRol || "").trim()).filter(Boolean)
    );

    return {
      total: allUsers.length,
      active: activeUsers.length,
      inactive: allUsers.length - activeUsers.length,
      roles: rolesInUse.size,
    };
  }, [usuarios]);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "Usuario",
        header: "Usuario",
        cell: ({ row, getValue }) => {
          const username = String(getValue() || "-");
          const fullName = String(row.original.Nombres || username);
          return (
            <div className="flex min-w-44 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {getInitials(fullName) || "U"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">{username}</p>
                <p className="text-xs text-muted-foreground">ID #{row.original.IdUsuario}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "Nombres",
        header: "Nombres",
        cell: ({ getValue }) => <span className="text-muted-foreground">{String(getValue() || "-")}</span>,
      },
      {
        accessorKey: "Cargo",
        header: "Cargo",
        cell: ({ getValue }) => <span className="text-muted-foreground/80">{String(getValue() || "-")}</span>,
      },
      {
        accessorKey: "NombreRol",
        header: "Rol",
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="size-3" aria-hidden="true" />
            {String(getValue() || "-")}
          </span>
        ),
      },
      {
        accessorKey: "Activo",
        header: "Estado",
        cell: ({ getValue }) => <StatusBadge active={getValue() as boolean} />,
      },
      {
        id: "actions",
        header: "Acciones",
        cell: ({ row }) => {
          const user = row.original;
          return (
            <TableRowActions>
              <TableActionButton
                actionVariant="warning"
                title={user.Activo ? "Desactivar" : "Activar"}
                aria-label={user.Activo ? "Desactivar usuario" : "Activar usuario"}
                onClick={() => handleToggleStatus(user)}
              >
                <Power className="size-4" />
              </TableActionButton>
              <TableActionButton
                actionVariant="primary"
                title="Editar"
                aria-label="Editar usuario"
                onClick={() => handleEdit(user)}
              >
                <Edit className="size-4" />
              </TableActionButton>
              {isAdmin ? (
                <TableActionButton
                  actionVariant="destructive"
                  title="Eliminar"
                  aria-label="Eliminar usuario"
                  onClick={() => handleDelete(user.IdUsuario)}
                >
                  <Trash2 className="size-4" />
                </TableActionButton>
              ) : null}
            </TableRowActions>
          );
        },
      },
    ],
    [isAdmin]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestión de Usuarios"
        description="Crea, edita y administra los accesos al sistema."
        actions={
          <>
            <Button variant="outline" onClick={exportToExcel} className="gap-2">
              <FileSpreadsheet className="size-4 text-success" aria-hidden="true" />
              Exportar
            </Button>
            <Button onClick={handleOpenNew} className="gap-2" size="lg">
              <Plus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen de usuarios">
        <StatCard title="Usuarios registrados" value={userStats.total} icon={Users} accent="primary" />
        <StatCard title="Cuentas activas" value={userStats.active} icon={UserCheck} accent="success" />
        <StatCard title="Cuentas inactivas" value={userStats.inactive} icon={UserX} accent="destructive" />
        <StatCard title="Roles en uso" value={userStats.roles} icon={UserRound} accent="warning" />
      </section>

      <DataTable
        columns={columns}
        data={filteredUsuarios}
        isLoading={isLoading}
        emptyMessage="No se encontraron usuarios"
        loadingMessage="Cargando usuarios..."
        getRowClassName={(row) =>
          !row.original.Activo ? "text-muted-foreground opacity-75" : undefined
        }
        toolbar={
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <IconInput
              icon={Search}
              placeholder="Buscar por usuario, nombre, cargo o rol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              containerClassName="w-full sm:max-w-md"
            />
            <p className="shrink-0 text-sm text-muted-foreground" aria-live="polite">
              Mostrando <span className="font-semibold text-foreground">{filteredUsuarios.length}</span> de{" "}
              <span className="font-semibold text-foreground">{userStats.total}</span> usuarios
            </p>
          </div>
        }
        footer={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{userStats.active} cuentas activas</span>
            <span className="hidden text-border sm:inline" aria-hidden="true">•</span>
            <span>{userStats.inactive} cuentas inactivas</span>
          </div>
        }
      />

      {/* Modal Formulario */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden gap-0 p-0 sm:max-w-[520px]">
          <DialogHeader className="border-b border-border bg-gradient-to-br from-primary/10 via-card to-card px-6 py-6 text-left">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
                {editingUser ? <UserRound className="size-5" aria-hidden="true" /> : <UserPlus className="size-5" aria-hidden="true" />}
              </span>
              <div className="space-y-1">
                <DialogTitle className="text-lg">
                  {editingUser ? "Editar usuario" : "Nuevo usuario"}
                </DialogTitle>
                <DialogDescription className="leading-6">
                  {editingUser
                    ? "Actualiza la información del acceso. La contraseña se conserva si la dejas vacía."
                    : "Completa la información para crear un acceso seguro al sistema."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="Usuario">Usuario de acceso</Label>
                <Input
                  id="Usuario"
                  {...register("Usuario", { required: true })}
                  className={errors.Usuario ? "h-10 border-destructive" : "h-10"}
                  placeholder="ej. jdoe"
                  disabled={!!editingUser}
                />
                <p className="text-xs text-muted-foreground">
                  {editingUser ? "El usuario de acceso no se puede modificar." : "Se usará para iniciar sesión."}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="Cargo">Cargo</Label>
                <Input
                  id="Cargo"
                  {...register("Cargo")}
                  className="h-10"
                  placeholder="ej. Técnico de soporte"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="Nombres">Nombres y apellidos</Label>
              <Input
                id="Nombres"
                {...register("Nombres", { required: true })}
                className={errors.Nombres ? "h-10 border-destructive" : "h-10"}
                placeholder="Nombre completo del usuario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="IdRol">Rol</Label>
              <Select
                value={watch("IdRol")}
                onValueChange={(val) => setValue("IdRol", val, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.IdRol ? "h-10 border-destructive" : "h-10"}>
                  <SelectValue placeholder="Seleccione un rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r: any) => (
                    <SelectItem key={r.IdRol} value={String(r.IdRol)}>
                      {r.NombreRol.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border bg-muted/35 p-4">
              <div className="mb-3 flex items-center gap-2">
                <KeyRound className="size-4 text-primary" aria-hidden="true" />
                <Label htmlFor="Clave">Contraseña</Label>
              </div>
              <Input
                id="Clave"
                type="password"
                {...register("Clave")}
                className="h-10 bg-card"
                placeholder={editingUser ? "Dejar vacía para conservar la actual" : "Ingresa una contraseña segura"}
              />
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {editingUser
                  ? "Solo se actualizará si ingresas una nueva contraseña."
                  : "La contraseña es requerida para crear el usuario."}
              </p>
            </div>

            <DialogFooter className="-mx-6 -mb-6 mt-1 border-t border-border bg-muted/25 px-6 py-4 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveUsuarioMutation.isPending}>
                {saveUsuarioMutation.isPending ? "Guardando..." : editingUser ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
