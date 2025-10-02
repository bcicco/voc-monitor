import { useEffect, useMemo, useState } from "react";

export interface BreathSummary {
  device_id: string;
  breath_id: string;
  started_at: string | null;
  sample_count: number;
  peak_voc1_ppb?: number | null;
  peak_voc2_ppb?: number | null;
  duration_ms?: number | null;
}

type Props = {
  deviceId: string;
  onSelect: (breathId: string) => void;
};

export default function BreathList({ deviceId, onSelect }: Props) {
  const [rows, setRows] = useState<BreathSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancel = false;
    async function load() {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/breaths?device_id=${encodeURIComponent(deviceId)}`);
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as BreathSummary[];
        if (!cancel) setRows(data);
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? String(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, [deviceId]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(r => r.breath_id.toLowerCase().includes(term));
  }, [rows, q]);

  return (
    <div className="p-6 rounded-2xl shadow bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Breaths</h2>
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by Breath ID"
            className="border rounded px-3 py-1 text-sm"
          />
          <button
            onClick={() => setQ("")}
            className="text-sm underline text-gray-600"
          >
            Clear
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm">{err}</div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Breath ID</th>
              <th className="py-2 pr-4">Started</th>
              <th className="py-2 pr-4">Samples</th>
              <th className="py-2 pr-4">Peak VOC1</th>
              <th className="py-2 pr-4">Peak VOC2</th>
              <th className="py-2 pr-4">Duration</th>
              <th className="py-2 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">No breaths</td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.breath_id} className="border-b hover:bg-gray-50">
                  <td className="py-2 pr-4 font-mono">{r.breath_id}</td>
                  <td className="py-2 pr-4">
                    {r.started_at ? new Date(r.started_at).toLocaleString() : "—"}
                  </td>
                  <td className="py-2 pr-4">{r.sample_count ?? "—"}</td>
                  <td className="py-2 pr-4">{valueOrDash(r.peak_voc1_ppb)}</td>
                  <td className="py-2 pr-4">{valueOrDash(r.peak_voc2_ppb)}</td>
                  <td className="py-2 pr-4">{msOrDash(r.duration_ms)}</td>
                  <td className="py-2 pr-2">
                    <button
                      onClick={() => onSelect(r.breath_id)}
                      className="px-3 py-1 rounded bg-black text-white"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function valueOrDash(v?: number | null) {
  return typeof v === "number" && isFinite(v) ? v : "—";
}
function msOrDash(ms?: number | null) {
  if (typeof ms !== "number" || !isFinite(ms)) return "—";
  if (ms < 1000) return `${ms} ms`;
  const s = ms / 1000;
  return `${s.toFixed(2)} s`;
}
