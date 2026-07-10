import re
import json
from crewai import Agent, Task, Crew
from tools import web_search, news_search
from listing_scraper import fetch_listing_text


def analyze_listing(url: str, groq_llm) -> dict:
    try:
        text = fetch_listing_text(url)
    except Exception as e:
        return {
            "status": "failed",
            "error": f"Could not load this listing page. It may be blocking automated access. ({e})",
        }

    if len(text) > 6000:
        text = text[:6000] + "\n\n[...listing text truncated for analysis...]"

    agent = Agent(
        role="Real Estate Fraud Investigator",
        goal="Examine a property listing for signs it may be fake, misleading, or a scam",
        backstory=(
            "You are an experienced Indian real estate fraud investigator. You read listing pages "
            "scraped from sites like MagicBricks and 99acres and look for realistic warning signs "
            "of fake or scam listings — not just any missing detail. You know that older resale "
            "properties (like DDA flats built decades ago) do not need RERA registration, so you "
            "only flag RERA absence for newer or under-construction projects where it would actually "
            "be required. You use web search to check whether the seller name, phone number, or "
            "property has been reported as a scam anywhere online."
        ),
        tools=[web_search, news_search],
        llm=groq_llm,
    )

    task = Task(
        description=(
            f"Analyze this property listing page text, scraped from: {url}\n\n"
            f"--- LISTING TEXT ---\n{text}\n--- END ---\n\n"
            f"Check for realistic warning signs of a fake or scam listing:\n"
            f"1. Price — is it suspiciously low or high compared to similar properties in the same area? "
            f"Use web search to check typical prices for this area if needed.\n"
            f"2. RERA — if this looks like a newer or under-construction project, is a RERA number "
            f"mentioned? (Do NOT flag this for older resale properties — RERA does not apply to them.)\n"
            f"3. Urgency / pressure language — does the description use high-pressure tactics?\n"
            f"4. Seller details — do the owner/seller details look vague, inconsistent, or suspicious? "
            f"Note: these listing sites always mask the full phone number behind a 'Get Phone No.' "
            f"button by default — a partially hidden number by itself is normal site behavior, NOT a "
            f"red flag. Only flag seller details if something is genuinely off, like no name given at "
            f"all, or inconsistent/implausible details.\n"
            f"5. Seller reputation — use web search on the seller's name and the property name/address "
            f"to check for any scam reports, complaints, or news coverage.\n\n"
            f"For each real red flag you find, explain it in one sentence. Only report red flags you "
            f"actually find — do not pad the output with entries for things that are simply not a "
            f"problem here.\n\n"
            f"Output ONLY valid JSON in exactly this format, nothing else:\n"
            f'{{"red_flags": [{{"type": "string", "explanation": "one sentence"}}], '
            f'"verdict": "likely genuine|use caution|likely fake", '
            f'"summary": "2-3 sentences in plain English for a home buyer"}}'
        ),
        expected_output="Valid JSON with red_flags array, verdict, and summary",
        agent=agent,
    )

    crew = Crew(agents=[agent], tasks=[task])
    result_text = str(crew.kickoff())

    try:
        json_match = re.search(r'\{[\s\S]*\}', result_text)
        if json_match:
            parsed = json.loads(json_match.group())
            parsed["status"] = "complete"
            return parsed
    except Exception:
        pass

    return {
        "status": "complete",
        "red_flags": [],
        "verdict": "use caution",
        "summary": result_text[:600],
    }
