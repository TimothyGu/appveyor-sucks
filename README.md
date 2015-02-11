# AppVeyor Watch

Ever frustrated on how slow AppVeyor start-up is? I am too!

This app watches for a specific build, and automatically notifies you with
a desktop notification when a job started, failed, or if the build is
cancelled by the user.

No more constant browser refreshing! No more wasted time!

This is written with Node.js using Mikael Brevik's [node-notifier][1]. Enjoy!

[1]: https://github.com/mikaelbr/node-notifier

## Installation

```sh
$ npm install -g appveyor-watch
```

## How to Use

```sh
$ appveyor-watch [-b <branch>|-B <build-version>] <repo>
```

The process will enter an infinite loop, exiting only because:

1. you pressed Ctrl+C, or
2. the build terminated.

## Examples

```
$ appveyor-watch gruntjs/grunt
$ appveyor-watch -b master gruntjs/grunt
$ appveyor-watch -B 33 gruntjs/grunt
```
