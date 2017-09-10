
const dialog = require('electron').dialog
const ipc = require('electron').ipcMain

ipc.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, function (files) {
    event.sender.send('selected-directory', files)
  })
})

ipc.on('open-error-dialog', function (event, title, subTitle) {
  dialog.showErrorBox(title, subTitle)
})
