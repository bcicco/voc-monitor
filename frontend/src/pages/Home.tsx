import { useState } from "react";
import StagedBreathList from "../components/StagedBreathList";
import BreathList from "../components/BreathList";
import VocChart from "../components/VocChart";

export default function Home() {
  const deviceId = "voc-esp32-01";
  const [breathId, setBreathId] = useState<string | null>(null);

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-3xl font-bold">VOC Breath Data</h1>
      <h2 className="text-2xl font-semibold">Staged Breaths</h2>
      {/* Inbox for staged breaths */}
      <StagedBreathList
        defaultDeviceId={deviceId}
        onFinalized={(id) => setBreathId(id)}
      />

      {/* List of finalized breaths */}
      <BreathList deviceId={deviceId} onSelect={setBreathId} />

      {/* Chart viewer for the selected breath. found a good library to do heavy lifting here */}
      {breathId && <VocChart deviceId={deviceId} breathId={breathId} />}
    </main>
  );
}
