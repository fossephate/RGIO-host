Xvfb :1 -screen 0 1920x1080x16 &
openbox-session &
chromium-browser &
node --experimental-modules ./src/libs/lagless/HostStream.mjs --user="fosse5" --password="QWERTY1234" --drawMouse="true" --usePulse="true" --audioDevice="default"