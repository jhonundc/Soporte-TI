"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  BarChart3,
  Boxes,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IconInput } from "@/components/forms/IconInput";
import { BrandMark } from "@/components/layout/BrandMark";
import { SkipLink } from "@/components/layout/SkipLink";
import { notify } from "@/lib/feedback/toast";

const LOGIN_BG = "/img/hospital-rezola.jpg";

const loginSchema = z.object({
  username: z.string().min(3, "El usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const benefits = [
  { icon: Boxes, text: "Inventario centralizado de bienes, componentes y software" },
  { icon: ShieldCheck, text: "Fichas de soporte y baja con trazabilidad completa" },
  { icon: BarChart3, text: "Reportes y estadísticas para decisiones informadas" },
];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        notify.error(result.error || "No se pudo iniciar sesión");
        return;
      }

      window.location.href = "/";
    } catch {
      notify.error("No se pudo conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <SkipLink />

      <div
        className="fixed inset-0 h-screen w-full bg-cover bg-center bg-no-repeat grayscale-[0.35]"
        style={{ backgroundImage: `url(${LOGIN_BG})` }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 bg-slate-900/35" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <main
          id="main-content"
          tabIndex={-1}
          className="w-full max-w-4xl outline-none"
        >
          <div className="overflow-hidden rounded-2xl border border-white/25 shadow-[0_20px_40px_-12px_rgba(15,23,42,0.22)]">
            <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
              <section
                className="flex flex-col gap-8 bg-sky-900/75 p-8 sm:p-9 lg:p-10"
                aria-label="Información del sistema"
              >
                <BrandMark
                  logoSrc="/logo1.png"
                  textClassName="[&_p:first-child]:text-white [&_p:last-child]:text-sky-100/80"
                />

                <div className="flex max-w-md flex-col gap-7">
                  <div className="space-y-3">
                    <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl sm:leading-snug">
                      Gestión inteligente de activos TI
                    </h1>
                    <p className="text-sm leading-6 text-sky-50/90">
                      Plataforma unificada para soporte técnico e inventario del Hospital Rezola.
                      Diseñada para equipos que necesitan claridad, velocidad y control.
                    </p>
                  </div>

                  <ul className="space-y-3">
                    {benefits.map(({ icon: Icon, text }) => (
                      <li key={text} className="flex items-start gap-3 text-sm leading-5 text-sky-50/85">
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-white/15">
                          <Icon className="size-3.5 text-sky-100" aria-hidden="true" />
                        </span>
                        <span>{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="hidden max-w-md text-xs leading-relaxed text-sky-100/65 lg:block">
                  © 2026 Hospital Rezola — Sistema de Soporte e Inventario TI
                </p>
              </section>

              <section
                className="border-t border-slate-200/70 bg-[#eef1f4] p-8 dark:bg-card sm:p-9 lg:border-t-0 lg:border-l lg:p-10"
                aria-label="Inicio de sesión"
              >
                <div className="w-full max-w-sm space-y-6">
                  <div className="space-y-2">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-800 sm:text-2xl">
                      Bienvenido de nuevo
                    </h2>
                    <p className="text-sm leading-5 text-slate-600">
                      Ingrese sus credenciales para acceder al sistema.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-slate-700">
                        Usuario
                      </Label>
                      <IconInput
                        {...register("username")}
                        id="username"
                        icon={User}
                        type="text"
                        autoComplete="username"
                        placeholder="Ingrese su usuario"
                        className="border-slate-200/90 bg-white"
                        aria-invalid={Boolean(errors.username)}
                        aria-describedby={errors.username ? "username-error" : undefined}
                      />
                      {errors.username ? (
                        <p id="username-error" className="text-xs text-destructive" role="alert">
                          {errors.username.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-700">
                        Contraseña
                      </Label>
                      <div className="relative">
                        <IconInput
                          {...register("password")}
                          id="password"
                          icon={Lock}
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          placeholder="Ingrese su contraseña"
                          className="border-slate-200 bg-white pr-10"
                          aria-invalid={Boolean(errors.password)}
                          aria-describedby={errors.password ? "password-error" : undefined}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                          aria-pressed={showPassword}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" aria-hidden="true" />
                          ) : (
                            <Eye className="size-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                      {errors.password ? (
                        <p id="password-error" className="text-xs text-destructive" role="alert">
                          {errors.password.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1 text-sm">
                      <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                        <Checkbox id="remember" />
                        <span>Recordar sesión</span>
                      </label>
                      <span className="text-xs text-slate-500" aria-disabled="true">
                        Recuperación no disponible
                      </span>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="mt-2 w-full"
                      disabled={isLoading}
                      aria-busy={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          Iniciando sesión...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" aria-hidden="true" />
                          Iniciar sesión
                        </>
                      )}
                    </Button>
                  </form>

                  <p className="pt-2 text-center text-xs leading-relaxed text-slate-500">
                    Acceso restringido al personal autorizado del hospital.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      <p className="fixed bottom-5 left-1/2 z-10 -translate-x-1/2 text-center text-xs text-slate-200 lg:hidden">
        © 2026 Hospital Rezola — Sistema de Soporte e Inventario TI
      </p>
    </div>
  );
}
