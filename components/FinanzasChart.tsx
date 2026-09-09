"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PuntoMensual } from "@/lib/queries/finanzas";
import { formatMoney } from "@/lib/money";

export default function FinanzasChart({ datos }: { datos: PuntoMensual[] }) {
  return (
    <div className="h-56 w-full rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={datos} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(67,48,42,0.08)" vertical={false} />
          <XAxis
            dataKey="etiqueta"
            tick={{ fontSize: 11, fill: "#8a7768" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#8a7768" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 100)}`}
            width={40}
          />
          <Tooltip
            formatter={(value) => formatMoney(typeof value === "number" ? value : Number(value))}
            contentStyle={{ borderRadius: 12, border: "1px solid rgba(67,48,42,0.1)", fontSize: 12 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="ingresos" name="Ingresos" fill="#5f9270" radius={[4, 4, 0, 0]} />
          <Bar dataKey="gastos" name="Gastos" fill="#c85c5c" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
