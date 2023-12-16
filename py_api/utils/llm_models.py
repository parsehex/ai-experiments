import logging, re

logger = logging.getLogger(__name__)

def parse_size_and_quant(model_file_name):
	size = ''
	quant = ''
	size_m = re.search(r'(\.|-|_)(\d+)b(\.|-|_)', model_file_name.lower())
	quant_m = re.search(r'\.(q\d(_[a-z0-9])+)', model_file_name.lower())
	if size_m:
		size = size_m.group(2)
	if quant_m:
		quant = quant_m.group(1)
	if size == '':
		logger.error(f"WARNING: Could not determine model size from model name {model_file_name}.")
	if quant == '':
		logger.error(f"WARNING: Could not determine quant from model name {model_file_name}.")
	return size, quant
