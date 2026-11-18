import os
import sys
import time
import requests
from .voice_clone_service import VoiceCloneService

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

class ElevenLabsService:
    @staticmethod
    def generate_tts(
        text: str,
        voice_id: str = "voice_rai",
        voice_name: str = "L'home del bigot (Rai)",
        stability: float = 0.5,
        similarity_boost: float = 0.75,
        style_exaggeration: float = 0.3,
        api_key: str = None,
        provider: str = "clone", # clone, free_neural, elevenlabs, deep_ai
        hardware_profile: str = "LITE"
    ):
        """
        Synthesizes voice using local cloned voice engine (VoiceLab / F5-TTS / Edge-TTS) or ElevenLabs API.
        """
        api_key = api_key or os.getenv("ELEVENLABS_API_KEY")

        # 1. ElevenLabs Cloud API (only if explicitly requested and key provided)
        if provider == "elevenlabs" and api_key:
            try:
                url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
                headers = {
                    "xi-api-key": api_key,
                    "Content-Type": "application/json"
                }
                payload = {
                    "text": text,
                    "model_id": "eleven_multilingual_v2",
                    "voice_settings": {
                        "stability": stability,
                        "similarity_boost": similarity_boost,
                        "style": style_exaggeration
                    }
                }
                res = requests.post(url, json=payload, headers=headers, timeout=20)
                if res.status_code == 200:
                    filename = f"elevenlabs_{int(time.time())}.mp3"
                    out_path = os.path.join(OUTPUT_DIR, filename)
                    with open(out_path, "wb") as f:
                        f.write(res.content)
                    return {
                        "status": "success",
                        "audio_url": f"http://localhost:8001/static/outputs/{filename}",
                        "voice_name": voice_name,
                        "source": "ElevenLabs Cloud API"
                    }
            except Exception:
                pass

        # 2. Local VoiceLab Engine (VoiceCloneService)
        # Supports both instant acoustic morphing and deep AI clone
        engine = "deep_ai" if provider == "deep_ai" else "fast"
        return VoiceCloneService.synthesize(text=text, voice_id=voice_id, engine=engine)

    @staticmethod
    def clone_voice(voice_name: str, audio_file_path: str, reference_text: str = None, lang: str = "ca"):
        return VoiceCloneService.clone_voice(voice_name, audio_file_path, reference_text, lang)

    @staticmethod
    def generate_sfx(prompt: str, duration_seconds: int = 4, api_key: str = None):
        return {
            "status": "success",
            "audio_url": "https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3",
            "prompt": prompt,
            "duration": duration_seconds
        }
