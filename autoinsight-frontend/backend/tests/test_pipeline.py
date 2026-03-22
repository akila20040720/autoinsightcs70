from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from openpyxl import Workbook

from autoinsight_frontend_backend_compat import Settings, run_pipeline


class PipelineStaleTests(unittest.TestCase):
    def test_missing_listing_becomes_stale_after_refresh(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            base = Path(tmp_dir)
            snapshot_path = base / "normalized.json"
            fallback_path = base / "fallback.json"
            raw_path = base / "raw.json"
            favorites_path = base / "favorites.json"
            image_cache_path = base / "images.json"
            workbook_path = base / "models.xlsx"

            workbook = Workbook()
            sheet = workbook.active
            sheet.title = "Sheet1"
            sheet.append(["Make", "Model", "Year of Manufacture", "Previous Month Price", None, None, None, None, None, "Next Week Price", "AVG. Price AVG.Milleage"])
            sheet.append([None, None, None, 2024, None, 2025, None, None, None, None, None])
            sheet.append([None, None, None, "NOV", "DEC", "JAN", "FEB", "MARCH", "APRIL(Next Month) Predicted", None, None])
            sheet.append(["Toyota", "Corolla", 2018, "7,100,000", "7,200,000", "7,300,000", "7,400,000", "7,500,000", "7,600,000", "7,700,000", "7,450,000 | 52,000"])
            workbook.save(workbook_path)

            snapshot_path.write_text(
                json.dumps(
                    {
                        "meta": {"refreshedAt": "2026-03-20T00:00:00+00:00"},
                        "items": [
                            {
                                "id": "keep-me",
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
                                "vehicleUrl": "https://riyasewana.com/buy/keep-me",
                                "condition": "Used",
                                "validation_status": "validated",
                                "confidence": 0.91,
                                "matched_model_row_id": "Sheet1:4",
                                "isActive": True,
                            },
                            {
                                "id": "remove-me",
                                "vehicleType": "Car",
                                "make": "Toyota",
                                "model": "Corolla",
                                "year": 2018,
                                "priceLkr": 7600000,
                                "priceMillion": 7.6,
                                "mileage": 50000,
                                "district": "Gampaha",
                                "publishedDate": "Mar 09",
                                "listedAt": "2026-03-09T00:00:00+00:00",
                                "vehicleUrl": "https://riyasewana.com/buy/remove-me",
                                "condition": "Used",
                                "validation_status": "validated",
                                "confidence": 0.91,
                                "matched_model_row_id": "Sheet1:4",
                                "isActive": True,
                            },
                        ],
                    }
                ),
                encoding="utf-8",
            )

            settings = Settings(
                source_mode="scrape",
                manual_source_json=base / "unused.json",
                model_report_path=workbook_path,
                normalized_snapshot_path=snapshot_path,
                fallback_snapshot_path=fallback_path,
                raw_snapshot_path=raw_path,
                favorites_snapshot_path=favorites_path,
                image_cache_path=image_cache_path,
                refresh_interval_seconds=21600,
                query_cache_ttl_seconds=5,
                og_image_cache_ttl_seconds=21600,
                enable_scheduler=False,
                mongodb_uri="",
                mongodb_database="test",
                mongodb_collection="vehicle_listings",
                mongodb_favorites_collection="favorites",
                scrape_filters={"vehicle_type": "cars", "make": "", "model": "", "year": ""},
                scrape_max_results=100,
                stale_retention_seconds=259200,
            )

            current_items = [
                {
                    "id": "keep-me",
                    "vehicleType": "Car",
                    "make": "Toyota",
                    "model": "Corolla",
                    "year": 2018,
                    "priceLkr": 7700000,
                    "mileage": 53000,
                    "district": "Colombo",
                    "publishedDate": "Mar 20",
                    "vehicleUrl": "https://riyasewana.com/buy/keep-me",
                    "condition": "Used",
                }
            ]

            with patch("backend.pipeline.load_raw_source", return_value=(current_items, {"source": "live-scrape"})):
                payload = run_pipeline(settings)

            items_by_id = {item["id"]: item for item in payload["items"]}
            self.assertTrue(items_by_id["keep-me"]["isActive"])
            self.assertFalse(items_by_id["remove-me"]["isActive"])
            self.assertEqual(items_by_id["remove-me"]["staleReason"], "missing_from_latest_refresh")
            self.assertEqual(payload["meta"]["activeTotal"], 1)
            self.assertEqual(payload["meta"]["staleTotal"], 1)

    def test_duplicate_listing_ids_in_source_are_deduplicated(self) -> None:
        with tempfile.TemporaryDirectory() as tmp_dir:
            base = Path(tmp_dir)
            snapshot_path = base / "normalized.json"
            fallback_path = base / "fallback.json"
            raw_path = base / "raw.json"
            favorites_path = base / "favorites.json"
            image_cache_path = base / "images.json"
            workbook_path = base / "models.xlsx"

            workbook = Workbook()
            sheet = workbook.active
            sheet.title = "Sheet1"
            sheet.append(["Make", "Model", "Year of Manufacture", "Previous Month Price", None, None, None, None, None, "Next Week Price", "AVG. Price AVG.Milleage"])
            sheet.append([None, None, None, 2024, None, 2025, None, None, None, None, None])
            sheet.append([None, None, None, "NOV", "DEC", "JAN", "FEB", "MARCH", "APRIL(Next Month) Predicted", None, None])
            sheet.append(["Toyota", "Corolla", 2018, "7,100,000", "7,200,000", "7,300,000", "7,400,000", "7,500,000", "7,600,000", "7,700,000", "7,450,000 | 52,000"])
            workbook.save(workbook_path)

            settings = Settings(
                source_mode="scrape",
                manual_source_json=base / "unused.json",
                model_report_path=workbook_path,
                normalized_snapshot_path=snapshot_path,
                fallback_snapshot_path=fallback_path,
                raw_snapshot_path=raw_path,
                favorites_snapshot_path=favorites_path,
                image_cache_path=image_cache_path,
                refresh_interval_seconds=21600,
                query_cache_ttl_seconds=5,
                og_image_cache_ttl_seconds=21600,
                enable_scheduler=False,
                mongodb_uri="",
                mongodb_database="test",
                mongodb_collection="vehicle_listings",
                mongodb_favorites_collection="favorites",
                scrape_filters={"vehicle_type": "cars", "make": "", "model": "", "year": ""},
                scrape_max_results=100,
                stale_retention_seconds=259200,
            )

            duplicate_id = "https://riyasewana.com/buy/toyota-corolla-sale-colombo-123"
            current_items = [
                {
                    "id": duplicate_id,
                    "vehicleType": "Car",
                    "make": "Toyota",
                    "model": "Corolla",
                    "year": 2018,
                    "priceLkr": 7500000,
                    "mileage": 55000,
                    "district": "Colombo",
                    "publishedDate": "Mar 20",
                    "vehicleUrl": duplicate_id,
                    "condition": "Used",
                },
                {
                    "id": duplicate_id,
                    "vehicleType": "Car",
                    "make": "Toyota",
                    "model": "Corolla",
                    "year": 2019,
                    "priceLkr": 7600000,
                    "mileage": 53000,
                    "district": "Colombo",
                    "publishedDate": "Mar 21",
                    "vehicleUrl": duplicate_id,
                    "condition": "Used",
                },
            ]

            with patch("backend.pipeline.load_raw_source", return_value=(current_items, {"source": "live-scrape"})):
                payload = run_pipeline(settings)

            self.assertEqual(payload["meta"]["activeTotal"], 1)
            self.assertEqual(len(payload["items"]), 1)
            self.assertEqual(payload["items"][0]["id"], duplicate_id)
            self.assertEqual(payload["items"][0]["year"], 2019)


if __name__ == "__main__":
    unittest.main()
