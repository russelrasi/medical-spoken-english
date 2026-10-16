#!/bin/bash
# One-off: add 0.3s of silence to the start of every lesson audio clip, so the first syllable is not
# clipped while the device wakes up. Re-run only after generating new audio (new files only: see .padded).
cd "$(dirname "$0")/public/audio" || exit 1
touch ../../.audio-padded-list
for d in */; do
  d=${d%/}
  find "$d" -name '*.mp3' | while read -r f; do grep -qxF "$f" ../../.audio-padded-list || echo "$f"; done
done > /tmp/to-pad.txt
cat /tmp/to-pad.txt | xargs -P 8 -I{} sh -c 'ffmpeg -y -loglevel error -i "{}" -af adelay=300:all=1 -b:a 48k "{}.tmp.mp3" && mv "{}.tmp.mp3" "{}"'
cat /tmp/to-pad.txt >> ../../.audio-padded-list
echo "padded $(wc -l < /tmp/to-pad.txt) files"
