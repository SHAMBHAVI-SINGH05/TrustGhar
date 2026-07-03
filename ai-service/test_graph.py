from typing import TypedDict
from langgraph.graph import StateGraph, START, END


class InvestigationState(TypedDict):
    address: str
    rera_status: str
    fraud_status: str


def rera_node(state: InvestigationState):
    print(f"[RERA Agent] Checking: {state['address']}")
    return {"rera_status": "verified"}


def fraud_node(state: InvestigationState):
    print(f"[Fraud Agent] RERA status was '{state['rera_status']}', running fraud check...")
    return {"fraud_status": "no issues found"}


graph = StateGraph(InvestigationState)
graph.add_node("rera_check", rera_node)
graph.add_node("fraud_check", fraud_node)
graph.add_edge(START, "rera_check")
graph.add_edge("rera_check", "fraud_check")
graph.add_edge("fraud_check", END)

app = graph.compile()

result = app.invoke({"address": "Prestige Towers, Whitefield", "rera_status": "", "fraud_status": ""})
print(result)
