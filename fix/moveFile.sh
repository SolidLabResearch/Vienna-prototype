#!/bin/bash
# This mitigates the requirement for version 21 of Node.js by importing the crypto lib manually

cp fix/common.js node_modules/rdfjs-c14n/dist/lib/common.js