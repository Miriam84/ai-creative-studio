import os
import io
import time
import subprocess
import cv2
import numpy as np
import librosa
import scipy.signal as signal
import onnxruntime as ort
import imageio_ffmpeg
from PIL import Image

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "outputs")
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODELS_DIR, "wav2lip_256.onnx")

class Wav2LipService:
    _session = None

    @classmethod
    def get_session(cls):
        if cls._session is None:
            if not os.path.exists(MODEL_PATH):
                return None
            session_options = ort.SessionOptions()
            session_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
            providers = ["CPUExecutionProvider"]
            cls._session = ort.InferenceSession(MODEL_PATH, sess_options=session_options, providers=providers)
        return cls._session

    @staticmethod
    def extract_mel_chunks(audio_path: str, fps: int = 25):
        """
        Extracts 80-channel log-mel spectrogram chunks (16 frames each) using
        exact Wav2Lip mathematical normalization and pre-emphasis.
        """
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        temp_wav = os.path.join(OUTPUT_DIR, f"temp_w2l_{int(time.time() * 1000)}.wav")
        
        # Convert audio to mono 16kHz WAV
        conv_cmd = [
            ffmpeg_exe, "-y",
            "-i", audio_path,
            "-ac", "1",
            "-ar", "16000",
            temp_wav
        ]
        subprocess.run(conv_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if not os.path.exists(temp_wav):
            return [], 0.0

        try:
            wav, sr = librosa.load(temp_wav, sr=16000)
            duration = len(wav) / sr

            # 1. Pre-emphasis filter (k=0.97)
            wav_pre = signal.lfilter([1, -0.97], [1], wav)

            # 2. Short-Time Fourier Transform (STFT)
            D = librosa.stft(y=wav_pre, n_fft=800, hop_length=200, win_length=800)

            # 3. Mel basis projection (80 mels, fmin=55, fmax=7600)
            mel_basis = librosa.filters.mel(sr=16000, n_fft=800, n_mels=80, fmin=55, fmax=7600)
            S = np.dot(mel_basis, np.abs(D))

            # 4. Amplitude to Decibels with min_level_db=-100 and ref_level_db=20
            min_level = np.exp(-100.0 / 20.0 * np.log(10))
            S_db = 20.0 * np.log10(np.maximum(min_level, S)) - 20.0

            # 5. Symmetric normalization to [-4.0, +4.0] matching training distribution
            mel_norm = np.clip(8.0 * ((S_db - (-100.0)) / 100.0) - 4.0, -4.0, 4.0)

            mel_step_size = 16
            mel_idx_mult = 80.0 / fps
            num_frames = max(1, int(duration * fps))

            mel_chunks = []
            for i in range(num_frames):
                start_idx = int(i * mel_idx_mult)
                if start_idx + mel_step_size > mel_norm.shape[1]:
                    chunk = mel_norm[:, -mel_step_size:]
                else:
                    chunk = mel_norm[:, start_idx : start_idx + mel_step_size]
                if chunk.shape[1] < mel_step_size:
                    pad = np.zeros((80, mel_step_size - chunk.shape[1]), dtype=np.float32)
                    chunk = np.concatenate([chunk, pad], axis=1)
                mel_chunks.append(chunk.astype(np.float32))

            return mel_chunks, duration
        finally:
            if os.path.exists(temp_wav):
                try: os.remove(temp_wav)
                except Exception: pass

    @classmethod
    def render(
        cls,
        image_bytes: bytes,
        audio_path: str,
        add_subtitles: bool = True,
        subtitle_text: str = "L'HOME DEL BIGOT A TIKTOK",
        head_motion: int = 5
    ):
        """
        Generates HeyGen-quality Talking Avatar video using calibrated Wav2Lip-256 neural network.
        Synthesizes exact phoneme mouth shapes, real teeth, tongue, and natural lip opening.
        """
        session = cls.get_session()
        if session is None:
            raise RuntimeError("Model Wav2Lip-ONNX no trobat a backend/models.")

        timestamp = int(time.time() * 1000)
        fps = 25

        # 1. Prepare Audio & Mel Chunks with calibrated scale
        mel_chunks, duration = cls.extract_mel_chunks(audio_path, fps=fps)
        total_frames = len(mel_chunks)
        if total_frames == 0:
            raise ValueError("No s'han pogut extreure característiques de l'àudio.")

        # 2. Prepare Base Image (Cropped to 9:16 vertical 720x1280)
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

        # 3. Detect Face Bounding Box
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        face_cascade = cv2.CascadeClassifier(cascade_path)
        gray = cv2.cvtColor(base_cv, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(120, 120))

        if len(faces) > 0:
            faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
            fx, fy, fw, fh = faces[0]
        else:
            fw = int(target_w * 0.45)
            fh = int(fw * 1.25)
            fx = (target_w - fw) // 2
            fy = int(target_h * 0.28)

        # Precise face boundaries: from eyebrows/eyes to chin, avoiding collar/shirt cut
        x1 = max(0, fx)
        x2 = min(target_w, fx + fw)
        y1 = max(0, fy)
        y2 = min(target_h, fy + fh - int(0.02 * fh))
        crop_w = x2 - x1
        crop_h = y2 - y1

        face_crop = base_cv[y1:y2, x1:x2]
        face_256 = cv2.resize(face_crop, (256, 256), interpolation=cv2.INTER_AREA)

        # 4. Prepare Wav2Lip Face Input Tensor (Shape: 1, 6, 256, 256)
        face_norm = face_256.astype(np.float32) / 255.0
        masked_face = face_norm.copy()
        # Lower half (mouth region) masked to let Wav2Lip synthesize phoneme mouth motion
        masked_face[128:, :] = 0.0

        inp_face = np.concatenate([masked_face, face_norm], axis=2).transpose(2, 0, 1)
        inp_face = np.expand_dims(inp_face, 0).astype(np.float32)

        # 5. Create 3-Sided Feather Blend Mask (Seamless cheek, mustache & chin integration)
        mask = np.zeros((crop_h, crop_w), dtype=np.float32)
        r_start = int(0.48 * crop_h)
        r_end = int(0.60 * crop_h)
        for r in range(r_start, crop_h):
            mask[r, :] = min(1.0, (r - r_start) / max(1, (r_end - r_start)))

        # Soft bottom fade at chin (no shirt/neck line)
        r_bottom = int(0.88 * crop_h)
        for r in range(r_bottom, crop_h):
            mask[r, :] *= max(0.0, (crop_h - r) / max(1, crop_h - r_bottom))

        # Soft lateral cheek fade
        c_mid = crop_w / 2.0
        c_dist = np.abs(np.arange(crop_w) - c_mid) / c_mid
        c_fade = np.clip((1.0 - c_dist) / 0.15, 0.0, 1.0)
        mask *= np.expand_dims(c_fade, 0)
        mask = cv2.GaussianBlur(mask, (25, 25), 9)
        mask = np.expand_dims(mask, -1)

        # 6. Stream Frames to FFmpeg Pipe
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        output_video_path = os.path.join(OUTPUT_DIR, f"avatar_video_{timestamp}.mp4")
        temp_video_only = os.path.join(OUTPUT_DIR, f"temp_w2l_{timestamp}.mp4")

        writer_cmd = [
            ffmpeg_exe, "-y",
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

        for frame_idx in range(total_frames):
            t = frame_idx / fps

            # Prepare mel tensor (1, 1, 80, 16)
            cur_mel = np.expand_dims(np.expand_dims(mel_chunks[frame_idx], 0), 0)

            # Neural Lip Sync forward pass
            pred = session.run(None, {
                "mel_spectrogram": cur_mel,
                "video_frames": inp_face
            })[0][0]

            # Convert predicted face to uint8 BGR
            pred_face = pred.transpose(1, 2, 0) * 255.0
            pred_face = np.clip(pred_face, 0, 255).astype(np.uint8)
            pred_face_resized = cv2.resize(pred_face, (crop_w, crop_h), interpolation=cv2.INTER_LANCZOS4)

            # Seamless blend into base frame
            frame = base_cv.copy()
            curr_crop = frame[y1:y2, x1:x2].astype(np.float32)
            blended = (1.0 - mask) * curr_crop + mask * pred_face_resized.astype(np.float32)
            frame[y1:y2, x1:x2] = blended.clip(0, 255).astype(np.uint8)

            # Organic head movement (subtle micro-sway and breathing)
            sway_x = head_motion * 1.0 * np.sin(2 * np.pi * t * 0.35)
            nod_y = head_motion * 0.7 * np.cos(2 * np.pi * t * 0.45)
            rot_deg = 0.35 * np.sin(2 * np.pi * t * 0.25)
            
            center_head = (float(target_w / 2), float(fy + fh / 2))
            rot_mat = cv2.getRotationMatrix2D(center_head, rot_deg, 1.0)
            rot_mat[0, 2] += sway_x
            rot_mat[1, 2] += nod_y
            frame = cv2.warpAffine(frame, rot_mat, (target_w, target_h), borderMode=cv2.BORDER_REFLECT)

            # TikTok Subtitles Banner
            if add_subtitles:
                sub_y = target_h - 180
                cv2.rectangle(frame, (50, sub_y), (target_w - 50, sub_y + 65), (20, 20, 20), -1)
                cv2.rectangle(frame, (50, sub_y), (target_w - 50, sub_y + 65), (0, 215, 255), 2)
                
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

        # 7. Merge with original unedited user audio using FFmpeg with +faststart
        merge_cmd = [
            ffmpeg_exe, "-y",
            "-i", temp_video_only,
            "-i", audio_path,
            "-c:v", "copy",
            "-c:a", "aac",
            "-movflags", "+faststart",
            "-shortest",
            output_video_path
        ]
        subprocess.run(merge_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        try:
            if os.path.exists(temp_video_only): os.remove(temp_video_only)
        except Exception: pass

        return {
            "status": "success",
            "video_url": f"/static/outputs/avatar_video_{timestamp}.mp4",
            "filename": f"avatar_video_{timestamp}.mp4",
            "duration": round(duration, 2),
            "resolution": "720x1280 (9:16)",
            "engine": "Wav2Lip-256 Neural AI"
        }
