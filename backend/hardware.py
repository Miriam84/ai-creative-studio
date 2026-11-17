import os
import platform
import subprocess
import psutil

def detect_hardware():
    """
    Detects system hardware: GPU name, VRAM in GB, System RAM, and recommends profile.
    Profiles:
      - LITE: <= 8GB VRAM (e.g. RTX 3050 Laptop, GTX 1660, 4GB/6GB/8GB) -> Tiled Diffusion, AnimateDiff LCM, Edge TTS
      - MEDIUM: 8GB - 14GB VRAM (e.g. RTX 3060, 4070) -> SDXL Tiled, LivePortrait, F5-TTS
      - PRO: >= 16GB VRAM (e.g. RTX 3090, 4080, 4090, A100) -> Full SUPIR / Flux, HunyuanVideo / Wan 2.1 14B, full F5-TTS
    """
    gpu_name = "CPU / Fallback"
    vram_gb = 0.0

    # 1. Try Windows CIM/WMI
    if platform.system() == "Windows":
        try:
            cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"'
            out = subprocess.check_output(cmd, shell=True).decode("utf-8", errors="ignore").strip().splitlines()
            for line in out:
                line_str = line.strip()
                if "NVIDIA" in line_str or "GeForce" in line_str or "RTX" in line_str:
                    gpu_name = line_str
                    break
            
            # Get VRAM
            vram_cmd = 'powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Where-Object { $_.Name -like \'*NVIDIA*\' } | Select-Object -ExpandProperty AdapterRAM"'
            vram_out = subprocess.check_output(vram_cmd, shell=True).decode("utf-8", errors="ignore").strip()
            if vram_out and vram_out.isdigit():
                vram_gb = round(int(vram_out) / (1024 ** 3), 1)
        except Exception:
            pass

    # 2. Try nvidia-smi if available
    if vram_gb == 0.0:
        try:
            smi_cmd = "nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits"
            smi_out = subprocess.check_output(smi_cmd, shell=True).decode("utf-8", errors="ignore").strip().splitlines()
            if smi_out:
                parts = smi_out[0].split(",")
                gpu_name = parts[0].strip()
                vram_gb = round(float(parts[1].strip()) / 1024, 1)
        except Exception:
            pass

    # Fallback to defaults if detected RTX 3050 Laptop
    if "3050" in gpu_name and vram_gb == 0.0:
        vram_gb = 4.0

    # Total System RAM in GB
    ram_gb = round(psutil.virtual_memory().total / (1024 ** 3), 1)

    # Determine recommended profile
    if vram_gb >= 15.0:
        profile = "PRO"
        engine_mode = "High-End Workstation (Hunyuan / Wan 14B / SUPIR)"
    elif vram_gb >= 8.0:
        profile = "MEDIUM"
        engine_mode = "Mid-Range (SDXL Tiled / AnimateDiff / LivePortrait)"
    else:
        profile = "LITE"
        engine_mode = "Laptop Optimized (Tiled Diffusion 4GB / LCM / Fast TTS)"

    return {
        "gpu_name": gpu_name if gpu_name != "CPU / Fallback" else "NVIDIA GeForce RTX 3050 Laptop GPU",
        "vram_gb": vram_gb if vram_gb > 0 else 4.0,
        "ram_gb": ram_gb,
        "cpu_count": psutil.cpu_count(logical=True),
        "profile": profile,
        "engine_mode": engine_mode,
        "supports_local_full_video": vram_gb >= 15.0
    }
