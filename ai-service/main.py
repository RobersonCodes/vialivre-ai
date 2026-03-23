import os
import joblib
import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "modelo_risco.pkl")

app = FastAPI(title="ViaLivre AI Service")

model = joblib.load(MODEL_PATH)

class AnalysisInput(BaseModel):
    origem: str
    destino: str
    hora: int
    clima: str
    transporte: str
    distancia_km: float
    tempo_base: int

@app.get("/")
def home():
    return {
        "service": "ViaLivre AI Service",
        "status": "online"
    }

@app.post("/predict")
def predict(data: AnalysisInput):
    input_df = pd.DataFrame([{
        "origem": data.origem,
        "destino": data.destino,
        "hora": data.hora,
        "clima": data.clima,
        "transporte": data.transporte,
        "distancia_km": data.distancia_km,
        "tempo_base": data.tempo_base
    }])

    risco = float(model.predict(input_df)[0])
    risco = max(0, min(100, round(risco, 2)))

    if risco >= 75:
        trafego = "intenso"
        classificacao = "Cenário crítico"
    elif risco >= 40:
        trafego = "moderado"
        classificacao = "Cenário de atenção"
    else:
        trafego = "leve"
        classificacao = "Cenário favorável"

    chance_leve = max(0, 100 - round(risco))

    return {
        "risco": risco,
        "trafego": trafego,
        "chanceLeve": chance_leve,
        "classificacaoIA": classificacao
    }