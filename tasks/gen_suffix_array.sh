#!/bin/bash

# Select candidates using suffix array method


INDEX_FILE="../index/example.data.idx"

TMP_DIR="../tmp"
SELECTOR_DIR="../lib/candidate-selectors"

COUNT=`wc $INDEX_FILE | sed 's/^\s*//' | cut -d' ' -f1`

SUFFIX_TABLE_FILE=$TMP_DIR/suffix-array.table.txt
time node $SELECTOR_DIR/generate_suffix-table.js -c $COUNT < $INDEX_FILE | sort | uniq > $SUFFIX_TABLE_FILE

COUNT=`wc $SUFFIX_TABLE_FILE | sed 's/^\s*//' | cut -d' ' -f1`

time node $SELECTOR_DIR/suffixTable_to_pairs.js -c $COUNT < $SUFFIX_TABLE_FILE > $TMP_DIR/suffix-array.candidates.txt