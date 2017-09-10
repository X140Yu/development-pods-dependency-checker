
document.addEventListener("DOMContentLoaded", function(){
  
  const ipc = require('electron').ipcRenderer
  
  const selectDirBtn = document.getElementById('select-directory')
  
  selectDirBtn.addEventListener('click', function (event) {
    ipc.send('open-file-dialog')
  })
  
  ipc.on('selected-directory', function (event, files) {
    let isPodDir = checkHasPodfile(files)
    if (isPodDir) {
      document.getElementById('selected-file').innerHTML = `It's a valid path`
      findPodspecs(files[0])
    } else {
      ipc.send('open-error-dialog', "Error", "It seems that this directory doesn't have a Podfile")
    }
  })
  
  function checkHasPodfile(directory) {
    if (directory == undefined) {
      return false
    }
    let dirName = directory[0]
    let podfilePath = dirName + '/Podfile'
    let fs = require('fs')
    return fs.existsSync(podfilePath)
  }
  
  function findDependencies(pods, target) {
    let res = pods.filter(ele => {
      return ele.name === target
    })
    
    if (res[0] == undefined) {
      return []
    }
    
    return res[0].dependencies
  }
  
  function trigger(pods) {
    let podsRet = []
    pods.forEach(ele => {
      podsRet.push(recursiveFindDependencies(ele, pods))
    })
    return podsRet  
  }
  
  function recursiveFindDependencies(ele, pods) {
    let pod = {}
    if (ele.name == undefined) {
      return
    }
    pod.name = ele.name
    pod.dependencies = []
    ele.dependencies.forEach(dep => {
      if (pod.dependencies.filter(es => es == dep).length == 0) {
        pod.dependencies.push(dep)
      }
      let deps = findDependencies(pods, dep).forEach(e => {
        Array.prototype.push.apply(pod.dependencies, recursiveFindDependencies(e, pods))
        
        if (pod.dependencies.filter(es => es == e).length == 0) {
          pod.dependencies.push(e)
        }
      })
    })
    return pod
  }
  
  function findPodspecs(directory) {
    let podspecs = findFiles(directory, /\.podspec.json$/, null)
    let pods = parsePodspecs(podspecs)
    // recursive find dependencies
    pods = trigger(pods)
    console.log(pods)
    let d = document.getElementById('pods')
    pods.forEach(function(element) {
      let div = document.createElement('div')
      let header = document.createElement('h3')
      header.innerHTML = element["name"]
      div.appendChild(header)
      
      let ul = document.createElement('ul')
      let dependencies = element["dependencies"].sort()
      dependencies.forEach(function (dependency) {
        let li = document.createElement('li')
        li.innerHTML = dependency
        ul.appendChild(li)
      })
      
      div.appendChild(ul)
      
      d.appendChild(div)
    })
  }
  
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
  
});
