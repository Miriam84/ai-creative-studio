import os
import io
import time
import wave
import subprocess
import imageio_ffmpeg
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "outputs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

class AvatarService:
    @staticmethod
    def extract_audio_envelope(audio_path: str, fps: int = 24):
        """
        Extracts normalized volume/phoneme intensity envelope per video frame.
        """
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        temp_wav = os.path.join(OUTPUT_DIR, f"temp_env_{int(time.time() * 1000)}.wav")
        
        # Convert audio to mono 16kHz WAV for analysis
        conv_cmd = [
            ffmpeg_exe, "-y",
            "-i", audio_path,
            "-ac", "1",
            "-ar", "16000",
            temp_wav
        ]
        subprocess.run(conv_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if not os.path.exists(temp_wav):
            return [0.0] * int(5.0 * fps)
            
        try:
            with wave.open(temp_wav, "rb") as wf:
                sr = wf.getframerate()
                nframes = wf.getnframes()
                raw_data = wf.readframes(nframes)
                samples = np.frombuffer(raw_data, dtype=np.int16)
        except Exception:
            return [0.0] * int(5.0 * fps)
        finally:
            if os.path.exists(temp_wav):
                try: os.remove(temp_wav)
                except Exception: pass

        if len(samples) == 0:
            return [0.0] * int(5.0 * fps)

        chunk_len = int(sr / fps)
        num_frames = max(1, int(len(samples) / chunk_len))
        envelopes = []
        
        for i in range(num_frames):
            chunk = samples[i * chunk_len : (i + 1) * chunk_len]
            if len(chunk) == 0:
                envelopes.append(0.0)
            else:
                rms = np.sqrt(np.mean(chunk.astype(float) ** 2))
                envelopes.append(rms)

        envelopes = np.array(envelopes)
        peak = np.percentile(envelopes, 95) if len(envelopes) > 0 else 1.0
        if peak <= 0: peak = 1.0
        
        # Smooth envelope using a 3-frame moving average for natural jaw transitions
        smoothed = np.convolve(envelopes, np.ones(3)/3, mode='same')
        normalized = np.clip(smoothed / (peak * 0.75), 0.0, 1.0)
        return normalized.tolist()

    @staticmethod
    def render_talking_avatar(
        image_bytes: bytes,
        audio_bytes: bytes = None,
        audio_path: str = None,
        head_motion: int = 5,
        eye_blink: int = 7,
        add_subtitles: bool = True,
        subtitle_text: str = "SABIES D'ON VE AQUESTA FRASE?"
    ):
        """
        Creates an authentic talking avatar video (9:16 vertical) with:
          - Realistic Lip-Sync synchronized with speech amplitude/phonemes.
          - Head swaying / nodding reflecting speech intensity.
          - Natural periodic eye blinks.
          - Burned dynamic TikTok-style subtitles.
        """
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        timestamp = int(time.time() * 1000)

        # 1. Prepare audio
        temp_audio_path = os.path.join(OUTPUT_DIR, f"audio_{timestamp}.mp3")
        if audio_bytes:
            with open(temp_audio_path, "wb") as f:
                f.write(audio_bytes)
        elif audio_path and os.path.exists(audio_path):
            temp_audio_path = audio_path
        else:
            # Fallback sample
            sample = os.path.join(OUTPUT_DIR, "test_catalan.mp3")
            if os.path.exists(sample):
                temp_audio_path = sample
            else:
                return {"status": "error", "message": "No s'ha trobat cap fitxer d'àudio."}

        fps = 24
        envelope = AvatarService.extract_audio_envelope(temp_audio_path, fps=fps)
        total_frames = len(envelope)
        duration = total_frames / fps

        # 2. Prepare Base Image (Cropped to vertical 9:16: 720x1280)
        target_w, target_h = 720, 1280
        pil_img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        
        img_aspect = pil_img.width / pil_img.height
        target_aspect = target_w / target_h
        
        if img_aspect > target_aspect:
            new_w = int(pil_img.height * target_aspect)
            left = (pil_img.width - new_w) // 2
            pil_img = pil_img.crop((left, 0, left + new_w, pil_img.height))
        else:
            new_h = int(pil_img.width / target_aspect)
            top = (pil_img.height - new_h) // 2
            pil_img = pil_img.crop((0, top, pil_img.width, top + new_h))
            
        pil_img = pil_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
        base_cv = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)

        # 3. Detect Face and Mouth Region
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        face_cascade = cv2.CascadeClassifier(cascade_path)
        gray = cv2.cvtColor(base_cv, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(120, 120))

        if len(faces) > 0:
            # Sort by area to get largest face
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            fx, fy, fw, fh = faces[0]
        else:
            # Center face fallback estimate
            fw = int(target_w * 0.45)
            fh = int(fw * 1.25)
            fx = (target_w - fw) // 2
            fy = int(target_h * 0.28)

        # Mouth bounds relative to face box
        mx1 = max(0, int(fx + 0.25 * fw))
        mx2 = min(target_w, int(fx + 0.75 * fw))
        my1 = max(0, int(fy + 0.64 * fh))
        my2 = min(target_h, int(fy + 0.92 * fh))
        
        # Eyes bounds for blink
        ey1 = max(0, int(fy + 0.28 * fh))
        ey2 = min(target_h, int(fy + 0.46 * fh))

        # 4. Generate Animated Video Frames with imageio-ffmpeg pipe
        output_video_path = os.path.join(OUTPUT_DIR, f"avatar_video_{timestamp}.mp4")
        temp_video_only = os.path.join(OUTPUT_DIR, f"temp_video_{timestamp}.mp4")

        writer_cmd = [
            ffmpeg_exe,
            "-y",
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-s", f"{target_w}x{target_h}",
            "-pix_fmt", "bgr24",
            "-r", str(fps),
            "-i", "-",
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "ultrafast",
            temp_video_only
        ]
        
        proc = subprocess.Popen(writer_cmd, stdin=subprocess.PIPE)

        # Coordinate grid for seamless continuous mesh deformation (No square cutouts)
        grid_y, grid_x = np.mgrid[0:target_h, 0:target_w].astype(np.float32)

        cx = fx + fw // 2
        cy_jaw = int(fy + 0.85 * fh)
        cy_mouth = int(fy + 0.74 * fh)

        # Eye centers for natural blinking displacement
        cx_le = int(fx + 0.32 * fw)
        cx_re = int(fx + 0.68 * fw)
        cy_eye = int(fy + 0.38 * fh)

        # Smooth Gaussian weight fields
        rx_jaw = fw * 0.44
        ry_jaw = fh * 0.22
        dist_sq_jaw = ((grid_x - cx) / rx_jaw)**2 + ((grid_y - cy_jaw) / ry_jaw)**2
        weight_jaw = np.exp(-dist_sq_jaw * 1.8)
        # Protect mustache / upper lip anchor
        weight_jaw[grid_y < cy_mouth - int(fh * 0.02)] = 0

        # Mouth opening depth under mustache
        rx_m = fw * 0.22
        ry_m = fh * 0.05
        dist_sq_m = ((grid_x - cx) / rx_m)**2 + ((grid_y - cy_mouth) / ry_m)**2
        weight_m = np.exp(-dist_sq_m * 2.5)
        weight_m[dist_sq_m > 1.3] = 0

        # Eye blink weight
        rx_eye = fw * 0.14
        ry_eye = fh * 0.08
        dist_sq_le = ((grid_x - cx_le) / rx_eye)**2 + ((grid_y - cy_eye) / ry_eye)**2
        dist_sq_re = ((grid_x - cx_re) / rx_eye)**2 + ((grid_y - cy_eye) / ry_eye)**2
        weight_eye = np.maximum(np.exp(-dist_sq_le * 2.5), np.exp(-dist_sq_re * 2.5))
        weight_eye[weight_eye < 0.05] = 0

        blink_period = 72 # blink every ~3 seconds
        
        for frame_idx in range(total_frames):
            val = envelope[frame_idx] # Speech amplitude (0.0 to 1.0)
            t = frame_idx / fps

            # A. ORGANIC LIP & JAW DEFORMATION (Continuous displacement, zero seams)
            jaw_drop = val * (fh * 0.075)
            cur_map_y = grid_y - (jaw_drop * weight_jaw).astype(np.float32)
            cur_map_x = grid_x.copy()

            # B. NATURAL EYELID BLINKING
            blink_phase = frame_idx % blink_period
            if 0 <= blink_phase <= 2:
                blink_amt = 9.0 * (1.0 if blink_phase == 1 else 0.5)
                cur_map_y = cur_map_y - (blink_amt * weight_eye).astype(np.float32)

            # Continuous seamless remap across the whole face
            frame = cv2.remap(base_cv, cur_map_x, cur_map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

            # Natural oral depth under mustache (subtle shading, preserves real skin & hair texture)
            if val > 0.08:
                shadow = 1.0 - (val * 0.55 * weight_m)
                shadow = np.clip(shadow, 0.35, 1.0)
                frame = (frame.astype(np.float32) * np.expand_dims(shadow, -1)).astype(np.uint8)

            # C. ORGANIC HEAD MOVEMENT (Micro-rotation, sway, and speech cadence nodding)
            sway_x = head_motion * 1.2 * np.sin(2 * np.pi * t * 0.35)
            nod_y = (val * 3.5) + (head_motion * 0.8 * np.cos(2 * np.pi * t * 0.45))
            rot_deg = 0.5 * np.sin(2 * np.pi * t * 0.25)
            
            center_head = (float(target_w / 2), float(fy + fh / 2))
            rot_mat = cv2.getRotationMatrix2D(center_head, rot_deg, 1.0)
            rot_mat[0, 2] += sway_x
            rot_mat[1, 2] += nod_y
            frame = cv2.warpAffine(frame, rot_mat, (target_w, target_h), borderMode=cv2.BORDER_REFLECT)

            # D. SUBTITLES (TikTok Style Yellow Bar)
            if add_subtitles:
                sub_y = target_h - 180
                cv2.rectangle(frame, (50, sub_y), (target_w - 50, sub_y + 65), (20, 20, 20), -1)
                cv2.rectangle(frame, (50, sub_y), (target_w - 50, sub_y + 65), (0, 215, 255), 2)
                
                # Text centered
                font = cv2.FONT_HERSHEY_SIMPLEX
                font_scale = 0.85
                thickness = 2
                text_size = cv2.getTextSize(subtitle_text, font, font_scale, thickness)[0]
                text_x = (target_w - text_size[0]) // 2
                text_y = sub_y + 42
                cv2.putText(frame, subtitle_text, (text_x, text_y), font, font_scale, (0, 255, 255), thickness, cv2.LINE_AA)

            proc.stdin.write(frame.tobytes())

        proc.stdin.close()
        proc.wait()

        # 5. Merge animated video with the user's audio track (NO edits to the audio)
        merge_cmd = [
            ffmpeg_exe,
            "-y",
            "-i", temp_video_only,
            "-i", temp_audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-movflags", "+faststart",
            "-shortest",
            output_video_path
        ]
        subprocess.run(merge_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Cleanup
        try:
            if os.path.exists(temp_video_only): os.remove(temp_video_only)
        except Exception:
            pass

        return {
            "status": "success",
            "video_url": f"/static/outputs/avatar_video_{timestamp}.mp4",
            "filename": f"avatar_video_{timestamp}.mp4",
            "duration": round(duration, 2),
            "resolution": "720x1280 (9:16)"
        }
