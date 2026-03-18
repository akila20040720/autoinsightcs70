from flask import Flask, jsonify
import pandas as pd

app = Flask(__name__)

@app.route("/vehicles")
def get_vehicles():
    data = pd.read_csv("vehicles.csv")
    return jsonify(data.to_dict(orient="records"))
if __name__ == "__main__":
    app.run(debug=True)
