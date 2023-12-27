# py-api server

## Overview

This is an api server to support this `ai-experiments` collection of demos.

Instead of finding and using yet another third-party server (and probably multiple of them) to serve an api I'm just going to make a light-and-easy api that does what I need.

This may be a learning experience but hopefully it grows into something standalone. For now there's lots to do.

## Background + IDK

When I start `ai-experiments`, I also start up at least Oobabooga and possibly Automatic1111 or even XTTS too. Having all 3 together would be great, and I think there's a lot that could be done server- / api-side to make app-dev easier and make for a nicer experience.

## Setup

`../setup-api.sh`

## Structure Info

For each of LLM, TTS or STT (or any other AI model types in the future), the following structure is used to (hopefully) manage the variety of the AI ecosystem:

- `api/` (e.g. `llm_api`) - The API routes for that AI. The endpoints use the `manager` for that AI to do the work.
- `client/[AI]_client_manager.py` - The manager for that AI. The manager exposes methods to power the API and handles which client to use.
- `client/[AI]/` - The clients for that AI. There's a `base.py` class that all clients inherit from, and then a client for each client. The client has the specific code for working with the model.
- `models/` - contains the pydantic models that the API routes and clients use.

As of now, the LLM API is the only one with more than 1 client for the manager to use. TODO clients:

- [ ] TTS/XTTS - xtts actually supports other models too (yourtts is one that does voice cloning)
- [ ] TTS/Silero - Is a fast TTS that can be used for testing or when low on VRAM.
- [ ] STT/OpenAI - Supposed to be no difference but you wouldn't have to run the model, uses the API obviously

The manager handles converting options to the correct format for the client. Currently this only happens with LLM.

## Ideas

- `--hot-[llm|tts|...]` - hot-load the model (using websockets?)
