# https://github.com/nvm-sh/nvm
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
# nvm install 12.16.1
# /headless/.nvm/versions/node/v12.16.1/bin/node
node --experimental-modules ./src/libs/lagless/HostStream.mjs --user="fosse5" --password="QWERTY1234"

# sudo docker run -i -p 5901:5901 --memory 1024m --rm --name test --security-opt seccomp=$(pwd)/chrome.json -t box /bin/bash
# sudo docker exec -it --user root test bash