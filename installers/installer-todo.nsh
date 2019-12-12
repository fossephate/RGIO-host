!macro customInstall
  ExecWait '"$INSTDIR\installers\vigem-setup.exe" /sw'
!macroend


!macro customHeader
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customHeader"
!macroend

!macro preInit
  ; This macro is inserted at the beginning of the NSIS .OnInit callback
  !system "echo '' > ${BUILD_RESOURCES_DIR}/preInit"
!macroend

!macro customInit
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customInit"
!macroend

!macro customInstall
  !system "echo '' > ${BUILD_RESOURCES_DIR}/customInstall"
!macroend

!macro customInstallMode
  # set $isForceMachineInstall or $isForceCurrentInstall 
  # to enforce one or the other modes.
!macroend



https://stackoverflow.com/questions/51185663/add-custom-page-field-to-nsis-setup-created-with-electron-builder?rq=1
https://stackoverflow.com/questions/54363814/create-custom-page-after-the-install-is-complete

!include nsDialogs.nsh

XPStyle on

Var Dialog

Page custom myCustomPage

Function myCustomPage

    nsDialogs::Create 1018
    Pop $Dialog

    ${If} $Dialog == error
        Abort
    ${EndIf}

    nsDialogs::Show

FunctionEnd

Section
SectionEnd

