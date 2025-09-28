import json
import azure.functions as func
from helpers.config import table_client

breathsListBP = func.Blueprint()

@breathsListBP.route(route="breaths", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def list_breaths(req: func.HttpRequest) -> func.HttpResponse:
    """
    List finalised breath samples for a device.
    Query: ?device_id=...&limit=50
    """
    try:
        device_id = req.params.get("device_id")
        limit = int(req.params.get("limit", "50"))
        if not device_id:
            return func.HttpResponse("device_id required", status_code=400)

        tbl = table_client()
        rows = list(tbl.query_entities(f"PartitionKey eq '{device_id}'"))
        rows.sort(key=lambda r: r.get("started_at") or "", reverse=True)

        out = [{
            "device_id": r["PartitionKey"],
            "breath_id": r["RowKey"],
            "started_at": r.get("started_at"),
            "sample_count": r.get("sample_count"),
            "peak_voc1_ppb": r.get("peak_voc1_ppb"),
            "peak_voc2_ppb": r.get("peak_voc2_ppb"),
            "duration_ms": r.get("duration_ms")
        } for r in rows[:limit]]

        return func.HttpResponse(json.dumps(out), mimetype="application/json", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Bad Request: {e}", status_code=400)
