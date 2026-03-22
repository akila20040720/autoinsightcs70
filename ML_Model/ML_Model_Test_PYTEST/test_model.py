import joblib
from pathlib import Path

# ====== Paths ======
MODEL_PATH = Path("lgbm_vehicle_price_model_v3_2_0.pkl")
ENCODER_PATH = Path("label_encoders.pkl")
FEATURES_PATH = Path("feature_columns.pkl")


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


def test_model_loads():
    assert MODEL_PATH.exists(), f"Model file not found: {MODEL_PATH}"
    model = joblib.load(MODEL_PATH)
    assert model is not None


def test_model_has_predict():
    assert MODEL_PATH.exists(), f"Model file not found: {MODEL_PATH}"
    model = joblib.load(MODEL_PATH)
    assert hasattr(model, "predict"), "Loaded object has no predict() method"
    
    # python -m pytest test_model.py -v