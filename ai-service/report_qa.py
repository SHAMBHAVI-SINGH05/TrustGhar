from crewai import Agent, Task, Crew
from graph import groq_llm
from tools import legal_search,web_open

qa_agent = Agent(
    role="Property Report Q&A Assistant",
    goal="Answer the buyer's question about their property investigation report accurately, using only the real findings already in the report",
    backstory=(
        "You are a helpful assistant answering follow-up questions about a property trust report "
        "that has already been generated. You never invent new facts — you answer strictly from the "
        "report findings given to you. If a question asks about the law (RERA sections, buyer rights, "
        "penalties), you use the RERA Legal Search tool to cite the exact provision. If the answer "
        "isn't in the report and isn't a legal question, say plainly that it wasn't covered by this "
        "investigation."
    ),
    tools=[legal_search,web_open],
    llm=groq_llm,
)


def answer_question(address: str, report_context: str, question: str, chat_history: list[dict]) -> str:
    history_text = ""
    if chat_history:
        lines = [f"{m['role'].upper()}: {m['text']}" for m in chat_history[-6:]]
        history_text = "Previous conversation:\n" + "\n".join(lines) + "\n\n"

    task = Task(
        description=(
            f"Property: '{address}'\n\n"
            f"Full investigation report and findings:\n{report_context}\n\n"
            f"{history_text}"
            f"Buyer's question: {question}\n\n"
            f"Answer using ONLY the findings above. Use the RERA Legal Search tool only if the "
            f"question is about a legal provision, buyer right, or penalty not already covered in "
            f"the findings. Do not invent facts that aren't in the report."
        ),
        expected_output=(
            "A direct 2-4 sentence answer to the buyer's question, grounded only in the report "
            "findings and, if relevant, the exact RERA provision cited."
        ),
        agent=qa_agent,
    )
    result = Crew(agents=[qa_agent], tasks=[task]).kickoff()
    return str(result).strip()
