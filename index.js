'use strict'

var https = require('https')
  , notifier = require('node-notifier')
  , prog = require('commander')
  , Table = require('easy-table')

var exit = new (require('events').EventEmitter)()
  , mainObj = {}
  , build
  , interesting = ['running', 'failed']
  , completed = [ 'failed', 'success' ]
  , table

prog
  .version(require('./package.json').version)
  .usage('[options] <repo>')
  .option('-b, --branch <branch>', 'branch to watch')
  .option('-B, --build <version>', 'build version to watch')
  .option('-w, --watch', 'force watching even when build already terminated')
  .parse(process.argv);

function noop () {}

// By default no op
exit.on('ok', noop)

function notify (title, message) {
  notifier.notify({
    title: title.replace(/(?:^|\s)\S/, function (letter) {
      return letter.toUpperCase()
    })
  , message: message })
}

function die (details, code) {
  if (prog.watch) {
    console.log(details + '\n')
    return
  }
  // Exit when all results have been printed for the last time
  exit.removeAllListeners('ok')
  exit.once('ok', function () {
    console.log(details + '\n')
    process.exit(code || 0)
  })
}

function main (repo, branch, version, url) {
  if (!url) {
    url = 'https://ci.appveyor.com/api/projects/' + repo
    if (branch)       url += '/branch/' + branch
    else if (version) url += '/build/'  + version
  }
  https.get(url, function (res) {
    var json = ''
    if (res.statusCode !== 200) {
      throw new Error(res.statusCode + ' ' + res.statusMessage)
    }
    res.setEncoding('utf8')
    res.on('error', function (e) {
      throw e
    }).on('data', function (buf) {
      json += buf
    }).on('end', function () {
      // don't use console.log here as it will add a new line
      process.stdout.write('\u001B[2J\u001B[0;0f')
      console.log('Updated:', Date())
      console.log()

      json = JSON.parse(json)

      if (!build) {
        build = {
          id: json.build.buildId
        , version: json.build.version
        }
      } else if (json.build.buildId !== build.id) {
        notify('Build changed', build.version + ' → ' + json.build.version)
        build = {
          id: json.build.buildId
        , version: json.build.version
        }
      }
      var jobs = json.build.jobs
      table = new Table()
      if (json.build.status === 'canceled') {
        die('Build canceled')
      } else if (completed.indexOf(json.build.status) !== -1) {
        die('Build completed: ' + json.build.status)
      }
      jobs.map(function (val) {
        table.cell('Job', val.name)
        table.cell('Status', val.status)
        table.newRow()
        if (!mainObj[val.jobId]) {
          mainObj[val.jobId] = val.status
        }
        if (mainObj[val.jobId] !== val.status) {
          notify(val.name, val.status)
          mainObj[val.jobId] = val.status
        }
      })

      console.log(table.toString())

      // All results printed; OK to exit.
      exit.emit('ok')
      // Continue the loop
      main(null, null, null, url)
    })
  })
}

// Start the loop
if (!prog.args[0]) {
  console.error();
  console.error('  error: no repo specified');
  console.error();
  process.exit(1)
}
main(prog.args[0], prog.branch, prog.build)
