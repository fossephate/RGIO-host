# Xvfb :1 -screen 0 1920x1080x16 &
# openbox-session &
# # https://stackoverflow.com/questions/56218242/headless-chromium-on-docker-fails
# chromium-browser --disable-dev-shm-usage &
node --experimental-modules ./src/libs/lagless/HostStream.mjs --user="fosse5" --password="QWERTY1234" \
--drawMouse="true" --usePulse="true" \
--audioDevice="default" --useLocalFfmpegInstall="true"