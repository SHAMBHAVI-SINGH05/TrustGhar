import asyncio
import json
import os
import queue
import threading
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from graph import investigation_graph, groq_llm
from document_analyzer import analyze_document, extract_text_from_pdf
from listing_analyzer import analyze_listing
from report_qa import answer_question

app = FastAPI()


class InvestigationRequest(BaseModel):
    address: str
    type: str = "full"


class ListingRequest(BaseModel):
    url: str


class ReportQARequest(BaseModel):
    address: str
    report_context: str
    question: str
    chat_history: list[dict] = []


@app.get("/")
def read_root():
    return {"message": "TrustGhar AI service is running"}


def stream_investigation(initial_state: dict) -> StreamingResponse:
    # The graph runs in its own thread and drops each finished agent's
    # output into this queue the moment it's ready, instead of only
    # returning once the entire pipeline is done.
    updates_queue = queue.Queue()

    def run_graph():
        try:
            for update in investigation_graph.stream(initial_state, stream_mode="updates"):
                updates_queue.put(update)
        except Exception as e:
            updates_queue.put({"error": str(e)})
        updates_queue.put(None)  # signals the pipeline is fully done

    threading.Thread(target=run_graph, daemon=True).start()

    async def stream_updates():
        while True:
            update = await asyncio.to_thread(updates_queue.get)
            if update is None:
                break
            yield json.dumps(update) + "\n"

    return StreamingResponse(stream_updates(), media_type="application/x-ndjson")


def build_initial_state(address: str, type_: str, uploaded_document_text: str = "") -> dict:
    return {
        "address": address,
        "type": type_,
        "uploaded_document_text": uploaded_document_text,
        "rera_status": "",
        "fraud_status": "",
        "document_status": "",
        "final_report": "",
        "trust_score": 0,
        "rera_score": 0,
        "fraud_score": 0,
        "document_score": 0,
    }


@app.post("/investigate")
async def investigate(request: InvestigationRequest):
    initial_state = build_initial_state(request.address, request.type)
    return stream_investigation(initial_state)


@app.post("/investigate-with-document")
async def investigate_with_document(
    address: str = Form(...),
    type: str = Form("document"),
    file: UploadFile = File(...),
):
    file_bytes = await file.read()
    document_text = await asyncio.to_thread(extract_text_from_pdf, file_bytes)
    initial_state = build_initial_state(address, type, document_text)
    return stream_investigation(initial_state)


@app.post("/analyze-document")
async def analyze_document_endpoint(file: UploadFile = File(...)):
    file_bytes = await file.read()
    result = await asyncio.to_thread(analyze_document, file_bytes, groq_llm)
    return result


@app.post("/check-listing")
async def check_listing_endpoint(request: ListingRequest):
    result = await asyncio.to_thread(analyze_listing, request.url, groq_llm)
    return result


@app.post("/report-qa")
async def report_qa_endpoint(request: ReportQARequest):
    answer = await asyncio.to_thread(
        answer_question, request.address, request.report_context, request.question, request.chat_history
    )
    return {"answer": answer}
