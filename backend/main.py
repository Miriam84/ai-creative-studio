import os
import time
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
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
    # 1. Get image bytes safely without network self-deadlock
    image_bytes = None
    if image:
        image_bytes = await image.read()
    elif image_url:
        if "static/" in image_url:
            rel = image_url.split("static/")[-1].replace("/", os.sep)
            local_path = os.path.join(STATIC_DIR, rel)
            if os.path.exists(local_path):
                with open(local_path, "rb") as f:
                    image_bytes = f.read()
            else:
                fallback = os.path.join(OUTPUTS_DIR, "lhome_del_bigot.jpg")
                if os.path.exists(fallback):
                    with open(fallback, "rb") as f:
                        image_bytes = f.read()
        elif image_url.startswith("http://") or image_url.startswith("https://"):
            try:
                import urllib.request
                req = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
                image_bytes = urllib.request.urlopen(req, timeout=8).read()
            except Exception:
                pass
        elif os.path.exists(image_url):
            with open(image_url, "rb") as f:
                image_bytes = f.read()

    if not image_bytes:
        fallback = os.path.join(OUTPUTS_DIR, "lhome_del_bigot.jpg")
        if os.path.exists(fallback):
            with open(fallback, "rb") as f:
                image_bytes = f.read()
        else:
            raise HTTPException(status_code=400, detail="Imatge no disponible")

    # 2. Get or generate audio
    audio_bytes = None
    if audio:
        # OPTION A: User provided or recorded their own audio -> Use as-is, NO EDITING!
        audio_bytes = await audio.read()
    elif script_text:
        # OPTION B: User provided text -> Synthesize speech with character voice
        tts_res = ElevenLabsService.generate_tts(
            text=script_text,
            voice_id=voice_id or "ca_enric",
            provider="free_neural"
        )
        audio_url = tts_res.get("audio_url", "")
        if "static/outputs/" in audio_url:
            filename = audio_url.split("static/outputs/")[-1]
            local_audio_path = os.path.join(OUTPUTS_DIR, filename)
            if os.path.exists(local_audio_path):
                with open(local_audio_path, "rb") as f:
                    audio_bytes = f.read()
    
    # If still no audio, use the character's saved default voice sample
    if not audio_bytes:
        default_sample = os.path.join(OUTPUTS_DIR, "lhome_del_bigot_veu.mp3")
        if os.path.exists(default_sample):
            with open(default_sample, "rb") as f:
                audio_bytes = f.read()

    sub_text = subtitle_text if subtitle_text else (script_text[:40] if script_text else "L'HOME DEL BIGOT A TIKTOK")
    
    return AvatarService.render_talking_avatar(
        image_bytes=image_bytes,
        audio_bytes=audio_bytes,
        head_motion=head_motion,
        eye_blink=eye_blink,
        add_subtitles=add_subtitles,
        subtitle_text=sub_text
    )

@app.get("/api/download/{filename}")
def download_file(filename: str):
    """Secure direct download endpoint with Content-Disposition attachment."""
    safe_name = os.path.basename(filename)
    file_path = os.path.join(OUTPUTS_DIR, safe_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Fitxer no trobat")
    return FileResponse(
        path=file_path,
        media_type="video/mp4" if safe_name.endswith(".mp4") else "application/octet-stream",
        filename=safe_name,
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}"',
            "Cache-Control": "no-cache"
        }
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
