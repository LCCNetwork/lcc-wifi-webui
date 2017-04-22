'use strict'

const express = require('express')
const path = require('path')
const app = express()

app.set('views', path.join(process.cwd(), 'src'))
app.engine('html', require('ejs').renderFile)
app.set('view engine', 'html')
app.use(express.static(path.join(process.cwd(), 'src')))

app.server = app.listen(80, function () {
  const host = app.server.address().address
  const port = app.server.address().port
  console.info('Server listening at http://%s:%s', host, port)
})

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'app.html'))
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src', 'index.html'))
})

app.use((req, res) => {
  res.render('index')
})
