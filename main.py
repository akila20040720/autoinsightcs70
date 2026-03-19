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


@app.get("/vehicles")
def get_vehicles(page: int = 1, limit: int = 20):
    data = load_vehicles()
    start = (page - 1) * limit
    end = start + limit
    return {
        "total": len(data),
        "page": page,
        "limit": limit,
        "data": data.iloc[start:end].to_dict(orient="records")
    }


@app.get("/vehicles/search")
def search_vehicles(q: str = Query(..., description="Search by Make or Model")):
    data = load_vehicles()
    
    mask = (
        data["Make"].str.contains(q, case=False, na=False) |
        data["Model"].str.contains(q, case=False, na=False)
    )
    results = data[mask]
    if results.empty:
        raise HTTPException(status_code=404, detail=f"No vehicles found for '{q}'")
    return results.to_dict(orient="records")

@app.get("/vehicles/filter")
def filter_vehicles(
    district: str = Query(None, description="Filter by district"),
    make: str = Query(None, description="Filter by make"),
    min_price: float = Query(None, description="Minimum price in LKR"),
    max_price: float = Query(None, description="Maximum price in LKR"),
):
    data = load_vehicles()
 
    if district:
        data = data[data["District"].str.contains(district, case=False, na=False)]
    if make:
        data = data[data["Make"].str.contains(make, case=False, na=False)]
    if min_price is not None:
        data = data[pd.to_numeric(data["Price"], errors='coerce') >= min_price]
    if max_price is not None:
        data = data[pd.to_numeric(data["Price"], errors='coerce') <= max_price]
 
    if data.empty:
        raise HTTPException(status_code=404, detail="No vehicles found for the given filters")
 
    return data.to_dict(orient="records")