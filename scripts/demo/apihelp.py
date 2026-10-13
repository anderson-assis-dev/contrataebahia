import json, sys, urllib.request

API = "https://app.cotaja.io"

def call(path, token=None, method="GET", body=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header("Accept", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, data, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {"success": False, "http": e.code, "body": e.read().decode()[:300]}

def rows(payload):
    """Desempacota a resposta, que pode vir paginada em data.data."""
    d = payload.get("data")
    if isinstance(d, list):
        return d
    if isinstance(d, dict):
        for k in ("data", "orders", "proposals", "items"):
            if isinstance(d.get(k), list):
                return d[k]
    return []
