#!/bin/bash

TEMP_DIR=/tmp/mocksi-lite-dev
# Step 0: Clean the dist folder
rm -rf dist || mkdir dist ## Empty or create dist folder
mkdir -p dist/chrome/icon

# Step 1: Compile TypeScript and run Tailwind
npx tsc --outDir dist/chrome --sourceMap
npx tailwindcss -c tailwind.config.js -o dist/chrome/content/content.css

# Step 1.5: Bundle JavaScript using Webpack
npx webpack --config webpack.config.js

# Step 1.6: Copy manifest.json and icons to dist/chrome
cp manifest.json dist/chrome/
cp public/icon/* dist/chrome/icon/

# Step 1.7: Remove .d.ts files from dist/chrome
find dist/chrome -name '*.d.ts' -delete
find dist/chrome -name '*.d.ts.map' -delete

# Step 2: Create a temporary directory and copy files
mkdir -p "$TEMP_DIR"

echo "Using temporary directory: $TEMP_DIR"

cp -r dist/chrome/* "$TEMP_DIR"
cp -r public/* "$TEMP_DIR"

# Step 3: Check manifest.json exists in the temporary directory
if [ ! -f "$TEMP_DIR/manifest.json" ]; then
  echo "manifest.json not found in temporary directory"
  exit 1
fi

# Step 3.1: Check background.js exists in the temporary directory
if [ ! -f "$TEMP_DIR/background.js" ]; then
  echo "background.js not found in temporary directory"
  exit 1
fi

# Step 3.2: Check content.js exists in the content_scripts directory
if [ ! -f "$TEMP_DIR/content/content.js" ]; then
  echo "content.js not found in content_scripts directory"
  exit 1
fi