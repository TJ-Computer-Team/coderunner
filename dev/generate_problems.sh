#!/bin/bash
BASE_DIR="/home/tjctgrader/problems"
mkdir -p "$BASE_DIR"

# Loop to create directories 0-9
for i in {1..25}; do
    PROBLEM_DIR="$BASE_DIR/$i"
    mkdir -p "$PROBLEM_DIR"

    # Copy the 'code' file into each problem directory
    cp /home/tjctgrader/coderunner/dev/code "$PROBLEM_DIR/"

    # Create 'sol' and 'test' subdirectories
    for sub in sol test; do
        SUB_DIR="$PROBLEM_DIR/$sub"
        mkdir -p "$SUB_DIR"
        
        for j in {0..9}; do
            echo 7 > "$SUB_DIR/$j"
        done
    done
done
