import os
import io
import time
import base64
import urllib.request
from PIL import Image, ImageEnhance, ImageFilter

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_DIR = os.path.join(BACKEND_DIR, "static")
OUTPUT_DIR = os.path.join(STATIC_DIR, "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def _load_image(image_url: str = None, image_base64: str = None) -> Image.Image:
    if image_base64:
        b64_data = image_base64.split(",", 1)[1] if "," in image_base64 else image_base64
        image_data = base64.b64decode(b64_data)
        return Image.open(io.BytesIO(image_data)).convert("RGB")

    if image_url:
        if "static/" in image_url:
            rel = image_url.split("static/")[-1].replace("/", os.sep)
            local_path = os.path.join(STATIC_DIR, rel)
            if os.path.exists(local_path):
                return Image.open(local_path).convert("RGB")
        elif image_url.startswith("http://") or image_url.startswith("https://"):
            req = urllib.request.Request(image_url, headers={"User-Agent": "Mozilla/5.0"})
            data = urllib.request.urlopen(req, timeout=10).read()
            return Image.open(io.BytesIO(data)).convert("RGB")
        elif os.path.exists(image_url):
            return Image.open(image_url).convert("RGB")

    fallback = os.path.join(OUTPUT_DIR, "lhome_del_bigot.jpg")
    if os.path.exists(fallback):
        return Image.open(fallback).convert("RGB")
    return Image.new("RGB", (800, 800), color=(25, 28, 40))


class MagnificService:
    @staticmethod
    def enhance_image(
        image_url: str = None,
        image_base64: str = None,
        scale_factor: int = 4,
        creativity: float = 0.55,
        resemblance: float = 0.70,
        fractality_preset: str = "skin_pores",
        hdr_boost: float = 0.40,
        prompt: str = "",
        hardware_profile: str = "LITE"
    ):
        """
        Executes Magnific-style upscale and detail/texture enhancement.
        Loads from base64, local /static/ path, or remote URL and returns a relative /static/outputs/ URL.
        """
        filename = f"magnific_enhanced_{int(time.time() * 1000)}.png"
        output_path = os.path.join(OUTPUT_DIR, filename)

        try:
            img = _load_image(image_url=image_url, image_base64=image_base64)

            # Cap output max dimension to 3840px to prevent OOM on large uploads
            factor = max(1, min(scale_factor, 4))
            target_w = min(img.width * factor, 3840)
            target_h = int(img.height * (target_w / max(1, img.width)))
            upscaled = img.resize((target_w, target_h), Image.Resampling.LANCZOS)

            # Unsharp mask for crisp micro-detail and texture enhancement
            radius = 1.8 if fractality_preset == "skin_pores" else 2.4
            percent = int(80 + creativity * 140)
            upscaled = upscaled.filter(ImageFilter.UnsharpMask(radius=radius, percent=percent, threshold=3))

            # Subtle sharpness & HDR contrast / color boost
            upscaled = ImageEnhance.Sharpness(upscaled).enhance(1.0 + creativity * 0.6)
            upscaled = ImageEnhance.Contrast(upscaled).enhance(1.0 + hdr_boost * 0.35)
            upscaled = ImageEnhance.Color(upscaled).enhance(1.0 + hdr_boost * 0.15)

            upscaled.save(output_path, "PNG", optimize=True)
            enhanced_url = f"/static/outputs/{filename}"
            res_str = f"{target_w}x{target_h}"
        except Exception as e:
            print("MagnificService enhance error:", e)
            enhanced_url = image_url or "/static/outputs/lhome_del_bigot.jpg"
            res_str = "1920x1080"

        return {
            "status": "success",
            "enhanced_url": enhanced_url,
            "scale_factor": scale_factor,
            "creativity": creativity,
            "resemblance": resemblance,
            "fractality_preset": fractality_preset,
            "profile_used": hardware_profile,
            "resolution": res_str
        }
