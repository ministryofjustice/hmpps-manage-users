function jwtDecode(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch (e) {
    return null
  }
}

function renderSessionList(allSessions) {
  var list = document.getElementById('sessionList')
  list.innerHTML = ''
  var entries = Array.isArray(allSessions)
    ? allSessions.map(function (s) {
        return { id: s.id, session: s }
      })
    : Object.keys(allSessions).map(function (id) {
        return { id: id, session: allSessions[id] }
      })

  entries.forEach(function (entry) {
    var session = entry.session
    var sessionId = entry.id
    var username = (session.userDetails && session.userDetails.username) || 'unknown'
    var li = document.createElement('li')
    var a = document.createElement('a')
    a.href = '#'
    a.className = 'govuk-link'
    a.textContent = username + ' / ' + sessionId
    a.addEventListener('click', function (e) {
      e.preventDefault()
      var token = session.passport && session.passport.user && session.passport.user.access_token
      var decoded = token ? jwtDecode(token) : null
      var panel = document.getElementById('sessionTokenDecoded')
      var pre = document.getElementById('sessionTokenPre')
      pre.textContent = JSON.stringify(decoded || { error: 'No access_token in session' }, null, 2)
      pre.className = 'debug-session-pre language-json'
      pre.removeAttribute('data-highlighted')
      hljs.highlightElement(pre)
      panel.classList.remove('debug-session-token-decoded')
    })
    li.appendChild(a)
    list.appendChild(li)
  })
}

function render(id, data) {
  var el = document.getElementById(id)
  el.textContent = JSON.stringify(data, null, 2)
  el.className = 'debug-session-pre language-json'
  hljs.highlightElement(el)
}

function initCopyButtons() {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.debug-session-copy')
    if (!btn) return
    var target = document.getElementById(btn.getAttribute('data-target'))
    if (!target) return
    navigator.clipboard.writeText(target.textContent).then(function () {
      var original = btn.textContent
      btn.textContent = 'Copied!'
      setTimeout(function () {
        btn.textContent = original
      }, 2000)
    })
  })
}

fetch('/debug/session')
  .then(function (res) {
    return res.json()
  })
  .then(function (data) {
    var username = data.currentSession && data.currentSession.userDetails && data.currentSession.userDetails.username
    if (username) {
      document.getElementById('pageTitle').textContent = 'Session Data: ' + username
    }
    render('decodedToken', data.decodedToken)
    render('sessionCookie', data.sessionCookie)
    render('currentSession', data.currentSession)
    render('locals', data.locals)
    render('allSessions', data.allSessions)
    renderSessionList(data.allSessions)
    document.getElementById('sessionStoreType').textContent =
      'Session store: ' + (data.usingRedis ? 'Redis' : 'In-memory')
    initCopyButtons()
  })
  .catch(function (err) {
    document.querySelectorAll('.debug-session-pre').forEach(function (el) {
      el.textContent = 'Error: ' + err.message
    })
  })
