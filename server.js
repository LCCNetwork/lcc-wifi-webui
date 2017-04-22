'use strict'

const express = require('express')
const path = require('path')
const app = express()

app.set('view engine', 'html')
app.engine('html', require('ejs').renderFile)

app.set('views', [path.join(process.cwd(), 'src', 'portal', 'src'), path.join(process.cwd(), 'src', 'webui', 'src')])
app.use(express.static(path.join(process.cwd(), 'src', 'public')))

app.server = app.listen(80, function () {
  const host = app.server.address().address
  const port = app.server.address().port
  console.info('Server listening at http://%s:%s', host, port)
})

app.get('/', (req, res) => {
  res.render(path.join(process.cwd(), 'src', 'portal', 'src', 'index.html'))
})

app.get('/webui', (req, res) => {
  res.render(path.join(process.cwd(), 'src', 'webui', 'src', 'index.html'))
})

app.get('/app', (req, res) => {
  res.render(path.join(process.cwd(), 'src', 'webui', 'src', 'app.html'))
})

app.use((req, res) => {
  res.render(path.join(process.cwd(), 'src', 'portal', 'src', 'index.html'))
})
