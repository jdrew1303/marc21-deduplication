#!/bin/bash
#
# Checks similarity for each pair in given candidate list

# Generate feature vectors from candidate pairs

FILEID="test"

CANDIDATES="../tmp/$FILEID.candidates.txt"
VECTORS="../tmp/$FILEID.vectors.txt"
EXTRACTOR_DIR="../lib/similarity/extractors"
node $EXTRACTOR_DIR/batch.js -s strategy all $CANDIDATES > $VECTORS


cat $VECTORS | grep "^[0-9]" > $VECTORS.formatted

# Classify vectors 

RESULT_DIR="../result"

CLASSIFIER_DIR="../lib/similarity/classifiers"
node $CLASSIFIER_DIR/neural/exec.js -f $VECTORS.formatted > $RESULT_DIR/$FILEID.similarity