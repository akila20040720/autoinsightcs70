#!/usr/bin/env python3
"""
MongoDB Connection and Data Loading Diagnostic Script
Checks if MongoDB is running, accessible, and has data loaded
"""

import os
import json
import sys
from pathlib import Path

try:
    from pymongo import MongoClient
    from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
except ModuleNotFoundError:
    print("[ERROR] pymongo is not installed. Install it with: pip install pymongo")
    sys.exit(1)


def get_env_settings():
    """Load MongoDB settings from environment or defaults"""
    return {
        "mongodb_uri": os.getenv("MONGODB_URI", "mongodb://localhost:27017").strip(),
        "mongodb_database": os.getenv("MONGODB_DATABASE", "autoinsight").strip() or "autoinsight",
        "mongodb_collection": os.getenv("MONGODB_COLLECTION", "vehicle_listings").strip() or "vehicle_listings",
        "mongodb_favorites_collection": os.getenv("MONGODB_FAVORITES_COLLECTION", "favorites").strip() or "favorites",
    }


def check_mongodb_connection(mongodb_uri):
    """Check if MongoDB server is accessible"""
    print(f"\n Checking MongoDB connection...")
    print(f"   URI: {mongodb_uri}")
    
    try:
        client = MongoClient(mongodb_uri, serverSelectionTimeoutMS=5000)
        # Force connection check
        client.admin.command('ping')
        print("[OK] MongoDB server is running and accessible")
        return client
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"[ERROR] MongoDB server is NOT running or NOT accessible")
        print(f"   Error: {str(e)}")
        return None
    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        return None


def check_databases(client):
    """List available databases"""
    print(f"\n Available databases:")
    try:
        databases = client.list_database_names()
        if databases:
            for db_name in databases:
                print(f"   - {db_name}")
        else:
            print("   (No databases found)")
        return databases
    except Exception as e:
        print(f"[ERROR] Error listing databases: {str(e)}")
        return []


def check_collections(client, database_name):
    """List collections in a database"""
    print(f"\n Collections in '{database_name}' database:")
    try:
        db = client[database_name]
        collections = db.list_collection_names()
        if collections:
            for collection_name in collections:
                print(f"   - {collection_name}")
        else:
            print("   (No collections found)")
        return collections
    except Exception as e:
        print(f"[ERROR] Error listing collections: {str(e)}")
        return []


def check_collection_data(client, database_name, collection_name):
    """Check document count and sample data in collection"""
    print(f"\n Data in '{database_name}.{collection_name}':")
    try:
        db = client[database_name]
        collection = db[collection_name]
        
        count = collection.count_documents({})
        print(f"   Total documents: {count}")
        
        if count > 0:
            print(f"   Sample documents (first 3):")
            for i, doc in enumerate(collection.find().limit(3), 1):
                # Show a summary of the document
                keys = list(doc.keys())
                print(f"      #{i}: ID={doc.get('_id', 'N/A')}, Keys: {len(keys)} ({', '.join(keys[:5])}...)")
            
            # Show field statistics
            print(f"   Field names in collection:")
            sample = collection.find_one()
            if sample:
                for key in list(sample.keys())[:10]:
                    print(f"      - {key}")
        else:
            print("   [WARN] Collection is empty (no documents)")
        
        return count
    except Exception as e:
        print(f"[ERROR] Error checking collection: {str(e)}")
        return 0


def main():
    """Run all diagnostics"""
    print("=" * 60)
    print("MongoDB Connection & Data Loading Diagnostic")
    print("=" * 60)
    
    settings = get_env_settings()
    
    print(f"\n[CONFIG] Configuration:")
    print(f"   URI: {settings['mongodb_uri']}")
    print(f"   Database: {settings['mongodb_database']}")
    print(f"   Collections: {settings['mongodb_collection']}, {settings['mongodb_favorites_collection']}")
    
    # Check connection
    client = check_mongodb_connection(settings["mongodb_uri"])
    
    if not client:
        print("\n" + "=" * 60)
        print("[ERROR] Cannot connect to MongoDB. Please:")
        print("   1. Ensure MongoDB service is running")
        print("   2. Check MONGODB_URI environment variable")
        print("   3. Verify MongoDB is listening on the configured port")
        print("=" * 60)
        return False
    
    # Check databases
    databases = check_databases(client)
    
    # Check collections in the configured database
    collections = check_collections(client, settings["mongodb_database"])
    
    # Check data in both collections
    vehicle_count = check_collection_data(
        client, 
        settings["mongodb_database"], 
        settings["mongodb_collection"]
    )
    
    favorites_count = check_collection_data(
        client,
        settings["mongodb_database"],
        settings["mongodb_favorites_collection"]
    )
    
    # Summary
    print("\n" + "=" * 60)
    print("[SUMMARY] Summary:")
    print("=" * 60)
    print(f"[OK] MongoDB: Connected")
    print(f"[OK] Database '{settings['mongodb_database']}': Exists")
    print(f"{'[OK]' if settings['mongodb_collection'] in collections else '[WARN]'} Collection '{settings['mongodb_collection']}': {vehicle_count} documents")
    print(f"{'[OK]' if settings['mongodb_favorites_collection'] in collections else '[WARN]'} Collection '{settings['mongodb_favorites_collection']}': {favorites_count} documents")
    
    if vehicle_count == 0:
        print("\n[WARN] WARNING: Vehicle listings collection is empty!")
        print("   You may need to:")
        print("   - Load data into the database")
        print("   - Check the PIPELINE_SOURCE_MODE setting")
        print("   - Run the data pipeline")
    
    print("\n" + "=" * 60)
    client.close()
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
