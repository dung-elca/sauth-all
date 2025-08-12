#!/bin/bash

set -e

PROJECT_DIR="$(cd "$(dirname "$0")"; pwd)"
DESKTOP_DIR="$HOME/Desktop"

echo "Building Android APK..."
cd "$PROJECT_DIR"
flutter build apk --release

echo "Copying Android APK to Desktop..."
cp "$PROJECT_DIR/build/app/outputs/flutter-apk/app-release.apk" "$DESKTOP_DIR/app-release.apk"

echo "Done! APK and copied to Desktop."