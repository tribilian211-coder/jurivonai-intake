#!/bin/bash
# Package JurivonAI intake app as a deployable ZIP for GitHub upload + Vercel deploy.
# Excludes node_modules, build artifacts, local DB, logs, sandbox scripts.

set -e

PROJECT_DIR="/home/z/my-project"
OUTPUT_ZIP="/home/z/my-project/download/jurivonai-intake.zip"
STAGE_DIR="/home/z/my-project/.package-stage"

# Clean any previous stage
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR/jurivonai-intake"

cd "$PROJECT_DIR"

# Files/dirs to INCLUDE (everything else is excluded)
INCLUDE=(
  "src"
  "prisma"
  "public"
  "package.json"
  "bun.lock"
  "tsconfig.json"
  "next.config.ts"
  "postcss.config.mjs"
  "tailwind.config.ts"
  "components.json"
  "eslint.config.mjs"
  ".env.example"
  ".gitignore"
  "README.md"
  "START-HERE.txt"
)

# Copy each item, skipping any that don't exist
for item in "${INCLUDE[@]}"; do
  if [ -e "$PROJECT_DIR/$item" ]; then
    cp -r "$PROJECT_DIR/$item" "$STAGE_DIR/jurivonai-intake/"
    echo "✓ included: $item"
  else
    echo "  skipped (not found): $item"
  fi
done

# Remove any stray local DB files that might have been copied
rm -f "$STAGE_DIR/jurivonai-intake/db/"*.db 2>/dev/null || true
rm -f "$STAGE_DIR/jurivonai-intake/prisma/"*.db 2>/dev/null || true

# Create the ZIP (exclude the ZIP itself from public/, plus build artifacts)
cd "$STAGE_DIR"
rm -f "$OUTPUT_ZIP"
zip -r "$OUTPUT_ZIP" jurivonai-intake \
  -x "*/node_modules/*" \
  -x "*/.next/*" \
  -x "*/db/*.db" \
  -x "*.log" \
  -x "*/public/jurivonai-intake.zip" \
  -x "*/public/*.png" \
  2>&1 | tail -5

# Report
echo ""
echo "=========================================="
echo "ZIP created: $OUTPUT_ZIP"
echo "Size: $(du -h "$OUTPUT_ZIP" | cut -f1)"
echo "File count: $(find "$STAGE_DIR/jurivonai-intake" -type f | wc -l)"
echo "=========================================="
echo ""
echo "Contents:"
find "$STAGE_DIR/jurivonai-intake" -type f | sort | sed "s|$STAGE_DIR/jurivonai-intake/|  |"

# Clean up stage
rm -rf "$STAGE_DIR"
