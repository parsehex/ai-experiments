from py_api.client.img.base import ImgClient_Base
from py_api.models.img.img_client import Txt2ImgOptions, Txt2ImgResponse
from PIL import Image
from diffusers.pipelines.auto_pipeline import AutoPipelineForText2Image
from diffusers.pipelines.stable_diffusion.pipeline_stable_diffusion import StableDiffusionPipeline
from diffusers.pipelines.stable_diffusion.pipeline_output import StableDiffusionPipelineOutput
from diffusers.pipelines.pipeline_utils import DiffusionPipeline
import base64
from io import BytesIO

import torch
from typing import Union, List, Any
from py_api.args import Args
import os

class ImgClient_Diffusers(ImgClient_Base):
	device = 'cuda' if torch.cuda.is_available() else 'cpu'
	model: Union[StableDiffusionPipeline, None] = None
	pipeline: Union[DiffusionPipeline, None] = None

	# def __init__(self):
	# 	self.model = None
	# 	self.model_name = None
	# 	self.model_abspath = None

	def load_model(self, model_name: str):
		if model_name is None or model_name == '':
			model_name = Args['img_model']
		if model_name == self.model_name:
			return
		self.model_name = model_name
		self.abspath = os.path.join(
			Args['img_models_dir'], model_name
		)
		self.pipeline = StableDiffusionPipeline.from_single_file(
			self.abspath
		)
		self.pipeline.to(self.device)
		self.model = AutoPipelineForText2Image.from_pipe(
			self.pipeline
		)
		self.loaded = True

	def unload_model(self):
		self.model = None
		self.model_name = None
		self.model_abspath = None
		self.loaded = False
		torch.cuda.empty_cache()

	def txt2img(
		self, gen_options: Txt2ImgOptions
	) -> Txt2ImgResponse:
		if not self.loaded:
			self.load_model('')
			if not self.loaded:
				raise Exception('Model not loaded.')
		if gen_options is None or gen_options.prompt is None:
			raise Exception('No prompt provided.')
		if gen_options.prompt == '':
			raise Exception('No prompt provided.')
		assert self.model is not None
		prompt = gen_options.prompt
		prompt = prompt.replace('\n', ' ')
		prompt = prompt.replace('\r', ' ')
		prompt = prompt.replace('\t', ' ')
		prompt = prompt.replace('  ', ' ')
		prompt = prompt.strip()

		opt = gen_options.model_dump()
		res = self.model(**opt)
		assert isinstance(res, StableDiffusionPipelineOutput)
		img = res.images[0]
		assert isinstance(img, Image.Image)
		imgb64 = 'data:image/png;base64,'
		with BytesIO() as buffer:
			img.save(buffer, 'png')
			imgb64 += base64.b64encode(buffer.getvalue()).decode()

		return Txt2ImgResponse(
			images=[imgb64], nsfw_content_detected=[False]
		)

	# def img2img(
	# 	self, gen_options: Img2ImgOptions
	# ) -> Img2ImgResponse:
	# 	raise NotImplementedError()
