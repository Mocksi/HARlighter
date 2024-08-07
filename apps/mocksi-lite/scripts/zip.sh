#!/bin/bash

# Step 0: set temporary directory
DIST_DIR=dist/chrome

# Step 1: get current git commit hash
GIT_COMMIT=$(git rev-parse --short HEAD)

# Step 2: get current semver version
VERSION=$(node -p "require('./package.json').version")

BUILD_MODE=${BUILD_MODE:-development}

mkdir -p dist/builds

# Step 3: zip the temporary directory and add it to dist
zip -r "dist/builds/mocksi-lite-$VERSION-$GIT_COMMIT-$BUILD_MODE.zip" "$DIST_DIR"

# Step 4: open the dist folder only if the build mode is development
if [ "$BUILD_MODE" == "development" ]; then
  open "dist/builds"
fi