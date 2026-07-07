import re
import json
import fitz  # PyMuPDF
from crewai import Agent, Task, Crew
from tools import legal_search


def extract_text_from_pdf(file_bytes: bytes) -> str:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


def analyze_document(file_bytes: bytes, groq_llm) -> dict:
    text = extract_text_from_pdf(file_bytes)

    if not text:
        return {
            "status": "failed",
            "error": "Could not extract text from this PDF. It may be a scanned image.",
        }

    # Truncate to avoid exceeding LLM context window
    if len(text) > 6000:
        text = text[:6000] + "\n\n[...document truncated for analysis...]"

    agent = Agent(
        role="Property Document Lawyer",
        goal="Analyze sale deed and property document clauses for RERA compliance and buyer risk",
        backstory=(
            "You are a senior property lawyer in India specializing in RERA compliance. "
            "You read sale deeds and flag clauses that harm buyers or violate RERA. "
            "You always use the RERA Legal Search tool to find the exact law that applies "
            "to each clause you identify."
        ),
        tools=[legal_search],
        llm=groq_llm,
    )

    task = Task(
        description=(
            f"Analyze this property document for risky clauses:\n\n"
            f"--- DOCUMENT TEXT ---\n{text}\n--- END ---\n\n"
            f"Look for these clause types, but ONLY include a clause in your output if you can quote "
            f"actual text for it from the document above. Do NOT invent an entry for a clause type that "
            f"is not actually present in the text.\n"
            f"1. Force Majeure — is it overly broad beyond genuine disasters?\n"
            f"2. Possession Delay Penalty — does it protect the buyer with adequate compensation?\n"
            f"3. Advance Payment — does builder demand more than 10% before signed agreement? (RERA violation)\n"
            f"4. Unilateral Modification — can builder change flat specs without buyer consent?\n"
            f"5. Occupancy Certificate (OC) — is possession tied to OC being obtained?\n"
            f"6. Dispute Resolution — is the clause fair and accessible to the buyer?\n"
            f"7. Maintenance Charges — are maintenance rates fixed or can builder raise them unilaterally?\n\n"
            f"For each clause you actually find in the document:\n"
            f"- Use RERA Legal Search to find the applicable RERA section\n"
            f"- Quote the actual clause text (max 150 characters)\n"
            f"- Rate risk: low, medium, or high\n"
            f"- Explain in one sentence why it is risky for the buyer\n"
            f"- Cite the RERA section that applies\n\n"
            f"Separately, check which of these BUYER-PROTECTIVE clause types are completely absent from "
            f"the document: Possession Delay Penalty, Unilateral Modification consent, Occupancy Certificate "
            f"tied to possession, Dispute Resolution. For each one that is missing, add an entry explaining "
            f"in one sentence why its absence could hurt the buyer. Do not rate these with a risk level or "
            f"cite a RERA section — there is no clause text to cite against.\n\n"
            f"Output ONLY valid JSON in exactly this format, nothing else:\n"
            f'{{"clauses": [{{"type": "string", "text": "quoted clause text", "risk": "low|medium|high", "explanation": "one sentence", "rera_section": "Section X — Title"}}], '
            f'"missing_protections": [{{"type": "string", "explanation": "one sentence on why this absence could hurt the buyer"}}], '
            f'"overall_risk": "low|medium|high", "summary": "2-3 sentences in plain English for a home buyer"}}'
        ),
        expected_output="Valid JSON with clauses array, missing_protections array, overall_risk, and summary",
        agent=agent,
    )

    crew = Crew(agents=[agent], tasks=[task])
    result_text = str(crew.kickoff())

    # Extract JSON from result
    try:
        json_match = re.search(r'\{[\s\S]*\}', result_text)
        if json_match:
            parsed = json.loads(json_match.group())
            parsed["status"] = "complete"
            return parsed
    except Exception:
        pass

    # If JSON parsing fails, return the raw text wrapped
    return {
        "status": "complete",
        "clauses": [],
        "missing_protections": [],
        "overall_risk": "medium",
        "summary": result_text[:600],
    }
