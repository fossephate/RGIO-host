# http://trac.ffmpeg.org/wiki/Capture/V4L2_ALSA
node --experimental-modules ./src/libs/lagless/HostStream.mjs --user="fosse5" --password="QWERTY1234" \
--drawMouse="true" --useLocalFfmpegInstall="true" \
--capture="device" --usePulse="false" \
--videoDevice="/dev/video0" --audioDevice="CARD=capture,DEV=0" \
--playerCount="4" --switchControllerCount="4" \
--customScriptLocation="./config/nintendo-switch.js" \
--serialPortLocation="/dev/ttyUSB" --serialPortNumbers="[0123]"