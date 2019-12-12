
rem development
"node_modules/.bin/electron-builder" --config electron-builder.json --publish always

rem "node_modules/.bin/electron-builder" --project . --config electron-builder.json --windows
rem "node_modules/.bin/electron-builder" --project . --config electron-builder.json --dir --windows

pause
rem production
rem "node_modules/.bin/electron-builder" --project . --config electron-builder.json --windows --linux --ia32 --x64

rem "arch": ["x64", "ia32"]
rem nsis
rem "installerIcon": "./build/installerIcon.ico",
rem "uninstallerIcon": "./build/uninstallerIcon.ico",
rem "publish": {
rem 	"provider": "generic",
rem 	"url": "https://remote-games-host.s3.amazonaws.com",
rem 	"channel": "latest"
rem },
