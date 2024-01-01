from typing import Union, Dict
from py_api.args import Args
from py_api.client.base_manager import BaseAIManager
from py_api.client.img import ImgClient_Diffusers

ClientUnion = ImgClient_Diffusers
ClientDict = Dict[str, ClientUnion]

class ImgManager(BaseAIManager):
	_instance = None
	clients: ClientDict = {
		'diffusers': ImgClient_Diffusers.instance,
	}
	loader: Union[ClientUnion, None] = None

	def __init__(self):
		self.clients = {
			'diffusers': ImgClient_Diffusers.instance,
		}
		self.default_model = Args['img_model']
		self.models_dir = Args['img_models_dir']

	def pick_client(self, model_name: str):
		return 'diffusers'

	def txt2img(self, gen_options):
		if self.loader is None:
			raise Exception('No model loaded.')
		return self.loader.txt2img(gen_options)

	# def img2img(self, gen_options):
