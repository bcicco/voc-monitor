Example of post request for post_staged: 
curl -X POST http://localhost:4280/api/stages ^
  -H "Content-Type: application/json" ^
  -H "x-api-key: password" ^
  -d "{\"device_id\":\"voc-esp32-01\",\"started_at\":\"2025-09-28T12:00:00Z\",\"sample_rate_hz\":25,\"samples\":[{\"t_ms\":0,\"voc1_ppb\":100,\"voc2_ppb\":95,\"temp_c\":24.8,\"rh_pct\":53.2},{\"t_ms\":5,\"voc1_ppb\":150,\"voc2_ppb\":120,\"temp_c\":24.8,\"rh_pct\":53.2}]}"
