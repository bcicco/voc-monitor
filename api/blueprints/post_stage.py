import json, uuid
import azure.functions as func
from helpers.config import blob_service, BLOB_CONTAINER

stagesBP = func.Blueprint()

@stagesBP.route(route="stages", methods=["POST"], auth_level=func.AuthLevel.FUNCTION)
def stage_breath(req: func.HttpRequest) -> func.HttpResponse:
    """
    Device posts raw breath sample, see readme for format
    Stores blob under staging/{stage_id}.json
    Returns { "stage_id": ... }
    """
    try:
        body = req.get_json()
        samples = body.get("samples")
        if not isinstance(samples, list) or not samples:
            return func.HttpResponse("samples[] required", status_code=400)

        stage_id = str(uuid.uuid4())
        blob = blob_service().get_blob_client(
            container=BLOB_CONTAINER,
            blob=f"staging/{stage_id}.json"
        )
        blob.upload_blob(json.dumps(body).encode(), overwrite=True)

        return func.HttpResponse(
            json.dumps({"stage_id": stage_id}),
            mimetype="application/json",
            status_code=201
        )
    except Exception as e:
        return func.HttpResponse(f"Bad Request: {e}", status_code=400)
