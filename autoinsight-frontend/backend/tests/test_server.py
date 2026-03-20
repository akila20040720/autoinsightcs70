from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from autoinsight_frontend_backend_compat import create_test_app


class MarketplaceApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp_dir = tempfile.TemporaryDirectory()
        base = Path(self.temp_dir.name)
        self.snapshot_path = base / "normalized.json"
        self.favorites_path = base / "favorites.json"
        self.snapshot_path.write_text(
            json.dumps(
                {
                    "meta": {"refreshedAt": "2026-03-20T00:00:00+00:00"},
                    "items": [
                        {
                            "id": "a",
                            "vehicleType": "Car",
                            "make": "Toyota",
                            "model": "Corolla",
                            "year": 2018,
                            "priceLkr": 7500000,
                            "priceMillion": 7.5,
                            "mileage": 55000,
                            "district": "Colombo",
                            "publishedDate": "Mar 10",
                            "listedAt": "2026-03-10T00:00:00+00:00",
                            "vehicleUrl": "https://riyasewana.com/buy/a",
                            "condition": "Used",
                            "validation_status": "validated",
                            "confidence": 0.91,
                            "matched_model_row_id": "Sheet1:4",
                            "market_analysis": {
                                "previousMonthPriceLkr": 7200000,
                                "nextWeekPriceLkr": 7600000,
                                "avgPriceLkr": 7400000,
                                "avgMileage": 52000,
                                "priceTrend": [
                                    {"label": "NOV 2024", "valueLkr": 7100000, "predicted": False},
                                    {"label": "DEC 2024", "valueLkr": 7150000, "predicted": False},
                                    {"label": "JAN 2025", "valueLkr": 7250000, "predicted": False},
                                    {"label": "FEB 2025", "valueLkr": 7300000, "predicted": False},
                                    {"label": "MAR 2025", "valueLkr": 7200000, "predicted": False},
                                    {"label": "APR(Next Month) Predicted 2025", "valueLkr": 7500000, "predicted": True},
                                ],
                            },
                        },
                        {
                            "id": "b",
                            "vehicleType": "Car",
                            "make": "Toyota",
                            "model": "Yaris",
                            "year": 2020,
                            "priceLkr": 9800000,
                            "priceMillion": 9.8,
                            "mileage": 21000,
                            "district": "Gampaha",
                            "publishedDate": "2d ago",
                            "listedAt": "2026-03-18T00:00:00+00:00",
                            "vehicleUrl": "https://riyasewana.com/buy/b",
                            "condition": "Recondition",
                            "validation_status": "partial",
                            "confidence": 0.77,
                            "matched_model_row_id": "Sheet1:5",
                            "market_analysis": {
                                "previousMonthPriceLkr": 9500000,
                                "nextWeekPriceLkr": 9900000,
                                "avgPriceLkr": 9700000,
                                "avgMileage": 24000,
                                "priceTrend": [
                                    {"label": "NOV 2024", "valueLkr": 9200000, "predicted": False},
                                    {"label": "DEC 2024", "valueLkr": 9300000, "predicted": False},
                                    {"label": "JAN 2025", "valueLkr": 9450000, "predicted": False},
                                    {"label": "FEB 2025", "valueLkr": 9550000, "predicted": False},
                                    {"label": "MAR 2025", "valueLkr": 9500000, "predicted": False},
                                    {"label": "APR(Next Month) Predicted 2025", "valueLkr": 9800000, "predicted": True},
                                ],
                            },
                        },
                        {
                            "id": "c",
                            "vehicleType": "SUV",
                            "make": "Nissan",
                            "model": "X-Trail",
                            "year": 2017,
                            "priceLkr": 11200000,
                            "priceMillion": 11.2,
                            "mileage": 87000,
                            "district": "Colombo",
                            "publishedDate": "Mar 01",
                            "listedAt": "2026-03-01T00:00:00+00:00",
                            "vehicleUrl": "https://riyasewana.com/buy/c",
                            "condition": "Used",
                            "validation_status": "unmatched",
                            "confidence": 0.22,
                            "matched_model_row_id": None,
                        },
                        {
                            "id": "stale-1",
                            "vehicleType": "Car",
                            "make": "Toyota",
                            "model": "Starlet",
                            "year": 1998,
                            "priceLkr": 3200000,
                            "priceMillion": 3.2,
                            "mileage": 150000,
                            "district": "Kandy",
                            "publishedDate": "Feb 01",
                            "listedAt": "2026-02-01T00:00:00+00:00",
                            "vehicleUrl": "https://riyasewana.com/buy/stale-1",
                            "condition": "Used",
                            "validation_status": "partial",
                            "confidence": 0.5,
                            "matched_model_row_id": "Sheet1:10",
                            "isActive": False,
                            "staleAt": "2026-03-19T00:00:00+00:00",
                            "staleReason": "missing_from_latest_refresh",
                        },
                    ],
                }
            ),
            encoding="utf-8",
        )
        self.app = create_test_app(self.snapshot_path, self.favorites_path)
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        self.temp_dir.cleanup()

    def test_listings_support_multi_choice_filters_and_pagination(self) -> None:
        response = self.client.get(
            "/api/listings?make=Toyota&condition=Used&condition=Recondition&limit=1&page=1&sort=price&direction=asc"
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["meta"]["total"], 2)
        self.assertEqual(len(payload["items"]), 1)
        self.assertTrue(payload["meta"]["hasNext"])
        self.assertEqual(payload["items"][0]["id"], "a")
        self.assertGreaterEqual(payload["meta"]["staleTotal"], 0)

    def test_compare_endpoint_returns_requested_items(self) -> None:
        response = self.client.post("/api/compare", json={"ids": ["a", "c"]})
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual([item["id"] for item in payload["items"]], ["a", "c"])

    def test_listings_include_market_analysis_summary(self) -> None:
        response = self.client.get("/api/listings?make=Toyota")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["stats"]["marketAnalysis"]["previousMonthPriceLkr"], 8350000)
        self.assertEqual(payload["stats"]["marketAnalysis"]["avgMileage"], 38000)
        self.assertEqual(len(payload["stats"]["marketAnalysis"]["priceTrend"]), 6)

    def test_favorites_roundtrip(self) -> None:
        save_response = self.client.put(
            "/api/favorites",
            json={"userKey": "device-1", "listingIds": ["a", "c"]},
        )
        self.assertEqual(save_response.status_code, 200)

        read_response = self.client.get("/api/favorites?userKey=device-1")
        self.assertEqual(read_response.status_code, 200)
        payload = read_response.get_json()
        self.assertEqual(payload["listingIds"], ["a", "c"])
        self.assertEqual(len(payload["items"]), 2)

    def test_stale_listings_are_hidden_from_api(self) -> None:
        listings_response = self.client.get("/api/listings")
        self.assertEqual(listings_response.status_code, 200)
        listing_ids = [item["id"] for item in listings_response.get_json()["items"]]
        self.assertNotIn("stale-1", listing_ids)

        detail_response = self.client.get("/api/listings/stale-1")
        self.assertEqual(detail_response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
