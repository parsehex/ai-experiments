#!/bin/bash

if [ ! -d "py_api/venv" ]; then
		./setup-api.sh
else
		source ./py_api/venv/bin/activate
fi

python3 -m py_api.main $@
