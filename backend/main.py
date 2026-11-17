import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

from hardware import detect_hardware
from services.magnific_service import MagnificService
from services.higgsfield_service import HiggsfieldService
from services.elevenlabs_service import ElevenLabsService

app = FastAPI(
    title="OmniStudio API",
    description="Backend for Magnific + Higgsfield + ElevenLabs Hybrid AI Suite",
    version="1.0.0"
)

# CORS configuration to allow local frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static directory for outputs and media
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
OUTPUTS_DIR = os.path.join(STATIC_DIR, "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# Pydantic Request Models
class MagnificRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    scale_factor: int = 4
    creativity: float = 0.55
    resemblance: float = 0.70
    fractality_preset: str = "skin_pores"
    hdr_boost: float = 0.40
    prompt: Optional[str] = ""
    hardware_profile: Optional[str] = "LITE"

class HiggsfieldRequest(BaseModel):
    image_url: Optional[str] = ""
    camera_preset: str = "zoom_in"
    motion_speed: int = 6
    camera_shake: int = 2
    duration: int = 4
    fps: int = 24
    aspect_ratio: str = "16:9"
    prompt: Optional[str] = ""
    character_action: str = "expressive_gaze"
    hardware_profile: Optional[str] = "LITE"

class ElevenLabsTTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = "pNInz6obpgDQGcFmaJgB"
    voice_name: Optional[str] = "Adam"
    stability: float = 0.5
    similarity_boost: float = 0.75
    style_exaggeration: float = 0.3
    api_key: Optional[str] = None
    hardware_profile: Optional[str] = "LITE"

class ElevenLabsSFXRequest(BaseModel):
    prompt: str
    duration: int = 4
    api_key: Optional[str] = None


@app.get("/api/health")
def health_check():
    return {"status": "online", "service": "OmniStudio Engine"}

@app.get("/api/hardware")
def get_hardware_info():
    """Detects GPU, VRAM and system profile."""
    return detect_hardware()

@app.post("/api/magnific/enhance")
def enhance_image(req: MagnificRequest):
    return MagnificService.enhance_image(
        image_url=req.image_url,
        image_base64=req.image_base64,
        scale_factor=req.scale_factor,
        creativity=req.creativity,
        resemblance=req.resemblance,
        fractality_preset=req.fractality_preset,
        hdr_boost=req.hdr_boost,
        prompt=req.prompt,
        hardware_profile=req.hardware_profile
    )

@app.post("/api/higgsfield/generate")
def generate_video(req: HiggsfieldRequest):
    return HiggsfieldService.generate_video(
        image_url=req.image_url,
        camera_preset=req.camera_preset,
        motion_speed=req.motion_speed,
        camera_shake=req.camera_shake,
        duration=req.duration,
        fps=req.fps,
        aspect_ratio=req.aspect_ratio,
        prompt=req.prompt,
        character_action=req.character_action,
        hardware_profile=req.hardware_profile
    )

@app.post("/api/elevenlabs/tts")
def generate_tts(req: ElevenLabsTTSRequest):
    return ElevenLabsService.generate_tts(
        text=req.text,
        voice_id=req.voice_id,
        voice_name=req.voice_name,
        stability=req.stability,
        similarity_boost=req.similarity_boost,
        style_exaggeration=req.style_exaggeration,
        api_key=req.api_key,
        hardware_profile=req.hardware_profile
    )

@app.post("/api/elevenlabs/sfx")
def generate_sfx(req: ElevenLabsSFXRequest):
    return ElevenLabsService.generate_sfx(
        prompt=req.prompt,
        duration_seconds=req.duration,
        api_key=req.api_key
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
