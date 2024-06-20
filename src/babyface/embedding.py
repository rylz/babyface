import base64
import os
import torch
import re
import sys

from PIL import Image
from facenet_pytorch import MTCNN, InceptionResnetV1

# create a face detection pipeline using MTCNN
mtcnn = MTCNN(image_size=256, margin=0)
# Create an inception resnet (in eval mode)
resnet = InceptionResnetV1(pretrained='vggface2').eval()

"""
Get the embedding for a given PIL.Image.
"""
def get_embedding(img, cropped_img_path=None):
    img_cropped = mtcnn(img, save_path=cropped_img_path)
    return resnet(img_cropped.unsqueeze(0))

def save_embedding(t):
    filename = f"/tmp/t{rand(1000)}.pt"
    torch.save(t, filename)
    with open(filename) as f:
        data = f.read()
    os.remove(filename)

if __name__ == "__main__":
    PATH_RE = re.compile('^(.*)\\.([^.]+)$')

    if len(sys.argv) != 2:
        print("usage: babyface [image path]")
        sys.exit(0)

    img_path = sys.argv[1]
    # TODO change re to use original file type
    cropped_img_path = re.sub('\\.([^.])+$', '_cropped.jpg', img_path)
    print(f"cropping {img_path} to {cropped_img_path}")

    img_embedding = get_embedding(Image.open(img_path), cropped_img_path)
    print(img_embedding)
