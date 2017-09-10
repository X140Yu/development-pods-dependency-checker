
const dialog = require('electron').dialog
const ipc = require('electron').ipcMain

const fs = require('fs')
const path = require('path')

var findFiles = function(folder, pattern = /.*/, callback) {
  var flist = []
  fs.readdirSync(folder).map(function(e) {
    var fname = path.join(folder, e)
    var fstat = fs.lstatSync(fname)
    if (fstat.isDirectory()) {      
      Array.prototype.push.apply(flist, findFiles(fname, pattern, callback))
    } else {
      if (pattern.test(fname)) {
        flist.push(fname)
        if (callback) {
          callback(fname)
        }
      }
    }
  })
  return flist
}

function parsePodspecs(fileNames) {
  let pods = []
  for (let index in fileNames) {
    let pod = {}
    let content = fs.readFileSync(fileNames[index], 'utf-8')
    let json = JSON.parse(content)
    let name = json["name"]
    // console.log(name)
    pod.name = name
    let dependencies = json["dependencies"]
    pod.dependencies = []
    for (var i in dependencies) {
        var element = dependencies[i];
        // console.log(i)
        pod.dependencies.push(i)
    }
    pods.push(pod)
  }

  return pods
}

ipc.on('open-file-dialog', function (event) {
  dialog.showOpenDialog({
    properties: ['openDirectory']
  }, function (files) {
    event.sender.send('selected-directory', files)
  })
})

// ipc.on('find-podspecs', function (event, directory) {
//   let podspecs = findFiles(directory, /\.podspec.json$/, null)
//   let pods = parsePodspecs(podspecs)
//   event.sender.send('parse-podspec-finished', pods)
// })

ipc.on('open-error-dialog', function (event, title, subTitle) {
  dialog.showErrorBox(title, subTitle)
})
