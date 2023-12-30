from typing import Optional, List, Any
from pydantic import BaseModel, Field
from PIL import Image

class Txt2ImgOptions(BaseModel):
	"""Options to generate image from text."""
	prompt: str = Field(
		..., description='Prompt to generate image from.'
	)
	negative_prompt: str = Field(
		'', description='Negative prompt.'
	)
	num_inference_steps: int = Field(
		20, description='Number of inference steps.'
	)
	guidance_scale: int = Field(
		5.5, description='CFG/Guidance scale.'
	)
	width: int = Field(512, description='Width of image.')
	height: int = Field(512, description='Height of image.')
	clip_skip: int = Field(
		0,
		description=
		'Number of layers to be skipped from CLIP while computing the prompt embeddings. A value of 1 means that the output of the pre-final layer will be used for computing the prompt embeddings.'
	)

class Txt2ImgResponse(BaseModel):
	"""Response to generate image from text."""
	images: List[
		Image.Image
	] = Field(..., description='Images generated from prompt.')
	nsfw_content_detected: List[bool] = Field(
		...,
		description=
		'List indicating whether the corresponding image contains NSFW content.'
	)
