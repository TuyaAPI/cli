tuyapi/cli [![Build Status](https://travis-ci.org/TuyaAPI/cli.svg?branch=master)](https://travis-ci.org/TuyaAPI/cli) [![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/xojs/xo)
===========================

A CLI for Tuya devices.

## Installation
`npm i @tuyapi/cli -g`

## Usage

```shell
> tuyapi-cli --help

  Usage: tuya-cli [options] [command]

  Options:

    -h, --help             output usage information

  Commands:

    link [options]         link a new device
    link-wizard [options]  interactively link a new device (recommended for new users)
    get [options]          get a property on a device
    set [options]          set a property on a device
    list                   list all saved devices and API keys
    help                   output usage information

```

## Development
1. After cloning, run `npm i`.
2. To run tests, run `npm test`.
