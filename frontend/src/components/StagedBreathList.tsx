import { useEffect, useMemo, useState } from "react";

type StagedItem = {
  stage_id: string;
  blob_name: string;
  size?: number | null;
  last_modified?: string | null;
  started_at?: string | null;
  sample_count?: number | null;
};

type Props = {
  defaultDeviceId?: string;
  onFinalized?: (breathId: string) => void;
};

type FinalizeArgs = {
  stage_id: string;
  breath_id: string;
  notes: string;
};

export default function StagedBreathList({
  defaultDeviceId = "voc-esp32-01",
  onFinalized,
}: Props) {
  const [items, setItems] = useState<StagedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState(defaultDeviceId);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/stages");
        if (!r.ok) throw new Error(await r.text());
        const data = (await r.json()) as StagedItem[];
        if (!cancel) setItems(data);
      } catch (e: any) {
        if (!cancel) setErr(e?.message ?? String(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const t = filter.trim().toLowerCase();
    if (!t) return items;
    return items.filter(
      (i) =>
        i.stage_id.toLowerCase().includes(t) ||
        (i.started_at ?? "").toLowerCase().includes(t)
    );
  }, [items, filter]);

  async function finalize({ stage_id, breath_id, notes }: FinalizeArgs) {
    if (!breath_id) {
      alert("Please enter a Breath ID");
      return;
    }
    try {
      const r = await fetch(`/api/breaths/${encodeURIComponent(breath_id)}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "password",
        },
        body: JSON.stringify({ stage_id, device_id: deviceId, notes }),
      });
      if (!r.ok) throw new Error(await r.text());
      setItems((prev) => prev.filter((x) => x.stage_id !== stage_id));
      onFinalized?.(breath_id);
    } catch (e: any) {
      alert(`Finalize failed: ${e?.message ?? e}`);
    }
  }

  return (
    <div className="p-6 rounded-2xl shadow bg-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Staged Breaths</h2>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter (stage id / date)"
            className="border rounded px-3 py-1 text-sm"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Device</label>
            <input
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="border rounded px-2 py-1 text-sm font-mono"
              style={{ width: 180 }}
            />
          </div>
        </div>
      </div>

      {err && (
        <div className="mb-3 p-3 rounded bg-red-50 text-red-700 text-sm">
          {err}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Stage ID</th>
              <th className="py-2 pr-4">Started</th>
              <th className="py-2 pr-4">Samples</th>
              <th className="py-2 pr-4">Last Modified</th>
              <th className="py-2 pr-4">Size</th>
              <th className="py-2 pr-4">Breath ID + Notes</th>
              <th className="py-2 pr-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  No staged breaths
                </td>
              </tr>
            ) : (
              filtered.map((s) => (
                <Row
                  key={s.stage_id}
                  item={s}
                  onFinalize={(args) => finalize(args)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  item,
  onFinalize,
}: {
  item: StagedItem;
  onFinalize: (args: { stage_id: string; breath_id: string; notes: string }) => void;
}) {
  const [breathId, setBreathId] = useState("");
  const [notes, setNotes] = useState("");

  return (
    <tr className="border-b align-top">
      <td className="py-2 pr-4 font-mono">{item.stage_id}</td>
      <td className="py-2 pr-4">
        {item.started_at ? new Date(item.started_at).toLocaleString() : "—"}
      </td>
      <td className="py-2 pr-4">{item.sample_count ?? "—"}</td>
      <td className="py-2 pr-4">
        {item.last_modified
          ? new Date(item.last_modified).toLocaleString()
          : "—"}
      </td>
      <td className="py-2 pr-4">{formatBytes(item.size)}</td>
      <td className="py-2 pr-4">
        <div className="flex flex-col gap-2">
          <input
            value={breathId}
            onChange={(e) => setBreathId(e.target.value)}
            placeholder="e.g. trial-001"
            className="border rounded px-2 py-1 text-sm font-mono"
            style={{ width: 200 }}
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Clinician notes (optional)"
            className="border rounded px-2 py-1 text-sm"
            rows={3}
            style={{ width: 320 }}
          />
        </div>
      </td>
      <td className="py-2 pr-2">
        <button
          className="px-3 py-1 rounded bg-black text-white"
          onClick={() =>
            onFinalize({ stage_id: item.stage_id, breath_id: breathId, notes })
          }
        >
          Finalize
        </button>
      </td>
    </tr>
  );
}

function formatBytes(n?: number | null) {
  if (!n && n !== 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
