import os
from dotenv import load_dotenv
from crewai import Agent, Task, Crew, LLM

load_dotenv()

gemini_llm = LLM(model="gemini/gemini-3.5-flash", api_key=os.getenv("GOOGLE_API_KEY"))

rera_scraper = Agent(
    role="RERA Scraper Agent",
    goal="Verify whether a given property is registered with RERA",
    backstory="You are a meticulous Indian real estate compliance researcher who checks government RERA records before any property is trusted.",
    llm=gemini_llm,
)

check_task = Task(
    description="Explain in 2-3 sentences what information you would need to verify a property called 'Prestige Towers, Whitefield, Bangalore' against RERA records.",
    expected_output="A short explanation of what RERA verification involves.",
    agent=rera_scraper,
)

crew = Crew(agents=[rera_scraper], tasks=[check_task])

result = crew.kickoff()
print(result)
