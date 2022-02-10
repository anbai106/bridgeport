#!/bin/bash

set -e
cd $(dirname $0)/../data
rm -rf gif mp4 webm || true
mkdir gif mp4 webm

for x in 32 64; do
    convert -delay 0 -resize 50% -loop 0 $(ls png/C${x}/* | sort -k 1.16g) gif/C${x}.gif
done

for x in 128 256 512; do
    convert -delay 0 -resize 50% -loop 0 $(ls png/C${x}/* | sort -k 1.18g) gif/C${x}.gif
done

x=1024
convert -delay 0 -resize 50% -loop 0 $(ls png/C${x}/* | sort -k 1.20g) gif/C${x}.gif

for x in 32 64 128 256 512 1024; do
    ffmpeg -i gif/C${x}.gif -b:v 0 -crf 25 -f mp4 -vcodec libx264 -pix_fmt yuv420p mp4/C${x}.mp4
    ffmpeg -i gif/C${x}.gif -c vp9 -b:v 0 -crf 41 webm/C${x}.webm
done
