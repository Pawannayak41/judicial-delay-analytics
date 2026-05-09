"""
normalize.py
Utilities to normalize inconsistent district/state names from NJDG.
"""

import re
import unicodedata

# Known district name aliases → canonical name
DISTRICT_ALIASES = {
    # Uttar Pradesh
    "allahabad": "Prayagraj",
    "prayagraj": "Prayagraj",
    "gorakhpur": "Gorakhpur",
    "varanasi": "Varanasi",
    "benaras": "Varanasi",
    "lucknow": "Lucknow",
    "agra": "Agra",
    "meerut": "Meerut",
    "kanpur nagar": "Kanpur Nagar",
    "kanpur": "Kanpur Nagar",
    "ghaziabad": "Ghaziabad",
    # Maharashtra
    "mumbai city": "Mumbai City",
    "bombay": "Mumbai City",
    "pune": "Pune",
    "poona": "Pune",
    "nagpur": "Nagpur",
    "thane": "Thane",
    "nashik": "Nashik",
    "nasik": "Nashik",
    # Rajasthan
    "jaipur": "Jaipur",
    "jodhpur": "Jodhpur",
    "udaipur": "Udaipur",
    "kota": "Kota",
    "ajmer": "Ajmer",
    "bikaner": "Bikaner",
    # West Bengal
    "kolkata": "Kolkata",
    "calcutta": "Kolkata",
    "howrah": "Howrah",
    "haora": "Howrah",
    "north 24 parganas": "North 24 Parganas",
    "south 24 parganas": "South 24 Parganas",
    # Bihar
    "patna": "Patna",
    "gaya": "Gaya",
    "muzaffarpur": "Muzaffarpur",
    # Madhya Pradesh
    "bhopal": "Bhopal",
    "indore": "Indore",
    "jabalpur": "Jabalpur",
    "gwalior": "Gwalior",
    # Karnataka
    "bangalore": "Bengaluru",
    "bangalore urban": "Bengaluru Urban",
    "bengaluru": "Bengaluru",
    "mysore": "Mysuru",
    "mysuru": "Mysuru",
    "hubli-dharwad": "Dharwad",
    # Tamil Nadu
    "chennai": "Chennai",
    "madras": "Chennai",
    "coimbatore": "Coimbatore",
    "madurai": "Madurai",
    "salem": "Salem",
    # Gujarat
    "ahmedabad": "Ahmedabad",
    "surat": "Surat",
    "vadodara": "Vadodara",
    "baroda": "Vadodara",
    "rajkot": "Rajkot",
    # Andhra Pradesh / Telangana
    "hyderabad": "Hyderabad",
    "visakhapatnam": "Visakhapatnam",
    "vizag": "Visakhapatnam",
    "vijayawada": "Krishna",
    # Delhi
    "delhi": "Delhi",
    "new delhi": "Delhi",
    "south delhi": "South Delhi",
    "north delhi": "North Delhi",
    "east delhi": "East Delhi",
    "west delhi": "West Delhi",
}

# Known state name aliases → canonical
STATE_ALIASES = {
    "andhra pradesh": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh",
    "assam": "Assam",
    "bihar": "Bihar",
    "chhattisgarh": "Chhattisgarh",
    "goa": "Goa",
    "gujarat": "Gujarat",
    "haryana": "Haryana",
    "himachal pradesh": "Himachal Pradesh",
    "jharkhand": "Jharkhand",
    "karnataka": "Karnataka",
    "kerala": "Kerala",
    "madhya pradesh": "Madhya Pradesh",
    "mp": "Madhya Pradesh",
    "maharashtra": "Maharashtra",
    "manipur": "Manipur",
    "meghalaya": "Meghalaya",
    "mizoram": "Mizoram",
    "nagaland": "Nagaland",
    "odisha": "Odisha",
    "orissa": "Odisha",
    "punjab": "Punjab",
    "rajasthan": "Rajasthan",
    "sikkim": "Sikkim",
    "tamil nadu": "Tamil Nadu",
    "tamilnadu": "Tamil Nadu",
    "telangana": "Telangana",
    "tripura": "Tripura",
    "uttar pradesh": "Uttar Pradesh",
    "up": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand",
    "uttaranchal": "Uttarakhand",
    "west bengal": "West Bengal",
    # UTs
    "andaman and nicobar islands": "Andaman & Nicobar Islands",
    "chandigarh": "Chandigarh",
    "dadra and nagar haveli": "Dadra & NH and Daman & Diu",
    "daman and diu": "Dadra & NH and Daman & Diu",
    "delhi": "Delhi",
    "nct of delhi": "Delhi",
    "lakshadweep": "Lakshadweep",
    "puducherry": "Puducherry",
    "pondicherry": "Puducherry",
    "jammu and kashmir": "Jammu & Kashmir",
    "j&k": "Jammu & Kashmir",
    "ladakh": "Ladakh",
}


def normalize_text(text: str) -> str:
    """Lowercase, strip, remove extra whitespace, normalize unicode."""
    if not isinstance(text, str):
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"\s+", " ", text.strip().lower())
    return text


def normalize_state(name: str) -> str:
    key = normalize_text(name)
    return STATE_ALIASES.get(key, name.strip().title())


def normalize_district(name: str, state: str = "") -> str:
    key = normalize_text(name)
    if key in DISTRICT_ALIASES:
        return DISTRICT_ALIASES[key]
    # Title case as fallback
    return name.strip().title()


def make_id(state: str, district: str = "") -> str:
    """Create a URL-safe ID from state (and optionally district) name."""
    def _slugify(s: str) -> str:
        s = normalize_text(s)
        s = re.sub(r"[^a-z0-9]+", "_", s)
        return s.strip("_")

    state_slug = _slugify(state)
    if district:
        return f"{state_slug}__{_slugify(district)}"
    return state_slug
