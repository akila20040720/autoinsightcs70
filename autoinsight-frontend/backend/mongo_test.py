from pymongo import MongoClient
import certifi

uri = "mongodb+srv://wijerama2004_db_user:z3dpmFW8Id8qnAjy@autoinsightml.cmgrdyk.mongodb.net/autoinsight?retryWrites=true&w=majority"

client = MongoClient(
    uri,
    tls=True,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000
)

print(client.admin.command("ping"))
print(client.list_database_names())