#!/bin/bash
unzip /tmp/archive.zip -d /home/tjctgrader/coderunner/nsjail/configs/
exec "$@"
