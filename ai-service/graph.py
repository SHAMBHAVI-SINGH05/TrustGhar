import os
import re
import time
import nest_asyncio
from typing import TypedDict
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, LLM
from langgraph.graph import StateGraph, START, END
from tools import web_search, news_search, legal_search

nest_asyncio.apply()
load_dotenv()

groq_llm = LLM(
    model="llama-3.3-70b-versatile",
    provider="openai",
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)


class InvestigationState(TypedDict):
    address: str
    rera_status: str
    fraud_status: str
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
    tools=[web_search, news_search, legal_search],
    llm=groq_llm,
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
)

document_agent = Agent(
    role="Property Document Risk Analyst",
    goal="Find real buyer complaints, possession delays, and risky clauses — and cite the exact RERA law that applies",
    backstory=(
        "You are a property lawyer who investigates document risks. You search for buyer complaints "
        "and possession delay reports. You also use the RERA Legal Search tool to find the exact "
        "legal provision that applies — so buyers know their rights under the actual law."
    ),
    tools=[web_search, news_search, legal_search],
    llm=groq_llm,
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
    result = Crew(agents=[rera_agent], tasks=[task]).kickoff()
    return {"rera_status": str(result)}


def fraud_node(state: InvestigationState):
    time.sleep(15)
    address = state["address"]
    task = Task(
        description=(
            f"Investigate fraud and legal risks for this property: '{address}'.\n"
            f"Context from RERA check: {state['rera_status']}\n\n"
            f"Use web search and news search to find:\n"
            f"1. Builder name + 'fraud case India'\n"
            f"2. Builder name + 'FIR filed buyers cheated'\n"
            f"3. Builder name + 'court case possession delay'\n"
            f"4. Property name + 'scam complaint'\n"
            f"5. Builder name + 'insolvency NCLT'\n\n"
            f"Report what you actually find:\n"
            f"- Any active fraud cases or FIRs\n"
            f"- Court orders against the builder\n"
            f"- Consumer forum complaints\n"
            f"- Financial health signals\n"
            f"- Overall fraud risk: Low / Medium / High"
        ),
        expected_output=(
            "4-6 sentences reporting actual fraud findings. Include specific cases and sources where found. "
            "State overall fraud risk level."
        ),
        agent=fraud_agent,
    )
    result = Crew(agents=[fraud_agent], tasks=[task]).kickoff()
    return {"fraud_status": str(result)}


def document_node(state: InvestigationState):
    time.sleep(15)
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
    result = Crew(agents=[document_agent], tasks=[task]).kickoff()
    return {"document_status": str(result)}


def report_node(state: InvestigationState):
    time.sleep(15)
    task = Task(
        description=(
            f"Write the final trust report for property: '{state['address']}'\n\n"
            f"Based on these actual investigation findings:\n\n"
            f"RERA CHECK:\n{state['rera_status']}\n\n"
            f"FRAUD CHECK:\n{state['fraud_status']}\n\n"
            f"DOCUMENT RISK:\n{state['document_status']}\n\n"
            f"You must output EXACTLY in this format:\n\n"
            f"TRUST_SCORE: [0-100 overall trust score — higher means safer]\n"
            f"RERA_SCORE: [0-100 based on RERA compliance found]\n"
            f"FRAUD_SCORE: [0-100 based on fraud findings — higher means less fraud risk]\n"
            f"DOCUMENT_SCORE: [0-100 based on document risks found]\n"
            f"VERDICT: [exactly one of: Safe / Caution / Do Not Proceed]\n\n"
            f"REPORT:\n"
            f"[3-4 sentences in plain English for an Indian home buyer. State the overall trust "
            f"level, mention the 2-3 most important findings, give one specific action to take.]"
        ),
        expected_output=(
            "Structured output with TRUST_SCORE, RERA_SCORE, FRAUD_SCORE, DOCUMENT_SCORE, VERDICT "
            "followed by REPORT section with 3-4 sentence plain English verdict."
        ),
        agent=report_agent,
    )
    result = Crew(agents=[report_agent], tasks=[task]).kickoff()
    result_text = str(result)

    trust_score = _parse_score("TRUST_SCORE", result_text, 60)
    rera_score = _parse_score("RERA_SCORE", result_text, 60)
    fraud_score = _parse_score("FRAUD_SCORE", result_text, 60)
    document_score = _parse_score("DOCUMENT_SCORE", result_text, 60)

    report_match = re.search(r'REPORT:\s*\n(.*)', result_text, re.DOTALL | re.IGNORECASE)
    report_text = report_match.group(1).strip() if report_match else result_text

    return {
        "final_report": report_text,
        "trust_score": trust_score,
        "rera_score": rera_score,
        "fraud_score": fraud_score,
        "document_score": document_score,
    }


graph = StateGraph(InvestigationState)
graph.add_node("rera_check", rera_node)
graph.add_node("fraud_check", fraud_node)
graph.add_node("document_check", document_node)
graph.add_node("generate_report", report_node)

graph.add_edge(START, "rera_check")
graph.add_edge("rera_check", "fraud_check")
graph.add_edge("fraud_check", "document_check")
graph.add_edge("document_check", "generate_report")
graph.add_edge("generate_report", END)

investigation_graph = graph.compile()


if __name__ == "__main__":
    result = investigation_graph.invoke({
        "address": "Prestige Towers, Whitefield, Bangalore",
        "rera_status": "",
        "fraud_status": "",
        "document_status": "",
        "final_report": "",
        "trust_score": 0,
        "rera_score": 0,
        "fraud_score": 0,
        "document_score": 0,
    })
    print("\nRERA:\n", result["rera_status"])
    print("\nFRAUD:\n", result["fraud_status"])
    print("\nDOCUMENTS:\n", result["document_status"])
    print(f"\nSCORES: Trust={result['trust_score']} RERA={result['rera_score']} Fraud={result['fraud_score']} Doc={result['document_score']}")
    print("\nFINAL REPORT:\n", result["final_report"])
