import logging

LOG_LEVEL = logging.INFO

HOST = '127.0.0.1'
PORT = 5000

LLM_MODELS_DIR = '/media/user/AI Models/LLaMA'
SD_MODELS_DIR = '/media/user/AI Models/Stable-Diffusion/ckpt'

# LLM_MODEL = 'TheBloke_Luna-AI-Llama2-Uncensored-GPTQ_gptq-4bit-32g-actorder_True'
LLM_MODEL = 'dolphin-2.2.1-mistral-7B.Q5_K_M/dolphin-2.2.1-mistral-7b.Q5_K_M.gguf'
# LLM_MODEL = 'hf:LoneStriker/dolphin-2.2.1-mistral-7b-4.0bpw-h6-exl2'
TTS_MODEL = 'hf:coqui/XTTS-v2'

SD_MODEL = 'babes_20.safetensors'
SD_USE_SDXL = False
SD_DEFAULT_STEPS = 20
SD_DEFAULT_CFG = 6.0

LLM_DEFAULT_SEED = -1
LLM_MAX_SEQ_LEN = 4096 # (n_ctx)
LLM_SCALE_POS_EMB = 1.5 # (recommended = 2.0 @ 4096) 1.0 works great but generates lengthy replies
