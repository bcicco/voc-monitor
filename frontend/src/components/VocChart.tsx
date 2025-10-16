import { useEffect, useState } from "react";
import type { Breath, Sample } from "../types";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend
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
          `/api/breaths/${encodeURIComponent(breathId)}?device_id=${encodeURIComponent(deviceId)}`
        );
        if (!res.ok) throw new Error(await res.text());
        const b = (await res.json()) as Breath;
        if (!cancel) setBreath(b);
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? String(e));
      }
    })();
    return () => { cancel = true; };
  }, [deviceId, breathId]);

  if (err)
    return <div className="p-3 rounded bg-red-50 text-red-700 text-sm">{err}</div>;
  if (!breath)
    return <div className="p-3 rounded bg-white text-gray-600 text-sm">Loading…</div>;

  const samples: Sample[] = breath.samples ?? [];

  return (
    <div className="p-6 rounded-2xl shadow bg-white space-y-4">
      {/* Header info */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 text-sm text-gray-600">
        <div>
          Device: <span className="font-mono">{breath.device_id}</span>
        </div>
        <div>
          Breath: <span className="font-mono">{breath.breath_id}</span>
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
            yAxisId="voc"
            type="monotone"
            dataKey="voc1_ppb"
            stroke="#8884d8"
            dot={false}
          />
          <Line
            yAxisId="voc"
            type="monotone"
            dataKey="voc2_ppb"
            stroke="#82ca9d"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
