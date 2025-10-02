import os
from azure.storage.blob import BlobServiceClient
from azure.data.tables import TableServiceClient

# ---- constants  ----
STORAGE_CONNECTION_STRING = os.environ.get("STORAGE_CONNECTION_STRING")
BLOB_CONTAINER = os.environ.get("BLOB_CONTAINER")
TABLE_NAME = os.environ.get("TABLE_NAME", "VocBreaths")
FINALIZE_API_KEY = os.environ.get("FINALIZE_API_KEY", "")

# ---- cached clients  ----
_blob_svc = None
_table_client = None

def blob_service() -> BlobServiceClient:
    global _blob_svc
    if _blob_svc is None:
        _blob_svc = BlobServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
    return _blob_svc

def table_client():
    global _table_client
    if _table_client is None:
        tsc = TableServiceClient.from_connection_string(STORAGE_CONNECTION_STRING)
        tsc.create_table_if_not_exists(TABLE_NAME)
        _table_client = tsc.get_table_client(TABLE_NAME)
    return _table_client
