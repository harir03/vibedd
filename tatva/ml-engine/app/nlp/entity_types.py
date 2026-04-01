"""
TATVA — Custom Entity Type Taxonomy for Geopolitical NER.

Maps spaCy NER labels to TATVA's domain-specific entity types.
Defines gazetteers and pattern rules for TECHNOLOGY, RESOURCE,
DOCUMENT, and other types that standard NER models miss.
"""

from __future__ import annotations

from enum import Enum
from typing import Dict, FrozenSet, List, Tuple


class EntityType(str, Enum):
    """TATVA entity types — geopolitical domain taxonomy."""

    PERSON = "PERSON"
    ORGANIZATION = "ORGANIZATION"
    LOCATION = "LOCATION"
    EVENT = "EVENT"
    TECHNOLOGY = "TECHNOLOGY"
    RESOURCE = "RESOURCE"
    DOCUMENT = "DOCUMENT"
    DATETIME = "DATETIME"
    METRIC = "METRIC"


# ── spaCy label → TATVA type mapping ──
SPACY_TO_TATVA: Dict[str, EntityType] = {
    # Persons
    "PERSON": EntityType.PERSON,
    "PER": EntityType.PERSON,
    # Organizations
    "ORG": EntityType.ORGANIZATION,
    "NORP": EntityType.ORGANIZATION,  # nationalities, religious/political groups
    # Locations
    "GPE": EntityType.LOCATION,  # countries, cities, states
    "LOC": EntityType.LOCATION,  # non-GPE locations (mountains, rivers)
    "FAC": EntityType.LOCATION,  # facilities (airports, bridges, bases)
    # Events
    "EVENT": EntityType.EVENT,
    # Dates / Times
    "DATE": EntityType.DATETIME,
    "TIME": EntityType.DATETIME,
    # Metrics / Quantities
    "MONEY": EntityType.METRIC,
    "PERCENT": EntityType.METRIC,
    "QUANTITY": EntityType.METRIC,
    "CARDINAL": EntityType.METRIC,
    "ORDINAL": EntityType.METRIC,
    # Documents (laws, works of art used as proxy for treaties)
    "LAW": EntityType.DOCUMENT,
    "WORK_OF_ART": EntityType.DOCUMENT,
    # Products → TECHNOLOGY
    "PRODUCT": EntityType.TECHNOLOGY,
}

# ── Gazetteer: known entity names → type ──
# Entries are lowercased for matching.
TECHNOLOGY_GAZETTEER: FrozenSet[str] = frozenset({
    "agni-v", "agni-iv", "agni-iii", "agni-ii", "agni-i",
    "brahmos", "brahmos-ii", "prithvi", "akash", "nag", "trishul",
    "ins arihant", "ins arighat", "ins vikramaditya", "ins vikrant",
    "tejas", "tejas mk2", "lca tejas",
    "rafale", "s-400", "s400", "patriot", "thaad", "iron dome",
    "arjun tank", "arjun mk2",
    "gsat-30", "chandrayaan", "mangalyaan", "gaganyaan",
    "5g", "6g", "quantum computing", "artificial intelligence",
    "hypersonic missile", "cruise missile", "ballistic missile",
    "nuclear submarine", "aircraft carrier", "stealth fighter",
    "drone", "uav", "ucav", "loitering munition",
    "chips act", "semiconductor", "rare earth",
    "astra missile", "nirbhay", "pralay", "shaurya",
    "pinaka", "smerch", "barak-8",
})

RESOURCE_GAZETTEER: FrozenSet[str] = frozenset({
    "crude oil", "natural gas", "petroleum", "coal", "uranium",
    "lithium", "cobalt", "rare earth minerals", "rare earths",
    "gold", "silver", "iron ore", "copper", "aluminium", "aluminum",
    "wheat", "rice", "cotton", "sugar", "palm oil",
    "lng", "solar energy", "wind energy", "hydrogen",
    "water", "freshwater", "groundwater",
    "gdp", "foreign exchange", "forex reserves",
})

DOCUMENT_GAZETTEER: FrozenSet[str] = frozenset({
    "un charter", "npt", "nuclear non-proliferation treaty",
    "paris agreement", "paris climate accord",
    "geneva convention", "hague convention",
    "bilateral investment treaty", "free trade agreement",
    "defence cooperation agreement", "defense cooperation agreement",
    "memorandum of understanding", "mou",
    "national security strategy", "defense white paper",
    "budget", "union budget", "economic survey",
    "five-year plan", "niti aayog report",
    "unsc resolution", "un resolution",
    "ceasefire agreement", "peace accord", "armistice",
    "aukus pact", "aukus",
    "rcep", "cptpp", "bri",
    "chips act", "indus waters treaty", "simla agreement",
    "shimla agreement", "lahore declaration", "tashkent agreement",
    "panchsheel", "look east policy", "act east policy",
})

EVENT_GAZETTEER: FrozenSet[str] = frozenset({
    "g20 summit", "g7 summit", "brics summit",
    "un general assembly", "unga", "cop28", "cop29", "cop30",
    "shanghai cooperation organisation", "sco summit",
    "quad summit", "quad meeting",
    "wto ministerial", "davos", "world economic forum",
    "republic day", "independence day",
    "general election", "state election", "lok sabha election",
    "surgical strike", "balakot airstrike",
    "doklam standoff", "galwan clash", "galwan valley",
    "pulwama attack", "uri attack",
    "demonetization", "demonetisation",
    "kargil war", "1971 war", "1965 war",
    "nuclear test", "pokhran",
    "quad agreement",
})

ORGANIZATION_GAZETTEER: FrozenSet[str] = frozenset({
    "drdo", "isro", "bel", "hal", "bhel",
    "defence research and development organisation",
    "indian space research organisation",
    "cia", "fbi", "nsa", "mi6", "mossad", "isi", "raw", "ib",
    "national security agency", "intelligence bureau",
    "research and analysis wing",
    "brics", "quad", "asean", "nato", "eu", "european union",
    "imf", "world bank", "adb", "aiib",
    "united nations", "un", "unsc", "unesco", "who",
    "wto", "iaea", "fatf", "interpol",
    "indian air force", "indian army", "indian navy",
    "people's liberation army", "pla", "pla navy",
    "us navy", "raf", "usaf",
    "niti aayog", "rbi", "sebi", "mea", "mod", "mha",
    "ministry of external affairs", "ministry of defence",
    "ministry of home affairs",
    "adani group", "reliance", "tata", "infosys", "wipro",
    "lockheed martin", "boeing", "raytheon", "bae systems",
    "dassault", "rosoboronexport", "almaz-antey",
})

# ── Person gazetteer: prominent figures spaCy may misclassify ──
PERSON_GAZETTEER: FrozenSet[str] = frozenset({
    "modi", "pm modi", "narendra modi",
    "xi jinping",
    "biden", "joe biden", "president biden",
    "macron", "emmanuel macron",
    "putin", "vladimir putin",
    "trump", "donald trump",
    "sunak", "rishi sunak",
    "kishida", "fumio kishida",
    "erdogan",
    "netanyahu", "benjamin netanyahu",
    "zelensky", "zelenskyy", "volodymyr zelensky",
    "imran khan", "nawaz sharif", "shehbaz sharif",
    "rajnath singh", "jaishankar", "s jaishankar",
    "doval", "ajit doval",
    "amit shah",
})

# ── Nested entity patterns (parent → child locations) ──
# When we see these ORGs, also extract a nested LOCATION
NESTED_LOCATION_IN_ORG: Dict[str, str] = {
    "indian air force": "India",
    "indian army": "India",
    "indian navy": "India",
    "indian space research organisation": "India",
    "isro": "India",
    "drdo": "India",
    "people's liberation army": "China",
    "pla": "China",
    "pla navy": "China",
    "us navy": "United States",
    "usaf": "United States",
    "raf": "United Kingdom",
    "mossad": "Israel",
    "isi": "Pakistan",
    "cia": "United States",
    "fbi": "United States",
    "nsa": "United States",
    "mi6": "United Kingdom",
}


def get_all_gazetteers() -> List[Tuple[FrozenSet[str], EntityType]]:
    """Return all gazetteers paired with their entity types."""
    return [
        (PERSON_GAZETTEER, EntityType.PERSON),
        (TECHNOLOGY_GAZETTEER, EntityType.TECHNOLOGY),
        (RESOURCE_GAZETTEER, EntityType.RESOURCE),
        (DOCUMENT_GAZETTEER, EntityType.DOCUMENT),
        (EVENT_GAZETTEER, EntityType.EVENT),
        (ORGANIZATION_GAZETTEER, EntityType.ORGANIZATION),
    ]


def map_spacy_label(label: str) -> EntityType | None:
    """Map a spaCy NER label to a TATVA entity type, or None if unmapped."""
    return SPACY_TO_TATVA.get(label)
