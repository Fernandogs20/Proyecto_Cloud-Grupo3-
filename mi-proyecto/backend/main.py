from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware  
from jose import jwt
import subprocess
from pydantic import BaseModel

app = FastAPI()

class TopologiaParams(BaseModel):
    name_topology: str  
    vlan1: int       
    vlan2: int    
    port: int    

class BorrarParams(BaseModel):
    name_topology: str  

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)
security = HTTPBearer()

KEYCLOAK_URL = "http://keycloak:8080/realms/mi-reino/protocol/openid-connect/certs"

async def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.get_unverified_claims(token)
        return payload
    except Exception:
        raise HTTPException(status_code=status.HTTP_413_UNAUTHORIZED, detail="Token inválido")

@app.post("/crear-topologia")
def crear_topologia(
    params: TopologiaParams,
    user: dict = Depends(verificar_token)
):
    try:
        comando = [
            "bash", 
            "./telecloud-orchestrator/scripts/create_ex1_slice.sh",
            params.name_topology,
            str(params.vlan1),
            str(params.vlan2),
            str(params.port)
        ]
        resultado = subprocess.run(comando, capture_output=True, text=True)
        exito = (resultado.returncode == 0)
        
        return {"ejecucion_exitosa": exito}
        
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/borrar-topologia")
def borrar_topologia(params: BorrarParams, user: dict = Depends(verificar_token)):
    try:
        comando = [
            "bash", 
            "./telecloud-orchestrator/scripts/delete_ex1_slice.sh", 
            params.name_topology
        ]
        resultado = subprocess.run(comando, capture_output=True, text=True)
        exito = (resultado.returncode == 0)
        
        return {"ejecucion_exitosa": exito}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))