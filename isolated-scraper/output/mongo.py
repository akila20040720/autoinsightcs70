import json
from pymongo import MongoClient, UpdateOne

JSON_PATH = r"D:\AutoInsight Dashboard\autoinsightcs70\isolated-scraper\output\model_reference_rows.mongoimport.json"
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "autoinsight"
COLLECTION_NAME = "model_reference_rows"

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
col = db[COLLECTION_NAME]

with open(JSON_PATH, "r", encoding="utf-8") as f:
    docs = json.load(f)

if not isinstance(docs, list):
    raise ValueError("Expected top-level JSON array")

# Ensure unique key exists before upsert
col.create_index("rowId", unique=True)
col.create_index([("makeNorm", 1), ("modelNorm", 1), ("yearMin", 1), ("yearMax", 1)])

# Upsert so reruns update instead of duplicating
ops = [
    UpdateOne({"rowId": d["rowId"]}, {"$set": d}, upsert=True)
    for d in docs
    if isinstance(d, dict) and d.get("rowId")
]

if ops:
    result = col.bulk_write(ops, ordered=False)
    print("Matched:", result.matched_count)
    print("Modified:", result.modified_count)
    print("Upserted:", result.upserted_count)

print("Collections:", db.list_collection_names())
print("Final count:", col.count_documents({}))
print("Sample:", col.find_one({}, {"_id": 0, "rowId": 1, "make": 1, "model": 1}))