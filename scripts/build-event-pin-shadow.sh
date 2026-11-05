#!/bin/sh
# Pre-render the silhouette once; map panning shouldn't run a shadow filter.
set -eu
render() {
ffmpeg -hide_banner -loglevel error -y -i apps/mobile/assets/illustrations/pin.png -filter_complex \
 "[0:v]format=rgba,split=2[src][mask];[mask]pad=492:485:40:56:color=black@0,colorchannelmixer=rr=0:gg=0:bb=0:aa=$2,gblur=sigma=$3:steps=3[shadow];[shadow][src]overlay=40:40:format=auto,format=rgba[out]" \
 -map "[out]" -frames:v 1 apps/mobile/assets/map-markers/"$1"
}
render event-shadow.png 0.85 14
render event-shadow-ios.png 0.48 20
