from crewai.tools import tool
from ddgs import DDGS
from rag import search_rera_law


@tool("Web Search")
def web_search(query: str) -> str:
    """Search the web for real information about a property, builder, or real estate fraud in India.
    Use this to find RERA registration data, builder complaints, reviews, and legal cases."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=5))
        if not results:
            return "No results found for this query."
        output = []
        for r in results:
            output.append(
                f"Title: {r.get('title', '')}\n"
                f"Info: {r.get('body', '')}\n"
                f"Source: {r.get('href', '')}"
            )
        return "\n\n---\n\n".join(output)
    except Exception as e:
        return f"Search failed: {str(e)}"


@tool("News Search")
def news_search(query: str) -> str:
    """Search for recent news articles about a builder, property developer, or real estate fraud case.
    Use this to find fraud cases, FIRs, court orders, and scam reports."""
    try:
        with DDGS() as ddgs:
            results = list(ddgs.news(query, max_results=5))
        if not results:
            return "No recent news found."
        output = []
        for r in results:
            output.append(
                f"Headline: {r.get('title', '')}\n"
                f"Source: {r.get('source', '')}\n"
                f"Summary: {r.get('body', '')}\n"
                f"Date: {r.get('date', '')}"
            )
        return "\n\n---\n\n".join(output)
    except Exception as e:
        return f"News search failed: {str(e)}"


@tool("RERA Legal Search")
def legal_search(query: str) -> str:
    """Search the RERA Act and Indian real estate law for relevant legal provisions.
    Use this to find what RERA says about possession delays, advance payments, OC certificates,
    encumbrance, force majeure clauses, complaint filing, or buyer rights."""
    try:
        return search_rera_law(query)
    except Exception as e:
        return f"Legal search failed: {str(e)}"
