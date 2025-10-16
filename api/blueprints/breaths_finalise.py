import json
import azure.functions as func
from helpers.config import blob_service, table_client, BLOB_CONTAINER, FINALIZE_API_KEY

breathsFinalizeBP = func.Blueprint()

@breathsFinalizeBP.route(route="breaths/{breath_id}", methods=["PUT"], auth_level=func.AuthLevel.ANONYMOUS)
def finalize_breath(req: func.HttpRequest) -> func.HttpResponse:
    """
    Clinician finalizes a staged breath, names it appropriately, and can add notes.
    Moves staging/{stage_id}.json -> {device_id}/{breath_id}.json
    Adds index row in Table Storage.
    """
 

    try:
        breath_id = req.route_params.get("breath_id")
        body = req.get_json()
        stage_id, device_id = body.get("stage_id"), body.get("device_id")
        notes = (body.get("notes") or "").strip()

        if not (breath_id and stage_id and device_id):
            return func.HttpResponse("stage_id, device_id, breath_id required", status_code=400)

        bs = blob_service()

        # load staged breath sample
        staged_path = f"staging/{stage_id}.json"
        staged_bc = bs.get_blob_client(BLOB_CONTAINER, staged_path)
        raw = staged_bc.download_blob().readall()
        data = json.loads(raw)

        # update identifiers
        data["device_id"] = device_id
        data["breath_id"] = breath_id

        # attach clinician notes
        if notes:
            data["clinician_notes"] = notes

        # write final blob (outside staging)
        final_path = f"{device_id}/{breath_id}.json"
        final_bc = bs.get_blob_client(BLOB_CONTAINER, final_path)
        if final_bc.exists():
            return func.HttpResponse("breath_id exists", status_code=409)
        final_bc.upload_blob(json.dumps(data).encode("utf-8"), overwrite=False)

        # delete staged breath
        staged_bc.delete_blob()

        # compute index fields
        samples = data.get("samples", []) or []
        peak_v1 = max((s.get("voc1_ppb", float("-inf")) for s in samples), default=None)
        peak_v2 = max((s.get("voc2_ppb", float("-inf")) for s in samples), default=None)
        duration_ms = samples[-1]["t_ms"] if samples and "t_ms" in samples[-1] else None

        # upsert index with optional notes
        tbl = table_client()
        entity = {
            "PartitionKey": device_id,
            "RowKey": breath_id,
            "started_at": data.get("started_at"),
            "sample_count": len(samples),
            "peak_voc1_ppb": peak_v1,
            "peak_voc2_ppb": peak_v2,
            "duration_ms": duration_ms,
        }
        if notes:
            entity["clinician_notes"] = notes

        tbl.upsert_entity(entity)

        return func.HttpResponse(json.dumps({"ok": True}), mimetype="application/json", status_code=201)

    except Exception as e:
        return func.HttpResponse(f"Bad Request: {e}", status_code=400)
