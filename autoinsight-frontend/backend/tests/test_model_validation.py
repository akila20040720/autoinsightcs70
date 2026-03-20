from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook

from autoinsight_frontend_backend_compat import load_validator


class ModelValidationTests(unittest.TestCase):
    def test_validator_maps_make_model_and_year(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            workbook_path = Path(tmp) / "models.xlsx"
            workbook = Workbook()
            sheet = workbook.active
            sheet.title = "Sheet1"
            sheet.append(["Make", "Model", "Year of Manufacture", "Previous Month Price", None, None, None, None, None, "Next Week Price", "AVG. Price AVG.Milleage"])
            sheet.append([None, None, None, 2024, None, 2025, None, None, None, None, None])
            sheet.append([None, None, None, "NOV", "DEC", "JAN", "FEB", "MARCH", "APRIL(Next Month) Predicted", None, None])
            sheet.append(["Toyota", "Corolla", 2018, "7,100,000", "7,200,000", "7,300,000", "7,350,000", "7,400,000", "7,500,000", "7,600,000", "7,450,000 | 52,000"])
            sheet.append(["Toyota", "Yaris", 2020, "9,100,000", "9,200,000", "9,300,000", "9,400,000", "9,500,000", "9,600,000", "9,700,000", "9,450,000 | 24,000"])
            workbook.save(workbook_path)

            validator = load_validator(workbook_path)
            result = validator.validate_listing(
                {
                    "vehicleType": "Car",
                    "make": "Toyota",
                    "model": "Corolla",
                    "year": 2018,
                }
            )

            self.assertEqual(result["validation_status"], "validated")
            self.assertGreaterEqual(result["confidence"], 0.8)
            self.assertEqual(result["matched_model_row_id"], "Sheet1:4")
            self.assertIn("market_analysis", result)


if __name__ == "__main__":
    unittest.main()
