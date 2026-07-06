"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Boxes, Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type DashboardChartData = {
  monthlyChartData: Array<{ label: string; Fichas: number }>;
  ticketStatusData: Array<{ name: string; value: number; color?: string }>;
  dailyChartData: Array<{ fecha: string; cantidad: number }>;
  areaChartData: Array<{ name: string; value: number }>;
};

import { chartPalette } from "@/components/data-display/StatCard";

const COLORS = [
  chartPalette.success,
  chartPalette.destructive,
  chartPalette.muted,
];

export function DashboardCharts({
  monthlyChartData,
  ticketStatusData,
  dailyChartData,
  areaChartData,
}: DashboardChartData) {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-[var(--shadow-soft)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Calendar className="size-4 text-primary" aria-hidden="true" />
              Fichas de Soporte por Mes
            </CardTitle>
            <CardDescription>Últimos meses — cantidad de fichas creadas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="label"
                    stroke="var(--muted-foreground)"
                    fontSize={11}
                    tickFormatter={(value: string) => value.slice(2)}
                  />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--border)" }} />
                  <Legend />
                  <Bar dataKey="Fichas" fill={chartPalette.primary} radius={[4, 4, 0, 0]} name="Fichas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-20 text-center text-sm text-muted-foreground">Sin datos aún</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Clock className="size-4 text-primary" aria-hidden="true" />
              Estado del Ticket
            </CardTitle>
            <CardDescription>Distribución de los tickets de soporte</CardDescription>
          </CardHeader>
          <CardContent className="flex h-[300px] flex-col justify-between">
            <ResponsiveContainer width="100%" height="70%">
              <PieChart>
                <Pie
                  data={ticketStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {ticketStatusData.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color ?? COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1">
              {ticketStatusData.map((item) => (
                <div key={item.name} className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    {item.name}
                  </span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-border shadow-[var(--shadow-soft)] lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <TrendingUp className="size-4 text-success" aria-hidden="true" />
              Tendencia Diaria de Fichas
            </CardTitle>
            <CardDescription>Últimos 14 días de actividad de soporte</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {dailyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="fecha" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--border)" }} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="cantidad"
                    stroke={chartPalette.success}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Fichas por día"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-20 text-center text-sm text-muted-foreground">Sin datos aún</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border shadow-[var(--shadow-soft)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Boxes className="size-4 text-warning" aria-hidden="true" />
              Fichas por Área
            </CardTitle>
            <CardDescription>Cantidad de fichas por área</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {areaChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={areaChartData.slice(0, 8)}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal vertical={false} />
                  <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid var(--border)" }} />
                  <Bar dataKey="value" fill={chartPalette.warning} radius={[0, 4, 4, 0]} name="Fichas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="mt-20 text-center text-sm text-muted-foreground">Sin datos aún</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
