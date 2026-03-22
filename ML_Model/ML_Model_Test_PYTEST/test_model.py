import joblib
import numpy as np
import pandas as pd
import pytest
from pathlib import Path

# ====== Paths ======
MODEL_PATH = Path("lgbm_vehicle_price_model_v3_2_0.pkl")

# Optional artifact paths — only checked if they exist
ENCODER_PATH = Path("label_encoders.pkl")
FEATURES_PATH = Path("feature_columns.pkl")


# ====== Fixtures ======
@pytest.fixture(scope="module")
def model():
    if not MODEL_PATH.exists():
        pytest.fail(f"Model file not found: {MODEL_PATH}")
    return joblib.load(MODEL_PATH)


@pytest.fixture(scope="module")
def sample_input():
    """
    Update these column names to exactly match the features
    your trained model expects.
    """
    return pd.DataFrame([{
        "make": "Toyota",
        "model": "Corolla",
        "year": 2018
    }])


# ====== File tests ======
def test_model_file_exists():
    assert MODEL_PATH.exists(), f"Missing model file: {MODEL_PATH}"


def test_optional_encoder_file_if_present():
    if ENCODER_PATH.exists():
        enc = joblib.load(ENCODER_PATH)
        assert enc is not None


def test_optional_feature_file_if_present():
    if FEATURES_PATH.exists():
        feats = joblib.load(FEATURES_PATH)
        assert feats is not None
        assert len(feats) > 0


# ====== Model tests ======
def test_model_loads(model):
    assert model is not None


def test_model_has_predict(model):
    assert hasattr(model, "predict"), "Loaded object has no predict() method"


# ====== Prediction tests ======
def test_prediction_runs(model, sample_input):
    try:
        preds = model.predict(sample_input)
        assert preds is not None
    except Exception as e:
        pytest.fail(f"Prediction failed: {e}")


def test_prediction_not_empty(model, sample_input):
    preds = model.predict(sample_input)
    assert len(preds) > 0


def test_prediction_is_numeric(model, sample_input):
    preds = model.predict(sample_input)
    assert np.issubdtype(np.array(preds).dtype, np.number), f"Prediction is not numeric: {preds}"


def test_prediction_not_nan(model, sample_input):
    preds = model.predict(sample_input)
    assert not np.isnan(preds[0]), "Prediction is NaN"


def test_prediction_not_negative(model, sample_input):
    preds = model.predict(sample_input)
    assert preds[0] >= 0, f"Prediction is negative: {preds[0]}"