"""
Domain knowledge used by the Feature Selection Engine (Section 8.1) and by
the Data Ingestion layer's variable whitelist (Section 7 - "API Data
Selection Rule": the API determines what is AVAILABLE, not what the model
SHOULD use).

Each entry documents:
  - which raw source produces it
  - the unit
  - a domain-relevance verdict with a short scientific justification
  - whether it is available at prediction time (leakage check helper)

This table is intentionally explicit and editable - it is the mechanism by
which "Excluded variables are not necessarily bad data. They are simply not
validated as necessary for Version 1." (Section 7) is implemented in code
rather than left as an unstated assumption.
"""
from dataclasses import dataclass
from enum import Enum


class DomainRelevance(str, Enum):
    HIGHLY_RELEVANT = "highly_relevant"
    RELEVANT = "relevant"
    NOT_DIRECTLY_RELEVANT = "not_directly_relevant"


@dataclass(frozen=True)
class FeatureDefinition:
    name: str
    source: str  # nasa_power | open_meteo | soilgrids | faostat | farm_input
    unit: str
    data_type: str
    relevance: DomainRelevance
    domain_note: str
    available_at_prediction_time: bool
    purpose: str


# Section 6/7: the variables AgriHive is allowed to even consider (the
# whitelist applied by the ingestion clients before anything reaches the
# Feature Registry). Anything the raw API returns outside this list is
# discarded at ingestion time, exactly as Section 7's diagram shows
# (Pressure, Cloud cover, Visibility, Dew point, etc. are NOT carried through).
CANDIDATE_FEATURES: list[FeatureDefinition] = [
    FeatureDefinition(
        name="temperature_c",
        source="nasa_power",
        unit="celsius",
        data_type="numeric",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Higher temperature increases evapotranspiration and crop water demand.",
        available_at_prediction_time=True,
        purpose="Core driver of water-stress risk (Section 4).",
    ),
    FeatureDefinition(
        name="rainfall_mm",
        source="nasa_power",
        unit="mm",
        data_type="numeric",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Direct water input to soil; low rainfall is a primary water-stress driver.",
        available_at_prediction_time=True,
        purpose="Core driver of water-stress risk (Section 4).",
    ),
    FeatureDefinition(
        name="relative_humidity_pct",
        source="nasa_power",
        unit="percent",
        data_type="numeric",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Affects evapotranspiration rate; lower humidity increases plant water loss.",
        available_at_prediction_time=True,
        purpose="Secondary driver of water-stress risk (Section 4/8.5).",
    ),
    FeatureDefinition(
        name="wind_speed_ms",
        source="nasa_power",
        unit="m/s",
        data_type="numeric",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Wind increases evapotranspiration and moisture loss from soil/canopy.",
        available_at_prediction_time=True,
        purpose="Candidate driver of water-stress risk (Section 6.1).",
    ),
    FeatureDefinition(
        name="solar_radiation",
        source="nasa_power",
        unit="MJ/m^2/day",
        data_type="numeric",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Solar radiation drives evapotranspiration (a component of reference ET models).",
        available_at_prediction_time=True,
        purpose="Candidate driver of water-stress risk (Section 6.1).",
    ),
    FeatureDefinition(
        name="evapotranspiration_mm",
        source="open_meteo",
        unit="mm",
        data_type="numeric",
        relevance=DomainRelevance.HIGHLY_RELEVANT,
        domain_note="Reference evapotranspiration directly quantifies crop water loss.",
        available_at_prediction_time=True,
        purpose="Forecast-based proactive risk prediction (Section 20).",
    ),
    FeatureDefinition(
        name="soil_moisture",
        source="open_meteo",
        unit="m3/m3",
        data_type="numeric",
        relevance=DomainRelevance.HIGHLY_RELEVANT,
        domain_note="Directly measures water available to plant roots; most direct water-stress indicator.",
        available_at_prediction_time=True,
        purpose="Primary/near-target feature for water-stress risk (Section 4 example).",
    ),
    FeatureDefinition(
        name="soil_ph",
        source="soilgrids",
        unit="pH",
        data_type="numeric",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Affects nutrient/water uptake efficiency; farm-specific (Section 6.3/10).",
        available_at_prediction_time=True,
        purpose="Farm-specific local feature (Section 10 - LOCAL).",
    ),
    FeatureDefinition(
        name="clay_content_pct",
        source="soilgrids",
        unit="percent",
        data_type="numeric",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Clay soils retain more water; affects water-holding capacity.",
        available_at_prediction_time=True,
        purpose="Farm-specific local feature (Section 10 - LOCAL).",
    ),
    FeatureDefinition(
        name="sand_content_pct",
        source="soilgrids",
        unit="percent",
        data_type="numeric",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Sandy soils drain faster; affects water retention and stress onset speed.",
        available_at_prediction_time=True,
        purpose="Farm-specific local feature (Section 10 - LOCAL).",
    ),
    FeatureDefinition(
        name="soil_organic_carbon",
        source="soilgrids",
        unit="g/kg",
        data_type="numeric",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Organic carbon improves soil water-holding capacity.",
        available_at_prediction_time=True,
        purpose="Farm-specific local feature (Section 10 - LOCAL).",
    ),
    FeatureDefinition(
        name="crop",
        source="farm_input",
        unit="categorical",
        data_type="categorical",
        relevance=DomainRelevance.HIGHLY_RELEVANT,
        domain_note="Crop water requirement varies substantially by species (Section 3 example: Rice).",
        available_at_prediction_time=True,
        purpose="Farm-specific local feature required to personalize risk (Section 10).",
    ),
    FeatureDefinition(
        name="irrigation_method",
        source="farm_input",
        unit="categorical",
        data_type="categorical",
        relevance=DomainRelevance.RELEVANT,
        domain_note="Irrigation method affects effective water delivered to the crop.",
        available_at_prediction_time=True,
        purpose="Farm-specific local feature; also a lever for What-if Simulation (Section 17).",
    ),
]

# Examples of variables an API *could* return that Section 7 explicitly
# excludes from Version 1 (kept here only so the exclusion is documented,
# never actually ingested into typed columns).
EXPLICITLY_EXCLUDED_BY_DEFAULT = [
    "pressure",
    "cloud_cover",
    "visibility",
    "dew_point",
]


def get_feature_definition(name: str) -> FeatureDefinition | None:
    for f in CANDIDATE_FEATURES:
        if f.name == name:
            return f
    return None
