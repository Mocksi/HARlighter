#!/bin/bash

# Step 0: set temporary directory
TEMP_DIR=/tmp/mocksi-lite-dev

# Step 1: get current git commit hash
GIT_COMMIT=$(git rev-parse --short HEAD)

# Step 2: get current semver version
VERSION=$(node -p "require('./package.json').version")

mkdir -p dist/builds

# Step 3: zip the temporary directory and add it to dist
zip -r "dist/builds/mocksi-lite-$VERSION-$GIT_COMMIT.zip" "$TEMP_DIR"

# Step 4: open the dist folder
open "dist/builds"