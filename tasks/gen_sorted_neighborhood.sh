#!/bin/bash
#
# Select candidates using sorted neighbourhood method

INDEX_FILE="../index/example.data.idx"

TMP_DIR="../tmp"
SELECTOR_DIR="../lib/candidate-selectors"

COUNT=`wc $INDEX_FILE | sed 's/^\s*//' | cut -d' ' -f1`

time node $SELECTOR_DIR/sliding_window.js < $INDEX_FILE > $TMP_DIR/sorted_neighborhood.candidates.txt
