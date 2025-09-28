import azure.functions as func
from helpers.config import blob_service, BLOB_CONTAINER

breathsGetBP = func.Blueprint()

@breathsGetBP.route(route="breaths/{breath_id}", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_breath(req: func.HttpRequest) -> func.HttpResponse:
    """
    Get full breath JSON for specific breath && specific device.
    Query: /breaths/{breath_id}?device_id=...
    """
    try:
        breath_id = req.route_params.get("breath_id")
        device_id = req.params.get("device_id")
        if not (breath_id and device_id):
            return func.HttpResponse("device_id & breath_id required", status_code=400)

        bs = blob_service()
        path = f"{device_id}/{breath_id}.json"
        bc = bs.get_blob_client(BLOB_CONTAINER, path)
        if not bc.exists():
            return func.HttpResponse("Not found", status_code=404)

        raw = bc.download_blob().readall()
        return func.HttpResponse(raw, mimetype="application/json", status_code=200)
    except Exception as e:
        return func.HttpResponse(f"Bad Request: {e}", status_code=400)
