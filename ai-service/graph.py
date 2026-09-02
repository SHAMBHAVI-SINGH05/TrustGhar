import os
import re
import json
import time
import nest_asyncio
from typing import TypedDict
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, LLM
from langgraph.graph import StateGraph, START, END
from tools import web_search, news_search, legal_search,web_open

nest_asyncio.apply()
load_dotenv()

groq_llm = LLM(
    model="openai/gpt-oss-120b",
    provider="openai",
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)


class InvestigationState(TypedDict):
    address: str
    type: str
    uploaded_document_text: str
    rera_status: str
    fraud_status: str
    fraud_graph: dict
    document_status: str
    final_report: str
    trust_score: int
    rera_score: int
    fraud_score: int
    document_score: int


rera_agent = Agent(
    role="RERA Compliance Investigator",
    goal="Find real RERA registration data, complaints, and builder compliance status using web search and legal knowledge",
    backstory=(
        "You are a senior Indian real estate compliance researcher. You never guess or assume. "
        "You always search the web to find actual RERA registration data, complaints filed, "
        "and builder track records from official portals and news sources. "
        "You also use the RERA Legal Search tool to cite the exact RERA Act provisions that apply."
    ),
    tools=[web_search, news_search, legal_search,web_open],
    llm=groq_llm,
    max_iter=7,
)

fraud_agent = Agent(
    role="Fraud & Risk Investigator",
    goal="Find real fraud cases, court orders, FIRs, and scam reports about the builder using web search",
    backstory=(
        "You are a financial fraud investigator specializing in Indian real estate. "
        "You search for actual news articles, court cases, consumer complaints, and FIRs "
        "filed against builders. You never make up data — you report only what you find."
    ),
    tools=[web_search, news_search],
    llm=groq_llm,
    max_iter=7,
)

document_agent = Agent(
    role="Property Document Risk Analyst",
    goal="Find real buyer complaints, possession delays, and risky clauses — and cite the exact RERA law that applies",
    backstory=(
        "You are a property lawyer who investigates document risks. You search for buyer complaints "
        "and possession delay reports. You also use the RERA Legal Search tool to find the exact "
        "legal provision that applies — so buyers know their rights under the actual law."
    ),
    tools=[web_search, news_search, legal_search,web_open],
    llm=groq_llm,
    max_iter=7,
)

report_agent = Agent(
    role="Investigation Report Writer",
    goal="Write a clear, honest trust verdict with accurate numeric scores based only on what the other agents actually found",
    backstory=(
        "You are a senior analyst who writes the final property trust report for Indian home buyers. "
        "You synthesize findings from RERA, fraud, and document agents into one clear verdict with "
        "accurate risk scores. You are honest about what was found and what could not be verified."
    ),
    llm=groq_llm,
)


def _parse_score(label: str, text: str, default: int = 60) -> int:
    match = re.search(rf'{label}:\s*(\d+)', text, re.IGNORECASE)
    if match:
        return max(0, min(100, int(match.group(1))))
    return default


def _clean_agent_text(text: str) -> str:
    # Groq's models sometimes write out their tool-call attempt as
    # plain text (e.g. <function(web_search)>{"query": "..."}</function>)
    # instead of invoking the tool silently. Strip that leftover artifact
    # so it never reaches the UI or the PDF report.
    return re.sub(r'<function\([^)]*\)>.*?</function>', '', text, flags=re.DOTALL).strip()


_RETRY_AFTER_PATTERN = re.compile(r'try again in ([\d.]+)\s*(s|m)', re.IGNORECASE)


def _kickoff_with_retry(crew, max_retries: int = 3):
    for attempt in range(max_retries + 1):
        try:
            return crew.kickoff()
        except Exception as e:
            message = str(e)
            if 'Request too large' in message:
                raise
            if attempt >= max_retries:
                raise
            if 'tool_use_failed' in message.lower() or 'tool choice is none' in message.lower():
                # gpt-oss-120b occasionally hallucinates a call to a tool that
                # was never registered (e.g. "web_open") when asked to wrap up.
                # Retrying restarts the task fresh, which usually samples a
                # different — valid — response instead of repeating it.
                print(f"[retry] model hallucinated an unregistered tool call — retrying (attempt {attempt + 1}/{max_retries})")
                time.sleep(2)
                continue
            match = _RETRY_AFTER_PATTERN.search(message)
            if match:
                wait = min(float(match.group(1)) * (60 if match.group(2).lower() == 'm' else 1), 60)
            elif 'rate_limit' in message.lower():
                wait = 2 ** attempt  # exponential backoff: 1s, 2s, 4s
            else:
                raise  # not a rate-limit error at all — don't retry unrelated failures
            time.sleep(wait + 1)

def rera_node(state: InvestigationState):
    address = state["address"]
    task = Task(
        description=(
            f"Investigate the RERA compliance status of this property: '{address}'.\n\n"
            f"Step 1 — Web search:\n"
            f"1. Builder name + 'RERA registration India'\n"
            f"2. Builder name + 'RERA complaint'\n"
            f"3. Property name + 'RERA certificate'\n\n"
            f"Step 2 — Legal search:\n"
            f"Use the RERA Legal Search tool to find what RERA says about mandatory registration "
            f"and what rights buyers have to demand the registration number.\n\n"
            f"Report:\n"
            f"- RERA registration status (number if found)\n"
            f"- Complaint count if available\n"
            f"- Relevant RERA legal provision that applies\n"
            f"- What the builder did / did not comply with"
        ),
        expected_output=(
            "4-6 sentences reporting actual RERA findings from web search plus the specific "
            "RERA Act section that applies to the registration status found."
        ),
        agent=rera_agent,
    )
    result = _kickoff_with_retry(Crew(agents=[rera_agent], tasks=[task]))
    return {"rera_status": _clean_agent_text(str(result))}


def fraud_node(state: InvestigationState):
    time.sleep(15)
    address = state["address"]
    rera_excerpt = state['rera_status'][:200]
    task = Task(
        description=(
            f"Investigate fraud and legal risks for this property: '{address}'.\n"
            f"Context from RERA check: {rera_excerpt}\n\n"
            f"Use web search and news search to find:\n"
            f"1. Builder name + 'fraud case India'\n"
            f"2. Builder name + 'FIR filed buyers cheated'\n"
            f"3. Builder name + 'court case possession delay'\n"
            f"4. Property name + 'scam complaint'\n"
            f"5. Builder name + 'insolvency NCLT'\n\n"
            f"Also note any REAL ownership/corporate connections found (subsidiaries, group companies, "
            f"directors/promoters, other projects by the same builder) — only if search results show an "
            f"actual ownership/directorship/'also developed by' link, never just a shared name or area. "
            f"If no genuine connections exist, list only the builder as a single node with no edges.\n\n"
            f"Report what you actually find:\n"
            f"- Any active fraud cases or FIRs\n"
            f"- Court orders against the builder\n"
            f"- Consumer forum complaints\n"
            f"- Financial health signals\n"
            f"- Overall fraud risk: Low / Medium / High\n\n"
            f"Output ONLY valid JSON in exactly this format, nothing else:\n"
            f'{{"summary": "4-6 sentences reporting actual fraud findings, specific cases and sources '
            f'where found, and overall fraud risk level", '
            f'"graph": {{"nodes": [{{"id": "string", "label": "entity name", "type": one of exactly '
            f'"builder", "subsidiary", "director", or "project" — no other values allowed}}], '
            f'"edges": [{{"source": "node id", "target": "node id", "relation": one of exactly '
            f'"subsidiary_of", "director_of", or "also_developed" — no other values allowed, and only for '
            f'genuine ownership/corporate links, never location or name coincidences}}]}}}}'
        ),
        expected_output=(
            "Valid JSON with a summary string reporting actual fraud findings and a graph object "
            "containing nodes and edges for real entities found during the search."
        ),
        agent=fraud_agent,
    )
    result_text = _clean_agent_text(str(_kickoff_with_retry(Crew(agents=[fraud_agent], tasks=[task]))))

    try:
        json_match = re.search(r'\{[\s\S]*\}', result_text)
        if json_match:
            parsed = json.loads(json_match.group())
            return {
                "fraud_status": _clean_agent_text(parsed.get("summary", result_text)),
                "fraud_graph": parsed.get("graph", {"nodes": [], "edges": []}),
            }
    except Exception:
        pass

    return {"fraud_status": result_text, "fraud_graph": {"nodes": [], "edges": []}}


def document_node(state: InvestigationState):
    time.sleep(15)
    uploaded_text = state.get("uploaded_document_text", "")

    if uploaded_text:
        task = Task(
            description=(
                f"Analyze this real uploaded property document for risky clauses and missing "
                f"buyer protections:\n\n"
                f"--- DOCUMENT TEXT ---\n{uploaded_text[:6000]}\n--- END ---\n\n"
                f"Use the RERA Legal Search tool to check each risky clause you find against the "
                f"actual RERA law that applies to it.\n\n"
                f"Report:\n"
                f"- The key risky clauses actually present in this document, quoting them briefly\n"
                f"- The RERA section that applies to each\n"
                f"- Any important buyer protections that are missing from this document\n"
                f"- Overall document risk: Low / Medium / High"
            ),
            expected_output=(
                "4-6 sentences reporting the actual risky clauses found in the uploaded document, "
                "quoting them briefly, citing the RERA section that applies to each, noting missing "
                "buyer protections, and an overall risk verdict."
            ),
            agent=document_agent,
        )
    else:
        address = state["address"]
        task = Task(
            description=(
                f"Investigate document risks and buyer complaints for: '{address}'.\n\n"
                f"Step 1 — Web search:\n"
                f"1. Builder name + 'possession delay complaint'\n"
                f"2. Builder name + 'sale deed clause problem'\n"
                f"3. Property name + 'buyer review complaint'\n"
                f"4. Builder name + 'OC certificate delay'\n\n"
                f"Step 2 — Legal search:\n"
                f"Use the RERA Legal Search tool to find:\n"
                f"- What RERA says about possession delays and the penalty the builder must pay\n"
                f"- What the law says about force majeure clauses\n"
                f"- What an Occupancy Certificate (OC) is and why it matters\n\n"
                f"Report what buyer complaints you found AND cite the actual RERA law that gives "
                f"the buyer rights in each situation."
            ),
            expected_output=(
                "4-6 sentences reporting real buyer complaints found online, the key documents to verify, "
                "and the specific RERA legal provision that protects the buyer for each risk identified."
            ),
            agent=document_agent,
        )

    result = _kickoff_with_retry(Crew(agents=[document_agent], tasks=[task]))
    return {"document_status": _clean_agent_text(str(result))}


def report_node(state: InvestigationState):
    time.sleep(15)
    rera_ran = state["type"] in ("full", "quick")
    fraud_ran = state["type"] == "full"
    document_ran = state["type"] in ("full", "document")

    findings_section = ""
    if rera_ran:
        findings_section += f"RERA CHECK:\n{state['rera_status']}\n\n"
    if fraud_ran:
        findings_section += f"FRAUD CHECK:\n{state['fraud_status']}\n\n"
    if document_ran:
        findings_section += f"DOCUMENT RISK:\n{state['document_status']}\n\n"

    score_format = "TRUST_SCORE: [0-100 overall trust score — higher means safer]\n"
    if rera_ran:
        score_format += "RERA_SCORE: [0-100 based on RERA compliance found]\n"
    if fraud_ran:
        score_format += "FRAUD_SCORE: [0-100 based on fraud findings — higher means less fraud risk]\n"
    if document_ran:
        score_format += "DOCUMENT_SCORE: [0-100 based on document risks found]\n"
    score_format += "VERDICT: [exactly one of: Safe / Caution / Do Not Proceed]\n"

    expected_scores = ["TRUST_SCORE"]
    if rera_ran:
        expected_scores.append("RERA_SCORE")
    if fraud_ran:
        expected_scores.append("FRAUD_SCORE")
    if document_ran:
        expected_scores.append("DOCUMENT_SCORE")

    task = Task(
        description=(
            f"Write the final trust report for property: '{state['address']}'\n\n"
            f"Based on these actual investigation findings:\n\n"
            f"{findings_section}"
            f"You must output EXACTLY in this format:\n\n"
            f"{score_format}\n"
            f"REPORT:\n"
            f"[3-4 sentences in plain English for an Indian home buyer. State the overall trust "
            f"level, mention the 2-3 most important findings, give one specific action to take. "
            f"Only comment on checks that were actually run — do not mention or guess at findings "
            f"for checks that were skipped.]"
        ),
        expected_output=(
            f"Structured output with {', '.join(expected_scores)}, VERDICT "
            "followed by REPORT section with 3-4 sentence plain English verdict."
        ),
        agent=report_agent,
    )
    result = _kickoff_with_retry(Crew(agents=[report_agent], tasks=[task]))
    result_text = _clean_agent_text(str(result))

    report_match = re.search(r'REPORT:\s*\n(.*)', result_text, re.DOTALL | re.IGNORECASE)
    report_text = report_match.group(1).strip() if report_match else result_text

    output = {
        "final_report": report_text,
        "trust_score": _parse_score("TRUST_SCORE", result_text, 60),
    }
    if rera_ran:
        output["rera_score"] = _parse_score("RERA_SCORE", result_text, 60)
    if fraud_ran:
        output["fraud_score"] = _parse_score("FRAUD_SCORE", result_text, 60)
    if document_ran:
        output["document_score"] = _parse_score("DOCUMENT_SCORE", result_text, 60)

    return output


def route_start(state: InvestigationState):
    if state["type"] == "document":
        return "document_check"
    return "rera_check"


def route_after_rera(state: InvestigationState):
    if state["type"] == "quick":
        return "generate_report"
    return "fraud_check"


graph = StateGraph(InvestigationState)
graph.add_node("rera_check", rera_node)
graph.add_node("fraud_check", fraud_node)
graph.add_node("document_check", document_node)
graph.add_node("generate_report", report_node)

graph.add_conditional_edges(START, route_start, ["rera_check", "document_check"])
graph.add_conditional_edges("rera_check", route_after_rera, ["fraud_check", "generate_report"])
graph.add_edge("fraud_check", "document_check")
graph.add_edge("document_check", "generate_report")
graph.add_edge("generate_report", END)

investigation_graph = graph.compile()


if __name__ == "__main__":
    result = investigation_graph.invoke({
        "address": "Prestige Towers, Whitefield, Bangalore",
        "type": "full",
        "uploaded_document_text": "",
        "rera_status": "",
        "fraud_status": "",
        "fraud_graph": {},
        "document_status": "",
        "final_report": "",
        "trust_score": 0,
        "rera_score": 0,
        "fraud_score": 0,
        "document_score": 0,
    })
    print("\nRERA:\n", result["rera_status"])
    print("\nFRAUD:\n", result["fraud_status"])
    print("\nFRAUD GRAPH:\n", result["fraud_graph"])
    print("\nDOCUMENTS:\n", result["document_status"])
    print(f"\nSCORES: Trust={result['trust_score']} RERA={result['rera_score']} Fraud={result['fraud_score']} Doc={result['document_score']}")
    print("\nFINAL REPORT:\n", result["final_report"])
