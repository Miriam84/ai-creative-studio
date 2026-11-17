# OmniStudio 🎨🎬🎙️

> **The All-in-One Local AI Creative Suite:** Combining the best of **Magnific AI** (Super-Resolution & Hallucinated Detail), **Higgsfield AI** (Cinematic Video & Camera Motion), and **ElevenLabs** (Hyper-Realistic Voice, Cloning & SFX).

---

## 🌟 Característiques Principals

### 1. ✨ Mòdul Magnific (Upscale & Detall Generatiu)
* **Reescalat 4K i 8K:** Multiplicadors de 2x, 4x, 8x i 16x.
* **Slider d'Al·lucinació / Creativitat:** Afegeix microdetalls (porus de pell, arrugues d'expressió, teixits, reflexos).
* **Fidelitat de Fesomia (Resemblance):** Preserva la identitat de la persona o l'objecte original.
* **Preajustos de Textura (Fractality):** Retrat humà, gra de pel·lícula 35mm, superfícies sci-fi, natura i art pictòric.
* **Visor Comparatiu interactiu (Before/After):** Barra lliscant dividida per analitzar els detalls amb zoom.

### 2. 🎬 Mòdul Higgsfield (Càmera & Vídeo Cinemàtic)
* **Image-to-Video:** Converteix qualsevol imatge o fotograma millorat en vídeo fluid.
* **Director de Càmera (Camera Director):**
  * Dolly Zoom In / Zoom Out
  * Pan Dret / Pan Esquerre
  * Tilt Up / Down
  * Gir orbital 3D al voltant del personatge
* **Control de Dinamisme:** Velocitat de càmera, tremolor orgànic (*camera shake*), i animació facial/mirada.
* **Formats múltiples:** 16:9 (Cinema), 9:16 (Reels/TikTok/Shorts) i 1:1.

### 3. 🎙️ Mòdul ElevenLabs (Veu, Clonació & Efectes Sonors)
* **Text-to-Speech Ultra-Expressiu:** Síntesi de veu cinemàtica amb control d'estabilitat, claredat i expressivitat.
* **Clonació Instantània de Veu:** Puja un fragment d'àudio de 15 segons per clonar qualsevol veu.
* **Generador d'Efectes de So (SFX):** Crea ambients, foley, explosions o transicions cinemàtiques a partir de text.
* **Sincronització Labial & Dubbing:** Incrusta l'àudio directament al vídeo generat a Higgsfield.

---

## ⚡ Multi-PC: Optimitzat per al teu Portàtil i per a PCs Potents

L'aplicació compta amb un **detector intel·ligent de maquinari** i commuta automàticament entre dos modes:

| Perfil | Maquinari Objectiu | Tècniques Utilitzades |
| :--- | :--- | :--- |
| **Mode Lite** | Portàtils amb 4 GB - 8 GB VRAM *(Ex: RTX 3050 Laptop)* | Tiled Diffusion (divideix la imatge en tessel·les per no saturar la memòria), AnimateDiff LCM, Edge-TTS. |
| **Mode Pro** | Estacions de treball amb 16 GB - 24+ GB VRAM *(Ex: RTX 3090, 4080, 4090)* | Models complets en VRAM (SUPIR, Flux, HunyuanVideo, Wan 2.1 14B, F5-TTS). |

---

## 🚀 Com engegar-la en aquest equip (Windows)

Pots arrencar tota l'aplicació amb **un sol clic**:

```cmd
start.bat
```

Aquest script:
1. Crearà l'entorn virtual de Python i instal·larà les dependències del backend.
2. Arrencarà l'API de FastAPI a `http://localhost:8000`.
3. Instal·larà les dependències del frontend i obrirà la interfície web a `http://localhost:5173`.

---

## 🖥️ Com utilitzar-la en un altre PC més potent

Per executar l'estudi en un ordinador de sobretaula amb una GPU gran:

1. **Clona el repositori:**
   ```bash
   git clone https://github.com/Miriam84/ai-creative-studio.git
   cd ai-creative-studio
   ```

2. **Executa el llançador:**
   * A **Windows**: fes doble clic a `start.bat`.
   * A **Linux / macOS**: executa `./start.sh`.

3. **Opcional (Accés en xarxa local):**
   Pots deixar l'app executant-se al PC potent i accedir-hi des del portàtil entrant a `http://<IP-DEL-PC-POTENT>:5173`.

---

## 📁 Estructura del Projecte

```text
ai-creative-studio/
├── frontend/                     # Interfície React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── MagnificStudio.jsx     # Reescalat, detalls i al·lucinació
│   │   │   ├── HiggsfieldStudio.jsx   # Director de càmera i generador de vídeo
│   │   │   ├── ElevenLabsStudio.jsx   # Veu, clonació i efectes de so
│   │   │   ├── WorkflowStudio.jsx     # Pipeline complet automàtic
│   │   │   ├── ComparisonSlider.jsx   # Split-screen Before/After
│   │   │   └── HardwareSettings.jsx   # Selector de maquinari i claus API
│   │   └── App.jsx
│   └── package.json
├── backend/                      # Servidor FastAPI
│   ├── hardware.py               # Detecció de GPU / VRAM
│   ├── services/
│   │   ├── magnific_service.py   # Motor de reescalat i textures
│   │   ├── higgsfield_service.py # Trajectòries de càmera i vídeo
│   │   └── elevenlabs_service.py # Síntesi de veu i SFX
│   ├── main.py                   # Rutes API
│   └── requirements.txt
├── start.bat                     # Llançador 1-clic per a Windows
├── start.sh                      # Llançador per a Linux/macOS
├── docker-compose.yml            # Desplegament Docker amb NVIDIA GPU
└── README.md
```

---

## 🔑 Claus d'API (Opcional)

Si vols connectar directament la teva clau d'**ElevenLabs** per a una fidelitat màxima de veu:
1. Copia `backend/.env.example` a `backend/.env`.
2. Afegeix la teva clau:
   ```env
   ELEVENLABS_API_KEY=el_teu_token_aqui
   ```
*(També pots introduir la clau directament des de la pestanya "Hardware & Multi-PC" a la interfície web).*

---

Desenvolupat amb ❤️ per a creació multimèdia autònoma i d'alt rendiment.
