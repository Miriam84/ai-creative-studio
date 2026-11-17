import os
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

from hardware import detect_hardware
from services.magnific_service import MagnificService
from services.higgsfield_service import HiggsfieldService
from services.elevenlabs_service import ElevenLabsService
from services.avatar_service import AvatarService

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
    voice_id: Optional[str] = "ca_enric"
    voice_name: Optional[str] = "Enric (Català)"
    stability: float = 0.5
    similarity_boost: float = 0.75
    style_exaggeration: float = 0.3
    provider: Optional[str] = "free_neural"
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
        provider=req.provider,
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

import json

CHARACTERS_FILE = os.path.join(os.path.dirname(__file__), "characters.json")

def load_characters():
    if os.path.exists(CHARACTERS_FILE):
        try:
            with open(CHARACTERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return []
    return []

def save_characters(chars):
    with open(CHARACTERS_FILE, "w", encoding="utf-8") as f:
        json.dump(chars, f, indent=2, ensure_ascii=False)

@app.get("/api/characters")
def get_characters():
    return load_characters()

@app.post("/api/characters")
async def create_character(
    name: str = Form(...),
    description: str = Form(""),
    voice_name: str = Form("Enric (Català)"),
    voice_id: str = Form("ca_enric"),
    image: Optional[UploadFile] = File(None)
):
    chars = load_characters()
    timestamp = int(time.time())
    
    avatar_image = "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80"
    if image:
        img_bytes = await image.read()
        filename = f"avatar_char_{timestamp}.png"
        img_path = os.path.join(OUTPUTS_DIR, filename)
        with open(img_path, "wb") as f:
            f.write(img_bytes)
        avatar_image = f"http://localhost:8000/static/outputs/{filename}"
        
    new_char = {
        "id": f"char_{timestamp}",
        "name": name,
        "description": description,
        "avatar_image": avatar_image,
        "voice_name": voice_name,
        "voice_id": voice_id,
        "created_at": timestamp
    }
    chars.append(new_char)
    save_characters(chars)
    return {"status": "success", "character": new_char}

@app.post("/api/avatar/render")
async def render_avatar(
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    audio: Optional[UploadFile] = File(None),
    script_text: Optional[str] = Form(None),
    voice_id: Optional[str] = Form("ca_enric"),
    head_motion: int = Form(5),
    eye_blink: int = Form(7),
    add_subtitles: bool = Form(True),
    subtitle_text: Optional[str] = Form(None)
):
    # 1. Get image bytes
    if image:
        image_bytes = await image.read()
    elif image_url:
        import urllib.request
        image_bytes = urllib.request.urlopen(image_url).read()
    else:
        # Default avatar
        sample_path = os.path.join(OUTPUTS_DIR, "avatar_sample.png")
        if os.path.exists(sample_path):
            with open(sample_path, "rb") as f:
                image_bytes = f.read()
        else:
            raise HTTPException(status_code=400, detail="Imatge no proporcionada")

    # 2. Get or generate audio
    audio_bytes = None
    if audio:
        # OP Lev A: User uploaded or recorded exact audio -> DO NOT EDIT, USE AS-IS!
        audio_bytes = await audio.read()
    elif script_text:
        # OPTION B: User provided script text -> Synthesize with character's voice!
        tts_res = ElevenLabsService.generate_tts(
            text=script_text,
            voice_id=voice_id or "ca_enric",
            provider="free_neural"
        )
        audio_url = tts_res.get("audio_url", "")
        if audio_url.startswith("http://localhost:8000/static/outputs/"):
            audio_filename = audio_url.split("/")[-1]
            local_audio_path = os.path.join(OUTPUTS_DIR, audio_filename)
            if os.path.exists(local_audio_path):
                with open(local_audio_path, "rb") as f:
                    audio_bytes = f.read()

    sub_text = subtitle_text if subtitle_text else (script_text[:40] if script_text else "SABIES D'ON VE AQUESTA FRASE?")
    
    return AvatarService.render_talking_avatar(
        image_bytes=image_bytes,
        audio_bytes=audio_bytes,
        head_motion=head_motion,
        eye_blink=eye_blink,
        add_subtitles=add_subtitles,
        subtitle_text=sub_text
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
