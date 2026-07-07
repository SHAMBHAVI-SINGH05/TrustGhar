import asyncio
import os
from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from graph import investigation_graph, groq_llm
from document_analyzer import analyze_document

app = FastAPI()


class InvestigationRequest(BaseModel):
    address: str


@app.get("/")
def read_root():
    return {"message": "TrustGhar AI service is running"}


@app.post("/investigate")
async def investigate(request: InvestigationRequest):
    result = await asyncio.to_thread(
        investigation_graph.invoke,
        {
            "address": request.address,
            "rera_status": "",
            "fraud_status": "",
            "document_status": "",
            "final_report": "",
            "trust_score": 0,
            "rera_score": 0,
            "fraud_score": 0,
            "document_score": 0,
        }
    )
    return result


@app.post("/analyze-document")
async def analyze_document_endpoint(file: UploadFile = File(...)):
    file_bytes = await file.read()
    result = await asyncio.to_thread(analyze_document, file_bytes, groq_llm)
    return result
