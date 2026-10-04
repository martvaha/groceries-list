#!/usr/bin/env bash
# Generates the test-environment app icons from the production ones: the icon is
# recoloured from light blue to orange and gets a "TEST" banner along the bottom.
# Output goes to packages/frontend/src/test-overrides/assets, which the `test`
# build configuration publishes in place of the production icons.
#
# Requires ImageMagick (`convert`). Re-run after changing the production icons.
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
src="$root/packages/frontend/src/assets"
out="$root/packages/frontend/src/test-overrides/assets"
mkdir -p "$out"

# -modulate hue 9 rotates #03a9f4 (light blue) to roughly #ff9800 (orange).
hue='100,110,9'
banner='#3e2723'
font='DejaVu-Sans-Bold'

# The icon is a rounded square spanning x 54..457, y 54..456 with a ~16px
# corner radius; the banner fills its bottom below the cart wheels.
master="$(mktemp --suffix=.png)"
trap 'rm -f "$master"' EXIT
convert "$src/icon-512x512.png" -modulate "$hue" \
  \( -size 512x512 xc:none -fill "$banner" \
     -draw 'roundrectangle 54,396 457,456 16,16' \
     -draw 'rectangle 54,396 457,420' \
     -fill white -font "$font" -pointsize 46 -gravity north -annotate +0+399 'TEST' \) \
  -composite "$master"

for size in 48 72 96 128 144 192 432 512; do
  convert "$master" -filter Lanczos -resize "${size}x${size}" -strip "$out/icon-${size}x${size}.png"
done

# The favicon is too small for a readable label, so it only changes colour.
sed 's/#07aaf4/#ff9800/' "$src/favicon.svg" > "$out/favicon.svg"
