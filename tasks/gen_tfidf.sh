#!/bin/bash

# Select candidates using canopy clustering with tf-idf

INDEX_FILE="../index/example.data.idx"

TMP_DIR="../tmp"
SELECTOR_DIR="../lib/candidate-selectors"

COUNT=`wc $INDEX_FILE | sed 's/^\s*//' | cut -d' ' -f1`

node $SELECTOR_DIR/tfidf_tokenlist.js -c $COUNT < $INDEX_FILE > $TMP_DIR/tf-idf.tokens

LC_ALL=C sort -n $TMP_DIR/tf-idf.tokens > $TMP_DIR/tokens.sorted

TOKENCOUNT=`wc $TMP_DIR/tokens.sorted | sed 's/^\s*//' | cut -f 1 -d' '`
node $SELECTOR_DIR/tfidf_index.js -c $TOKENCOUNT < $TMP_DIR/tokens.sorted > $TMP_DIR/tokens.index
cat $TMP_DIR/tokens.index | LC_ALL=C sort -n > $TMP_DIR/tokens.index.sorted
INDEXCOUNT=`wc $TMP_DIR/tokens.index.sorted | sed 's/^\s*//' | cut -f 1 -d' '`
#cat tokens.sorted | uniq | cut -f 1 | uniq -c | sed 's/^\s*//' | LC_ALL=C sort -n > tokens.freq
#TOKENS=`wc tokens.freq | sed 's/^\s*//' | cut -f 1 -d' '`

# This will remove 1/1000 of the most used words.
DROPCOUNT=`echo "$INDEXCOUNT*0.001" | bc | cut -f 1 -d'.'`
head -n -$DROPCOUNT $TMP_DIR/tokens.index.sorted > $TMP_DIR/tokens.index.sorted.pruned

# Similarity thresholds, larger means more similar.
LOOSE=10
TIGHT=20
node --max-old-space-size=4000 $SELECTOR_DIR/query_canopy_bigram_tfidf.js -c $COUNT -f $TMP_DIR/tokens.index.sorted.pruned -l $LOOSE -t $TIGHT < $INDEX_FILE > $TMP_DIR/canopy-tfidf.candidates.txt
