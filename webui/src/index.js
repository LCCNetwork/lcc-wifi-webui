const $ = require('jquery')
const fb = require('firebase')
const gAuthProvider = new fb.auth.GoogleAuthProvider()
const imagesLoaded = require('imagesloaded')
const ProgressBar = require('progressbar.js')

// function bakeCookie(name, value) {
//   var cookie = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('')
//   document.cookie = cookie
// }
//
// function readCookie(name) {
//   var result = document.cookie.match(new RegExp(name + '=([^;]+)'))
//   result && (result = JSON.parse(result[1]))
//   return result
// }
//
// let state = readCookie('state')
// console.log(state)
// if (state === null) bakeCookie('state', {'testing': 'testing'})
// console.log(document.cookie)

let page = sessionStorage.getItem('page')

const fbConfig = {
  apiKey: require('../apikey').apikey,
  authDomain: 'lcc-wifi.firebaseapp.com',
  databaseURL: 'https://lcc-wifi.firebaseio.com',
  projectId: 'lcc-wifi',
  storageBucket: 'lcc-wifi.appspot.com',
  messagingSenderId: '1038104580431'
}

fb.initializeApp(fbConfig)

function setState (name, value) {
  let state = sessionStorage.getItem('state')
  if (!state) state = {user: undefined, usage: undefined}

  state[name] = value
  sessionStorage.setItem('state', state)
}

function getState (name) {
  return sessionStorage.getItem('state')[name]
}

function timeout (time) {
  return new Promise((resolve, reject) => {
    setTimeout(reject, time, 'request timed out')
  })
}

function signOut () {
  fb.auth().signOut()
  console.log('User successfully signed out')
  window.location.href = `file://${__dirname}/index.html`
}

function loadData (user) {
  user.getToken(true).then((token) => {
    console.log(token)
    Promise.race([timeout(1000),
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

      fetch(`http://localhost:8080/user/${user.uid}`, {method: 'GET', headers: { 'Accept': 'application/json' }})
      .then(res => res.json()).then(resJson => {
        setState('usage', resJson)
        setState('user', user)
        window.location.href = `file://${__dirname}/app.html`
      })
    }).catch((err) => {
      fb.auth().signOut()
      setState('user', undefined)

      console.log(err)
      console.error('Connection to local LCC WiFi server timed out')
      alert('Please make sure that you are connected to the LCC WiFi network.')
    })
  }).catch((err) => {
    fb.auth().signOut()
    setState('user', undefined)

    console.log(err)
    alert(err.message)
  })
}

function openOauthWin () {
  fb.auth().signInWithPopup(gAuthProvider).then(data => {
    fb.auth().signInWithCredential(data.credential).then((user) => {
      console.log(user)
      loadData(user)
    }).catch((err) => { console.log(err) })
  }).catch((err) => { console.error(err) })
}

function loadApp () {
  $('.app-signout-button').bind('click', signOut)
  $('.app-refresh-button').bind('click', loadData)
  $('.app-user-name').text(getState('user').displayName || getState('user').user.email || 'User')
  $('.app-data-label.top').text(`${getState('usage').used / 1000} GB /`)
  $('.app-data-label.bottom').text(`${getState('usage').total / 1000} GB`)

  let dataDisplay = new ProgressBar.Circle('.app-data-display', {
    strokeWidth: 8,
    easing: 'easeInOut',
    duration: 1800,
    color: '#72CADA',
    trailColor: '#FFF',
    trailWidth: 8
  })

  dataDisplay.animate(getState('usage').used / getState('usage').total)
}

function loadIndex () {
  $('.main-signin-button').bind('click', openOauthWin)

  let loader = $('.wrapper-loader')
  loader.fadeOut({duration: 500})
}

window.onload = () => {
  console.log(page)
  if (page === 'index') {
    setTimeout(() => {
      imagesLoaded('body', loadIndex())
    }, 1200)
  } else if (page === 'app') {
    loadApp()
  }
}
