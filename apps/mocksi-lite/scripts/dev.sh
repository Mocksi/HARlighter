#!/bin/bash

TEMP_DIR=/tmp/mocksi-lite-dev

# Step 0: Run Chrome with the temporary directory
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --user-data-dir="$TEMP_DIR" \
  --load-extension="$TEMP_DIR" \
  --no-first-run \
  --disable-client-side-phishing-detection \
  --disable-component-extensions-with-background-pages \
  --disable-default-apps \
  --disable-features=InterestFeedContentSuggestions,Translate,MediaRoute,AutofillServerCommunication,CertificateTransparencyComponentUpdate,OptimizationHints,DialMediaRouteProvider \
  --hide-scrollbars \
  --mute-audio \
  --no-default-browser-check \
  --ash-no-nudges \
  --disable-search-engine-choice-screen \
  --propagate-iph-for-testing \
  --use-mock-keychain \
  --disable-background-networking \
  --disable-breakpad \
  --disable-component-update \
  --disable-domain-reliability \
  --disable-sync \
  --enable-crash-reporter-for-testing \
  --metrics-recording-only \
  --no-pings \
  --enable-features=SidePanelUpdates