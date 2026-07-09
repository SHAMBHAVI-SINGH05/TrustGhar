import asyncio
import json
import os
import queue
import threading
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
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
    initial_state = {
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

    # The graph runs in its own thread and drops each finished agent's
    # output into this queue the moment it's ready, instead of only
    # returning once the entire pipeline is done.
    updates_queue = queue.Queue()

    def run_graph():
        for update in investigation_graph.stream(initial_state, stream_mode="updates"):
            updates_queue.put(update)
        updates_queue.put(None)  # signals the pipeline is fully done

    threading.Thread(target=run_graph, daemon=True).start()

    async def stream_updates():
        while True:
            update = await asyncio.to_thread(updates_queue.get)
            if update is None:
                break
            yield json.dumps(update) + "\n"

    return StreamingResponse(stream_updates(), media_type="application/x-ndjson")


@app.post("/analyze-document")
async def analyze_document_endpoint(file: UploadFile = File(...)):
    file_bytes = await file.read()
    result = await asyncio.to_thread(analyze_document, file_bytes, groq_llm)
    return result
