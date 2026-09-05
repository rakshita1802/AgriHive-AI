from app.core.domain_rules import CANDIDATE_FEATURES, get_feature_definition
from app.services.quality_checks import quality_score


def test_candidate_features_have_no_duplicates():
    names = [f.name for f in CANDIDATE_FEATURES]
    assert len(names) == len(set(names))


def test_get_feature_definition_known():
    fd = get_feature_definition("temperature_c")
    assert fd is not None
    assert fd.source == "nasa_power"


def test_get_feature_definition_unknown():
    assert get_feature_definition("not_a_real_feature") is None


def test_quality_score_all_valid():
    assert quality_score("relative_humidity_pct", [50, 60, 70]) == 1.0


def test_quality_score_with_missing_and_out_of_range():
    # 100 is above the plausible humidity range (0-100 ok actually), use rainfall instead
    values = [10, None, 20, 9999]
    score = quality_score("rainfall_mm", values)
    assert score == 0.5  # 2 of 4 valid (10 and 20)
