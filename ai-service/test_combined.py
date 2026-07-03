import os
from typing import TypedDict
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, LLM
from langgraph.graph import StateGraph, START, END

load_dotenv()

gemini_llm = LLM(model="gemini/gemini-3.5-flash", api_key=os.getenv("GOOGLE_API_KEY"))

rera_agent = Agent(
    role="RERA Scraper Agent",
    goal="Verify whether a given property is registered with RERA",
    backstory="You are a meticulous Indian real estate compliance researcher.",
    llm=gemini_llm,
)


class InvestigationState(TypedDict):
    address: str
    rera_status: str
    fraud_status: str


def rera_node(state: InvestigationState):
    task = Task(
        description=f"In one sentence, state whether '{state['address']}' sounds like a real, plausible Indian property address that could be RERA-checked.",
        expected_output="One short sentence.",
        agent=rera_agent,
    )
    crew = Crew(agents=[rera_agent], tasks=[task])
    result = crew.kickoff()
    return {"rera_status": str(result)}


def fraud_node(state: InvestigationState):
    print(f"[Fraud Agent] Received RERA result: {state['rera_status']}")
    return {"fraud_status": "no issues found"}


graph = StateGraph(InvestigationState)
graph.add_node("rera_check", rera_node)
graph.add_node("fraud_check", fraud_node)
graph.add_edge(START, "rera_check")
graph.add_edge("rera_check", "fraud_check")
graph.add_edge("fraud_check", END)

app = graph.compile()

result = app.invoke({"address": "Prestige Towers, Whitefield, Bangalore", "rera_status": "", "fraud_status": ""})
print("\nFINAL STATE:", result)
