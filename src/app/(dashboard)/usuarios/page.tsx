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

import { Edit, FileSpreadsheet, Plus, Search, Trash2, Power } from "lucide-react";
import { notify } from "@/lib/feedback/toast";
import { fetchSessionClient } from "@/lib/auth/session-client";
import { DataTable } from "@/components/data-display/DataTable";
import { TableRowActions, TableActionButton } from "@/components/data-display/TableRowActions";
import { StatusBadge } from "@/components/data-display/StatusBadge";
import { PageHeader } from "@/components/layout/PageHeader";
import { IconInput } from "@/components/forms/IconInput";
import { queryKeys } from "@/lib/query-keys";
import { usuariosService } from "@/services/usuarios.service";

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
    
    const XLSX = await import("xlsx");
    
    const dataToExport = filteredUsuarios.map((u: any) => ({
      ID: u.IdUsuario,
      Usuario: u.Usuario,
      Nombres: u.Nombres,
      Cargo: u.Cargo || "N/A",
      Rol: u.NombreRol,
      Estado: u.Activo ? "Activo" : "Inactivo",
      "Fecha Creación": u.FechaCreacion ? new Date(u.FechaCreacion).toLocaleDateString() : ""
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Usuarios");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });

    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Usuarios_${new Date().toISOString().slice(0, 10)}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
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

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "Usuario",
        header: "Usuario",
        cell: ({ getValue }) => (
          <span className="font-medium text-foreground">{String(getValue() || "-")}</span>
        ),
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
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
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
          <IconInput
            icon={Search}
            placeholder="Buscar por usuario, nombre, rol..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="max-w-sm"
          />
        }
      />

      {/* Modal Formulario */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
            </DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Modifica los datos del usuario. Si dejas la contraseña en blanco, no se cambiará."
                : "Ingresa los datos para registrar un nuevo usuario."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="Usuario">Nombre de Usuario (Login)</Label>
              <Input
                id="Usuario"
                {...register("Usuario", { required: true })}
                className={errors.Usuario ? "border-red-500" : ""}
                placeholder="ej: jdoe"
                disabled={!!editingUser}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Nombres">Nombres y Apellidos completos</Label>
              <Input
                id="Nombres"
                {...register("Nombres", { required: true })}
                className={errors.Nombres ? "border-red-500" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="Cargo">Cargo</Label>
              <Input
                id="Cargo"
                {...register("Cargo")}
                placeholder="ej: Técnico Soporte"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="IdRol">Rol</Label>
              <Select
                value={watch("IdRol")}
                onValueChange={(val) => setValue("IdRol", val, { shouldValidate: true })}
              >
                <SelectTrigger className={errors.IdRol ? "border-red-500" : ""}>
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

            <div className="space-y-2">
              <Label htmlFor="Clave">Contraseña</Label>
              <Input
                id="Clave"
                type="password"
                {...register("Clave")}
                placeholder={editingUser ? "Dejar en blanco para mantener actual" : "Requerido"}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveUsuarioMutation.isPending}>
                {saveUsuarioMutation.isPending ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
