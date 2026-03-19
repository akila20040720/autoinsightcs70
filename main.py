from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI()

# Allow React frontend to access this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your React URL
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/vehicles")
def get_vehicles():
    data = pd.read_csv("vehicles.csv")
    return data.to_dict(orient="records")