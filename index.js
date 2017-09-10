
document.addEventListener("DOMContentLoaded", function(){
  const ipc = require('electron').ipcRenderer
  
  const selectDirBtn = document.getElementById('select-directory')
  
  selectDirBtn.addEventListener('click', function (event) {
    ipc.send('open-file-dialog')
  })
  
  ipc.on('selected-directory', function (event, files) {
    handleSelectDirectory(files)
  })
  
  function clearElement(name) {
    var myNode = document.getElementById(name);
    if (myNode == null) {
      return
    }
    var fc = myNode.firstChild;
    
    while( fc ) {
      myNode.removeChild( fc );
      fc = myNode.firstChild;
    }
  } 
  
  function handleSelectDirectory(files) {
    clearElement('nav')
    clearElement('pods')
    let isPodDir = checkHasPodfile(files)
    if (isPodDir) {
      findPodspecs(files[0])
    } else {
      showError("Error", "It seems that this directory doesn't have a Podfile")
    }
  }
  
  function showError(title, subTitle) {
    ipc.send('open-error-dialog', title, subTitle)    
  }
  
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
    if (podspecs.length === 0) {
      showError("Error", "Maybe you should build the project first")
      return
    }
    let pods = parsePodspecs(podspecs)
    // recursive find dependencies
    pods = trigger(pods)
    console.log(pods)
    pods = pods.sort((a, b) => {
      if (a.name < b.name) return -1;
      if (a.name > b.name) return 1;
      return 0;
    })
    
    let navs = []
    let d = document.getElementById('pods')
    pods.forEach(function(element) {
      let div = document.createElement('div')
      if (navs.indexOf(element.name) === -1 && element.dependencies.length > 0) {
        navs.push(element.name)
      } else {
        return
      }
      let header = document.createElement('h3')
      header.innerHTML = element.name
      header.id = element.name
      
      div.appendChild(header)
      
      let ul = document.createElement('ul')
      let dependencies = element.dependencies.sort()
      dependencies.forEach(function (dependency) {
        let li = document.createElement('li')
        let a = document.createElement('a')
        a.innerHTML = dependency
        a.href = '#' + dependency
        ul.appendChild(li)
        li.appendChild(a)
      })
      
      div.appendChild(ul)      
      d.appendChild(div)
    })
    
    renderNavs(navs)
  }
  
  function renderNavs(navs) {
    let fRight = document.getElementById('nav')
    navs.forEach(e => {
      let headerA = document.createElement('a')
      headerA.href = '#' + e
      headerA.innerText = e
      fRight.appendChild(headerA)
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
