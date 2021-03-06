# hubot-toggl-payment

[![npm version](https://img.shields.io/npm/v/hubot-toggl-payment.svg)](https://www.npmjs.com/package/hubot-toggl-payment)
[![npm downloads](https://img.shields.io/npm/dm/hubot-toggl-payment.svg)](https://www.npmjs.com/package/hubot-toggl-payment)
[![Build Status](https://img.shields.io/travis/lgaticaq/hubot-toggl-payment.svg)](https://travis-ci.org/lgaticaq/hubot-toggl-payment)
[![Coverage Status](https://img.shields.io/coveralls/lgaticaq/hubot-toggl-payment/master.svg)](https://coveralls.io/github/lgaticaq/hubot-toggl-payment?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/1edd0dbcb5e3fd48aeb2/maintainability)](https://codeclimate.com/github/lgaticaq/hubot-toggl-payment/maintainability)
[![dependency Status](https://img.shields.io/david/lgaticaq/hubot-toggl-payment.svg)](https://david-dm.org/lgaticaq/hubot-toggl-payment#info=dependencies)
[![devDependency Status](https://img.shields.io/david/dev/lgaticaq/hubot-toggl-payment.svg)](https://david-dm.org/lgaticaq/hubot-toggl-payment#info=devDependencies)

> A Hubot script to close time entries for new payment

## Installation
```bash
npm i -S hubot-toggl-payment
```

Set environment variable *TOGGL_CHANNEL* to channel notifications.

add `["hubot-toggl-payment"]` to `external-scripts.json`.

## Examples

The *password* is required to store token encrypted. Run this commands in a private message.

`hubot toggl login <token> <password>` -> `Login success as <fullname>`

`hubot toggl payment <amount> <price> <password>` -> `Processing time entries... Ready. Diference is a few seconds`

## License

[MIT](https://tldrlegal.com/license/mit-license)
