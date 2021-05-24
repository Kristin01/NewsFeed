#!/bin/bash
## ./train.sh data_dir
## 
FILE="GoogleNews-vectors-negative300.bin"
if [ ! -f $FILE ]; then
    curl -O https://s3.amazonaws.com/dl4j-distribution/GoogleNews-vectors-negative300.bin.gz
    gunzip -d GoogleNews-vectors-negative300.bin.gz
fi

python train.py $1
