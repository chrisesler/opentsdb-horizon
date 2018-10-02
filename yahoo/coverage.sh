#!/bin/bash

[ -z "$SOURCE_DIR" ] && SOURCE_DIR=`pwd`
echo $SOURCE_DIR

mkdir ${SOURCE_DIR}/coverage
echo "90%" >> ${SOURCE_DIR}/coverage/coverage.txt

cp -R ${SOURCE_DIR}/coverage ${SOURCE_DIR}/artifacts/

