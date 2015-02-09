#!/bin/bash

# Select candidates using deletion neighbourhood method

INDEX_FILE="../index/example.data.idx"

TMP_DIR="../tmp"
SELECTOR_DIR="../lib/candidate-selectors"

COUNT=`wc $INDEX_FILE | sed 's/^\s*//' | cut -d' ' -f1`

# Generate deletion neighbourhood index file
time node $SELECTOR_DIR/block_with_deletions.js -c $COUNT < $INDEX_FILE | sort > $TMP_DIR/deletion_neighborhood.idx.txt

# Generate candidates from deletion neighbourhood index file using standard blocking method
time node $SELECTOR_DIR/listToPairs.js -c $COUNT < $TMP_DIR/deletion_neighborhood.idx.txt | sort | uniq > $TMP_DIR/deletion_neighborhood.candidates.txt

