#!/bin/bash -x

yinst_create -t release -clean -target_dir $PUBLISH_DIR  $SOURCE_DIR/yahoo/horizon.yicf
dist_install -batch -identity ~/.ssh/rsa_dist -headless -branch test -nomail $PUBLISH_DIR/*.tgz