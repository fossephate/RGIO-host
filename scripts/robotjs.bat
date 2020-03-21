rem npm rebuild --runtime=electron --target=6.0.12 --disturl=https://atom.io/download/atom-shell --abi=73

let nodeAbi = require("node-abi");
nodeAbi.getTarget("75", "electron"); -> 7.0.0
nodeAbi.getTarget("78", "electron"); -> 8.0.0
->
npm rebuild --runtime=electron --target=7.0.0 --disturl=https://atom.io/download/atom-shell --abi=75

npm rebuild --runtime=electron --target=8.0.0 --disturl=https://atom.io/download/atom-shell --abi=76


prebuild -r electron -t 6.0.12
prebuild -r electron -t 6.1.1
prebuild -r electron -t 7.0.0
prebuild -r electron -t 8.0.2
C:\Users\fosse\AppData\Roaming\npm-cache\_prebuilds