from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_vehicles():
    try:
        df1 = pd.read_csv("vehicles.csv")
        df2 = pd.read_csv("Database/riyasewana_vehicles_2025-02-09.csv")
    
   
        combined = pd.concat([df1, df2], ignore_index=True)
        combined = combined.fillna("")
        return combined
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=f"CSV file not found: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading data: {e}")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "autoinsight-api"}


@app.get("/vehicles/search")
def search_vehicles(q: str = Query(..., description="Search by Make or Model")):
    data = load_vehicles()
    
   
    mask = (
        data["Make"].str.contains(q, case=False, na=False) |
        data["Model"].str.contains(q, case=False, na=False)
    )
    results = data[mask]
    return results.to_dict(orient="records")

@app.get("/vehicles")
def get_vehicles():
    data = load_vehicles()
    return data.to_dict(orient="records")