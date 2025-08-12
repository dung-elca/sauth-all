#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")"; pwd)"
DESKTOP_DIR="$HOME/Desktop"

echo "Building iOS..."
flutter build ipa --release

echo "Copying iOS build to Desktop..."
IOS_BUILD_DIR="$PROJECT_DIR/build/ios/ipa/mobile.ipa"
cp -R "$IOS_BUILD_DIR" "$DESKTOP_DIR/mobile.ipa"

echo "Done! iOS build copied to Desktop."