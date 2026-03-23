import os
import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "dados_mobilidade.csv")
MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "modelo_risco.pkl")

os.makedirs(MODEL_DIR, exist_ok=True)

df = pd.read_csv(DATA_PATH)

X = df[[
    "origem",
    "destino",
    "hora",
    "clima",
    "transporte",
    "distancia_km",
    "tempo_base"
]]

y = df["risco"]

categorical_features = ["origem", "destino", "clima", "transporte"]
numeric_features = ["hora", "distancia_km", "tempo_base"]

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
        ("num", "passthrough", numeric_features),
    ]
)

model = Pipeline([
    ("preprocessor", preprocessor),
    ("regressor", RandomForestRegressor(
        n_estimators=150,
        random_state=42
    ))
])

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model.fit(X_train, y_train)

score = model.score(X_test, y_test)

joblib.dump(model, MODEL_PATH)

print(f"Modelo salvo em: {MODEL_PATH}")
print(f"Score R² no teste: {score:.4f}")