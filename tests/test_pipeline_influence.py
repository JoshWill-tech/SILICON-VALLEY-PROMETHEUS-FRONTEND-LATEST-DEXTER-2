import unittest
import sys
from pathlib import Path
from unittest.mock import MagicMock

# Add backend directory to sys.path
backend_path = Path(r"..\BACKEND\.cache\mini-run-iman-release").resolve()
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

# Mock LayaDirector to prevent heavy HuggingFace downloads during unit tests
from mini_run_pipeline import laya_director
mock_director = MagicMock()
mock_director.decide_music_curation.return_value = None
mock_director.decide_broll_cutaway.return_value = None
laya_director.LayaEditorialDirector.get_instance = MagicMock(return_value=mock_director)

from mini_run_pipeline import song_program, backgrounds

class TestPipelineInfluence(unittest.TestCase):
    def test_song_program_honors_explicit_individual_song_selection(self):
        chunks = [
            {"text": "Welcome to the future of editing.", "startMs": 0, "endMs": 3000, "outputStartMs": 0, "outputEndMs": 3000},
            {"text": "Everything is automated seamlessly.", "startMs": 3000, "endMs": 6000, "outputStartMs": 3000, "outputEndMs": 6000},
        ]
        catalog = {
            "entries": [
                {
                    "id": "track_ambient_01",
                    "title": "Quiet Ambient",
                    "artist": "Soft Artist",
                    "category": "ambient",
                    "intensity": "soft",
                    "renderAllowed": True,
                    "approvalSource": "curated",
                    "localPath": "/data/songs/ambient.mp3",
                    "durationSec": 120.0,
                },
                {
                    "id": "track_cinematic_trailer",
                    "title": "Intense Trailer",
                    "artist": "Prometheus Original",
                    "category": "cinematic",
                    "intensity": "hard",
                    "renderAllowed": True,
                    "approvalSource": "curated",
                    "localPath": "/data/songs/trailer.mp3",
                    "durationSec": 120.0,
                },
            ]
        }

        # Case 1: Individual explicitly selects trackId 'track_cinematic_trailer'
        program = song_program.plan_song_program(
            catalog=catalog,
            chunks=chunks,
            duration_ms=6000,
            design={"songTrackId": "track_cinematic_trailer"},
            prompt="",
        )
        self.assertEqual(len(program.get("events", [])), 1)
        self.assertEqual(program["events"][0]["trackId"], "track_cinematic_trailer")
        self.assertEqual(program["selectionMode"], "individual_selection")

        # Case 2: Individual selects by song title in design
        program_by_title = song_program.plan_song_program(
            catalog=catalog,
            chunks=chunks,
            duration_ms=6000,
            design={"songTitle": "Quiet Ambient"},
            prompt="",
        )
        self.assertEqual(len(program_by_title.get("events", [])), 1)
        self.assertEqual(program_by_title["events"][0]["trackId"], "track_ambient_01")
        self.assertEqual(program_by_title["selectionMode"], "individual_selection")

    def test_backgrounds_and_orchestration_honor_broll_prompt_directive(self):
        prompt = "Use B-rolls rather than number one and use high motion graphics"

        # Check background preference parsing
        prefs = backgrounds.parse_background_preferences(
            prompt=prompt,
            design={"brollPreference": "broll_cutaway"},
        )
        self.assertTrue(
            prefs.get("userPromptRequested") and prefs.get("policy") in ("always", "enabled"),
            f"Background preferences must detect user broll prompt request and enable policy: {prefs}"
        )

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestPipelineInfluence)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if result.wasSuccessful():
        print("PIPELINE_INFLUENCE_TESTS_PASSED")
        sys.exit(0)
    else:
        sys.exit(1)
