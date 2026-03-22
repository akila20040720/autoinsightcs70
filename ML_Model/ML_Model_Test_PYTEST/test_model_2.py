import joblib
from pathlib import Path

# File paths
MODEL_PATH = Path("lgbm_vehicle_price_model_v3_2_0.pkl")
META_MODEL_PATH = Path("stacking_meta_model_v3_2_0.pkl")
DATA_PKL_PATH = Path("eng_df_v2.pkl")


def test_lgbm_model_file_exists():
    assert MODEL_PATH.exists(), f"Missing file: {MODEL_PATH}"


def test_meta_model_file_exists():
    assert META_MODEL_PATH.exists(), f"Missing file: {META_MODEL_PATH}"


def test_data_pkl_file_exists():
    assert DATA_PKL_PATH.exists(), f"Missing file: {DATA_PKL_PATH}"


def test_lgbm_model_loads():
    model = joblib.load(MODEL_PATH)
    assert model is not None


def test_lgbm_model_has_predict():
    model = joblib.load(MODEL_PATH)
    assert hasattr(model, "predict")


def test_meta_model_loads():
    meta_model = joblib.load(META_MODEL_PATH)
    assert meta_model is not None


def test_meta_model_has_predict():
    meta_model = joblib.load(META_MODEL_PATH)
    assert hasattr(meta_model, "predict")