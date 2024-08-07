#!/bin/bash

TEMP_DIR=/tmp/mocksi-lite-dev
# Step 0: Clean the dist folder
rm -rf dist
mkdir -p dist/chrome/icon

# Step 1: Compile TypeScript and run Tailwind
npx tsc --outDir dist/chrome --sourceMap
npx tailwindcss -c tailwind.config.js -o dist/chrome/content/content.css

# Step 1.5: Bundle JavaScript using Webpack
BUILD_MODE=${BUILD_MODE:-development}
echo "Building in ${BUILD_MODE} mode"
npx webpack --config webpack.config.js --mode ${BUILD_MODE}

# Step 1.6: Copy manifest.json and icons to dist/chrome
cp manifest.json dist/chrome/
cp public/icon/* dist/chrome/icon/

# Step 1.7: Remove .d.ts files from dist/chrome
find dist/chrome -name '*.d.ts' -delete
find dist/chrome -name '*.d.ts.map' -delete

# Remove source maps in production mode
if [ "$BUILD_MODE" = "production" ]; then
  find dist/chrome -name '*.js.map' -delete
fi

# Step 2: Create a temporary directory and copy files
mkdir -p "$TEMP_DIR"

echo "Using temporary directory: $TEMP_DIR"

cp -r public/* dist/chrome/
cp -r dist/chrome/* "$TEMP_DIR"

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

# Step 3.3: Check icon_16.png exists in the icon directory
if [ ! -f "$TEMP_DIR/icon/icon_16.png" ]; then
  echo "icon_16.png not found in icon directory"
  exit 1
fi