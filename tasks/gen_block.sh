#!/bin/bash

# Select candidates using standard blocking method

INDEX_FILE="../index/example.data.idx"

TMP_DIR="../tmp"
SELECTOR_DIR="../lib/candidate-selectors"

COUNT=`wc $INDEX_FILE | sed 's/^\s*//' | cut -d' ' -f1`

time node $SELECTOR_DIR/listToPairs.js -c $COUNT < $INDEX_FILE | sort | uniq > $TMP_DIR/blocking.candidates.txt
