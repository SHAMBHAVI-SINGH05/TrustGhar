import chromadb
from chromadb.utils import embedding_functions

RERA_CHUNKS = [
    {
        "id": "s3_registration",
        "section": "Section 3 — Mandatory Registration",
        "text": (
            "Section 3: No promoter shall advertise, market, book, sell or offer for sale any plot, "
            "apartment or building in any real estate project without first registering the project "
            "with RERA. Any booking taken before RERA registration is illegal. The buyer has the "
            "right to demand the RERA registration number before paying any amount."
        ),
    },
    {
        "id": "s13_advance",
        "section": "Section 13 — Advance Payment Cap",
        "text": (
            "Section 13: A promoter shall not accept more than ten percent (10%) of the cost of the "
            "apartment, plot, or building as advance payment or application fees from a person without "
            "first entering into a written agreement for sale. Demanding more than 10% before signing "
            "the agreement is a RERA violation."
        ),
    },
    {
        "id": "s11_duties",
        "section": "Section 11 — Promoter Duties",
        "text": (
            "Section 11: The promoter must make all approved plans, layout plans, and specifications "
            "available for inspection by allottees. The promoter must also maintain 70% of all amounts "
            "received from buyers in a dedicated escrow account to be used only for that project's "
            "construction. Diverting funds from this escrow account is a criminal offence under RERA."
        ),
    },
    {
        "id": "s12_no_alteration",
        "section": "Section 12 — No Alterations Without Consent",
        "text": (
            "Section 12: The promoter shall not make any additions or alterations in the sanctioned "
            "plans, layout plans, and specifications of the apartment without the previous written "
            "consent of the allottee. Any unilateral change in flat size, layout, or amenities "
            "without the buyer's written consent is a violation."
        ),
    },
    {
        "id": "s18_delay_penalty",
        "section": "Section 18 — Possession Delay Penalty",
        "text": (
            "Section 18: If the promoter fails to give possession of an apartment on the date agreed "
            "in the sale agreement, the promoter is liable to pay interest to the allottee at the "
            "rate of SBI MCLR plus 2% per annum — currently approximately 10.75% per annum — from "
            "the date the possession was due until actual possession is given. The buyer can also "
            "choose to withdraw from the project and get a full refund with this interest."
        ),
    },
    {
        "id": "s18_defects",
        "section": "Section 18 — Structural Defect Liability",
        "text": (
            "Section 18: If any structural defect or defect in workmanship, quality, or provision of "
            "services is brought to the notice of the promoter within five years of handing over "
            "possession, the promoter shall rectify such defects without any further charge within "
            "thirty days of receiving the complaint."
        ),
    },
    {
        "id": "s14_false_ads",
        "section": "Section 14 — False Advertisement",
        "text": (
            "Section 14: If a promoter provides false information in any advertisement or prospectus, "
            "or makes any false statement or false representation, the allottee who has relied on "
            "such false information has the right to withdraw from the project and claim a full "
            "refund of all money paid with interest at MCLR plus 2%."
        ),
    },
    {
        "id": "oc_certificate",
        "section": "Occupancy Certificate (OC)",
        "text": (
            "The promoter must obtain an Occupancy Certificate (OC) from the local municipal authority "
            "before offering possession to the buyer. An OC certifies that the building is constructed "
            "as per approved plans and is safe to occupy. A buyer must not take possession without OC "
            "as the building is legally unauthorised without it and can attract demolition orders. "
            "Handing over possession without OC is a RERA violation."
        ),
    },
    {
        "id": "encumbrance",
        "section": "Encumbrance Certificate",
        "text": (
            "An Encumbrance Certificate (EC) shows all registered transactions against a property "
            "including mortgages, loans, and liens. Before buying, buyers must verify that the "
            "land or property has no outstanding loans. If a builder has mortgaged the land to a bank, "
            "they cannot legally sell units without the bank's No Objection Certificate (NOC). "
            "Buying without checking the EC exposes buyers to risk of bank claiming the property."
        ),
    },
    {
        "id": "force_majeure",
        "section": "Force Majeure Clause Risk",
        "text": (
            "RERA permits force majeure claims (delays due to war, floods, natural disasters) only for "
            "genuine uncontrollable events. However, many builders insert overly broad force majeure "
            "clauses in sale agreements that cover normal business delays like material shortage or "
            "labour issues. These overbroad clauses are considered unfair contract terms under RERA "
            "and can be challenged before the RERA authority or adjudicating officer."
        ),
    },
    {
        "id": "s31_complaints",
        "section": "Section 31 — Filing Complaints",
        "text": (
            "Section 31: Any aggrieved person may file a complaint with the RERA authority or the "
            "adjudicating officer against a promoter, allottee, or real estate agent for any violation "
            "of RERA provisions. Penalties can include fines up to 10% of the estimated project cost "
            "and imprisonment up to 3 years for repeated violations. Complaints can be filed online "
            "on each state's RERA portal."
        ),
    },
    {
        "id": "title_deed",
        "section": "Title Deed and Clear Title",
        "text": (
            "Before purchasing, buyers must verify that the builder has clear and marketable title to "
            "the land — meaning no disputes, litigations, or competing claims. The Sale Deed should "
            "clearly describe the property, its boundaries, and the seller's right to sell. "
            "A lawyer's title search for at least 30 years prior is recommended. Properties with "
            "disputed titles can result in the buyer losing the property even after paying full price."
        ),
    },
    {
        "id": "completion_cert",
        "section": "Completion Certificate",
        "text": (
            "A Completion Certificate is issued by the local municipal body confirming that the "
            "construction has been completed as per the approved building plans. Without a completion "
            "certificate, the project is not legally finished. Many delays in obtaining OC happen "
            "because builders construct more floors or FSI than approved, making them unable to get "
            "official certification."
        ),
    },
]

_collection = None


def get_rera_collection():
    global _collection
    if _collection is not None:
        return _collection

    ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_or_create_collection(name="rera_act", embedding_function=ef)

    if collection.count() == 0:
        collection.add(
            documents=[c["text"] for c in RERA_CHUNKS],
            ids=[c["id"] for c in RERA_CHUNKS],
            metadatas=[{"section": c["section"]} for c in RERA_CHUNKS],
        )

    _collection = collection
    return collection


def search_rera_law(query: str, n_results: int = 3) -> str:
    collection = get_rera_collection()
    results = collection.query(query_texts=[query], n_results=n_results)

    if not results["documents"][0]:
        return "No relevant RERA provisions found."

    output = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        output.append(f"[{meta['section']}]\n{doc}")

    return "\n\n---\n\n".join(output)
