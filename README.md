# BabyFace

A simple flask/react app built on top of [FaceNet](timesler/facenet-pytorch) to resolve the age-old debate: "Does baby look more like Mommy or Daddy?"

See [BabyFace in action](https://babyface.viviandriley.com)!

Designed to be built using docker, and then deployed to any service that can run docker images.

The facenet-pytorch dependency pulls in a 107MB pytorch model called vggface2.
This, plus pytorch itself, results in a larger docker image than you might expect for a typical simple web app.
Its startup time is also fairly long due to this (5-10 seconds on Google Cloud Run with default settings), and it requires just over 1GB of available RAM.
[![Run on Google Cloud](https://deploy.cloud.run/button.svg)](https://deploy.cloud.run)

## Building and Deploying

Which docker tags and platform you build for, as well as how you deploy images, will vary based on where you're ultimately hosting BabyFace.
As an example, the following steps allow you to build and deploy for Google Cloud Run:

1. From the project root, build the docker image:
    ```bash
    export GOOGLE_CLOUD_PROJECT=your-project-id
    export GOOGLE_CLOUD_RUN_DEPLOYMENT=your-deployment-name
    export GOOGLE_CLOUD_REGION=us-central1 # or wherever you'd like to deploy
    export DOCKER_TAG=`git log -1 --oneline | cut '-d ' -f1`
    docker build --platform linux/amd64 -t $GOOGLE_CLOUD_REGION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/$GOOGLE_CLOUD_RUN_DEPLOYMENT:$DOCKER_TAG
    ```

2. Deploy to Google Cloud Artifact Repository:
    ```bash
    docker push $GOOGLE_CLOUD_REGION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/$GOOGLE_CLOUD_RUN_DEPLOYMENT:$DOCKER_TAG
    gcloud run deploy $GOOGLE_CLOUD_RUN_DEPLOYMENT --image $GOOGLE_CLOUD_REGION-docker.pkg.dev/$GOOGLE_CLOUD_PROJECT/$GOOGLE_CLOUD_RUN_DEPLOYMENT:$DOCKER_TAG --platform managed --region GOOGLE_CLOUD_REGION
    ```

## Run locally without Docker

You may want to run the app locally without Docker if you already have most of the dependencies and what to avoid slow build times and storage requirements.

1. Install the pip and npm dependencies:
    ```bash
    pip install -r requirements.txt
    npm install
    ```

2. Build the React app and place it in the Flask app's static directory
    ```bash
    esbuild App.jsx --bundle --outfile=app.js
    mv app.js src/babyface/static
    ```

3. Run the CLI-based embedding utility just to prefetch the pytorch model. It's ok that this will report a usage error after downloading the model.
    ```bash
    python src/babyface/embedding.py
    ```

4. Run the python webserver:
    ```bash
    PYTHONPATH=src:$PYTHONPATH gunicorn --bind :8080 --workers 1 --threads 8 --timeout 0 babyface:app
    ```
