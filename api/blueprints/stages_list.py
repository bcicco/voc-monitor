import json
import azure.functions as func
from typing import List, Dict, Any
from helpers.config import blob_service, BLOB_CONTAINER

stagesListBP = func.Blueprint()

@stagesListBP.route(route="stages", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def list_staged(req: func.HttpRequest) -> func.HttpResponse:
    """
    Gets al staged breaths table rows
    Optional: ?max=100  (defaults to 100)
    Returns: [{ stage_id, size, last_modified, started_at?, sample_count? }]
    """
    try:
        max_items = int(req.params.get("max", "100"))
        bs = blob_service()
        cc = bs.get_container_client(BLOB_CONTAINER)


        # This logic is kind of confusing, names are stafed as {staged_id} without prefix or suffix 
        out: List[Dict[str, Any]] = []
        for i, b in enumerate(cc.list_blobs(name_starts_with="staging/")):
            if i >= max_items:
                break
            name: str = b.name  
            if not name.lower().endswith(".json"):
                continue
            stage_id = name.split("/", 1)[1].rsplit(".", 1)[0]

            started_at = None
            sample_count = None
            try:
                raw = cc.download_blob(name).readall()
                doc = json.loads(raw)
                started_at = doc.get("started_at")
                samples = doc.get("samples")
                if isinstance(samples, list):
                    sample_count = len(samples)
            except Exception:
                #TODO: Add proper logging
                pass

            out.append({
                "stage_id": stage_id,
                "blob_name": name,
                "size": getattr(b, "size", None),
                "last_modified": getattr(b, "last_modified", None).isoformat() if getattr(b, "last_modified", None) else None,
                "started_at": started_at,
                "sample_count": sample_count
            })

        # sort
        out.sort(key=lambda r: r.get("last_modified") or "", reverse=True)
        return func.HttpResponse(json.dumps(out), mimetype="application/json", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Bad Request: {e}", status_code=400)
