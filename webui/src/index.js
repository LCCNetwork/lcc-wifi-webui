const $ = require('jquery')
const fb = require('firebase')
const gAuthProvider = new fb.auth.GoogleAuthProvider()

let page = sessionStorage.getItem('page')
if (typeof location.origin === 'undefined') location.origin = location.protocol + '//' + location.host

const fbConfig = {
  apiKey: require('../apikey').apikey,
  authDomain: 'lcc-wifi.firebaseapp.com',
  databaseURL: 'https://lcc-wifi.firebaseio.com',
  projectId: 'lcc-wifi',
  storageBucket: 'lcc-wifi.appspot.com',
  messagingSenderId: '1038104580431'
}

fb.initializeApp(fbConfig)

function setLocalVar (name, value) {
  if (typeof value === 'object') localStorage.setItem(name, String(JSON.stringify(value)))
  else localStorage.setItem(name, value)
}

function getLocalVar (name) {
  try { return JSON.parse(localStorage.getItem(name)) }
  catch (err) { if (err) return localStorage.getItem(name) }
}

function timeout (time) {
  return new Promise((resolve, reject) => {
    setTimeout(reject, time, 'request timed out')
  })
}

function signOut () {
  fb.auth().signOut()
  resetUser()
  console.log('User successfully signed out')
  window.location.href = `${location.origin}`
}

function resetUser() {
  fb.auth().signOut()
  setLocalVar('user', undefined)
  setLocalVar('token', undefined)
  setLocalVar('usage', undefined)
}

function loadData () {
  let token = getLocalVar('token')

  Promise.race([timeout(5000),
    fetch(`http://localhost:8080/auth`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token
        })
      }
    )
  ]).then((res) => res.json()).then((resJson) => {
    if (!resJson.auth) { return window.alert('You are not authorized to use our WiFi service. If you believe that this may be a mistake, please contact an admin.') }

    fetch(`http://localhost:8080/user/${getLocalVar('user').uid}`, {method: 'GET', headers: { 'Accept': 'application/json' }})
    .then(res => res.json()).then(resJson => {
      setLocalVar('usage', resJson)
      window.location.href = `${location.origin}/app`
    })
  }).catch((err) => {
    resetUser()

    console.error(err)
    console.error('Connection to local LCC WiFi server timed out')
    alert('Please make sure that you are connected to the LCC WiFi network.')
  })

}

function openOauthWin () {
  fb.auth().signInWithPopup(gAuthProvider).then(data => {
    fb.auth().signInWithCredential(data.credential).then((user) => {
      user.getToken(true).then((token) => {
        setLocalVar('user', user)
        setLocalVar('token', token)

        loadData()
      }).catch((err) => {
        resetUser()

        console.error(err)
        alert(err.message)
      })
    }).catch((err) => { console.error(err) })
  }).catch(() => {})
}

function loadApp () {
  $('.app-signout-button').bind('click', signOut)
  $('.app-refresh-button').bind('click', loadData)
  $('.app-user-name').text(getLocalVar('user').displayName || getLocalVar('user').email || 'User')
  $('.app-data-label.top').text(`${getLocalVar('usage').used / 1000} GB /`)
  $('.app-data-label.bottom').text(`${getLocalVar('usage').total / 1000} GB`)

  let dataDisplay = new ProgressBar.Circle('.app-data-display', {
    strokeWidth: 8,
    easing: 'easeInOut',
    duration: 1800,
    color: '#72CADA',
    trailColor: '#FFF',
    trailWidth: 8
  })

  dataDisplay.animate(getLocalVar('usage').used / getLocalVar('usage').total)
}

function loadIndex () {
  $('.main-signin-button').bind('click', openOauthWin)

  let loader = $('.wrapper-loader')
  loader.fadeOut({duration: 500})
}

window.onload = () => {
  if (page === 'index') {
    setTimeout(() => {
      imagesLoaded('body', loadIndex)
    }, 1200)
  } else if (page === 'app') {
    loadApp()
  }
}
