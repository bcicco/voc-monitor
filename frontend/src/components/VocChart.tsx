import { useEffect, useState } from "react";
import type { Breath, Sample } from "../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Props = { deviceId: string; breathId: string };

export default function VocChart({ deviceId, breathId }: Props) {
  const [breath, setBreath] = useState<Breath | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/breaths/${encodeURIComponent(
            breathId
          )}?device_id=${encodeURIComponent(deviceId)}`
        );
        if (!res.ok) throw new Error(await res.text());
        const b = (await res.json()) as Breath;
        if (!cancel) setBreath(b);
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? String(e));
      }
    })();
    return () => {
      cancel = true;
    };
  }, [deviceId, breathId]);

  if (err)
    return (
      <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{err}</div>
    );
  if (!breath)
    return (
      <div className="p-3 rounded bg-white text-gray-600 text-sm">Loading…</div>
    );

  const samples: Sample[] = breath.samples ?? [];

  function toCsvValue(v: unknown) {
    if (v === null || v === undefined) return "";
    const s = String(v);
    // escape quotes and wrap if contains comma, quote, or newline
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  function buildCsv(b: Breath) {
    const lines: string[] = [];
    // Metadata section
    const meta: Record<string, unknown> = {
      device_id: b.device_id,
      breath_id: b.breath_id,
      started_at: b.started_at ?? "",
      clinician_notes: b.clinician_notes ?? "",
      sample_count: (b.samples ?? []).length,
    };
    lines.push("Metadata");
    for (const [k, v] of Object.entries(meta)) {
      lines.push(`${toCsvValue(k)},${toCsvValue(v)}`);
    }
    lines.push(""); // blank line

    // Samples section
    lines.push("Samples");
    // choose columns present in  data; common keys:
    const headers = ["t_ms", "voc1_ppb", "voc2_ppb", "co2_ppb"];
    lines.push(headers.map(toCsvValue).join(","));
    for (const s of b.samples ?? []) {
      const row = headers.map((h) => toCsvValue((s as any)[h]));
      lines.push(row.join(","));
    }
    return lines.join("\n");
  }

  function downloadCsv() {
    if (!breath) return;
    const csv = buildCsv(breath);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const filename = `${breath.device_id || deviceId}__${
      breath.breath_id || breathId
    }.csv`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }

  return (
    <div className="p-6 rounded-2xl shadow bg-white space-y-4">
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 text-sm text-gray-600">
        <div>
          Device: <span className="font-mono">{breath.device_id}</span>
        </div>
        <div className="flex items-center gap-3">
          <div>
            Breath: <span className="font-mono">{breath.breath_id}</span>
          </div>
          <button
            onClick={downloadCsv}
            className="px-3 py-1 rounded bg-black text-white text-xs"
            title="Export as CSV"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Clinician notes */}
      {breath.clinician_notes && (
        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
          <strong>Clinician Notes: </strong>
          <span className="whitespace-pre-wrap">{breath.clinician_notes}</span>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={samples}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t_ms" />
          <YAxis yAxisId="voc" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="Gas Concentration (ppb)"
            type="monotone"
            dataKey="voc1"
            stroke="#8884d8"
            dot={false}
          />
          <Line
            yAxisId="Gas Concentration (ppb)"
            type="monotone"
            dataKey="voc2"
            stroke="#82ca9d"
            dot={false}
          />
          <Line
            yAxisId="Gas Concentration (ppb)"
            type="monotone"
            dataKey="co2_ppm"
            stroke="#ff7300"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
