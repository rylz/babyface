# Use the official Node image for the react build
# FROM pytorch/pytorch:2.2.2-cuda12.1-cudnn8-runtime
FROM node:22-bullseye

# Create and change to the app directory.
WORKDIR /usr/src/app

# Allow statements and log messages to immediately appear in the Cloud Run logs
ENV PYTHONUNBUFFERED 1
# disable CUDA in torch
ENV CUDA_VISIBLE_DEVICES ""
ENV USE_CUDA 0
ENV USE_CUDNN 0
ENV PDM_HOME /usr/local
ENV PDM_PYTHON /usr/local/bin/python
# install pdm
RUN apt-get update
RUN apt-get install -y curl python3-pip python3-venv

ADD pyproject.toml ./
ADD requirements.txt ./

RUN pip install -r requirements.txt

# Copy local code to the container image.
COPY . ./

# install esbuild/react
RUN rm -r node_modules
RUN npm install --save-exact --save-dev esbuild
RUN npm install react react-dom

# prebuild react app
RUN bash -c "node_modules/.bin/esbuild App.jsx --loader:.js=jsx --bundle --outfile=out.js"
RUN mv out.js src/babyface/static/app.js

# Run the web service on container startup.
# Use gunicorn webserver with one worker process and 8 threads.
# For environments with multiple CPU cores, increase the number of workers
# to be equal to the cores available.
# Timeout is set to 0 to disable the timeouts of the workers to allow Cloud Run to handle instance scaling.
CMD exec bash -c "PYTHONPATH=src:$PYTHONPATH gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 babyface:app"
