import unittest
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(r"..\BACKEND\.cache\mini-run-iman-release").resolve()
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

import mini_run_gateway

class TestGatewayRouting(unittest.TestCase):
    def test_handle_render_preserves_prompt_and_directives(self):
        payload = {
            "source": {"url": "https://example.com/source.mp4"},
            "metadata": {"pipeline": "maul"},
            "prompt": "Use B-rolls rather than number one and use high motion graphics with intense trailer music",
            "userPrompt": "Use B-rolls rather than number one",
            "audio": {
                "songTrackId": "music-preview-cinematic-trailer-epic-intense-trailer",
                "songTitle": "Intense Trailer",
            },
            "design": {
                "brollPreference": "broll_cutaway",
                "motionGraphicsPreference": "high_motion",
                "brandPreferences": {"backgroundPolicy": "always"},
            },
            "jobId": "test_gateway_influence_001"
        }

        # Mock create_pipeline_job to inspect what options are forwarded
        captured_call = {}
        from mini_run_pipeline import pipeline as pipeline_mod
        orig_create = pipeline_mod.create_pipeline_job

        def mock_create(source, job_id=None, metadata=None, options=None, **kwargs):
            captured_call["source"] = source
            captured_call["job_id"] = job_id
            captured_call["metadata"] = metadata
            captured_call["options"] = options
            return {"jobId": job_id, "status": "queued", "data": {**(options or {})}}

        pipeline_mod.create_pipeline_job = mock_create
        try:
            job = mini_run_gateway.handle_render(payload)
            options = captured_call.get("options") or {}
            
            # Assertions: Prompt must NOT be dropped
            self.assertEqual(
                options.get("prompt"),
                "Use B-rolls rather than number one and use high motion graphics with intense trailer music",
                "handle_render must preserve prompt in options"
            )
            self.assertEqual(
                options.get("userPrompt"),
                "Use B-rolls rather than number one",
                "handle_render must preserve userPrompt in options"
            )
            # Assertions: Audio directives must NOT be dropped
            audio = options.get("audio") or {}
            self.assertEqual(audio.get("songTrackId"), "music-preview-cinematic-trailer-epic-intense-trailer")
            self.assertEqual(audio.get("songTitle"), "Intense Trailer")

            # Assertions: Design directives must NOT be dropped
            design = options.get("design") or {}
            self.assertEqual(design.get("brollPreference"), "broll_cutaway")
            self.assertEqual(design.get("motionGraphicsPreference"), "high_motion")
            self.assertEqual(design.get("brandPreferences", {}).get("backgroundPolicy"), "always")
        finally:
            pipeline_mod.create_pipeline_job = orig_create

if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(TestGatewayRouting)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if result.wasSuccessful():
        print("GATEWAY_ROUTING_TESTS_PASSED")
        sys.exit(0)
    else:
        sys.exit(1)
