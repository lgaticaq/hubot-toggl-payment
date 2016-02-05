# hubot-toggl-payment

[![npm version](https://img.shields.io/npm/v/hubot-toggl-payment.svg?style=flat-square)](https://www.npmjs.com/package/hubot-toggl-payment)
[![npm downloads](https://img.shields.io/npm/dm/hubot-toggl-payment.svg?style=flat-square)](https://www.npmjs.com/package/hubot-toggl-payment)
[![dependency Status](https://img.shields.io/david/lgaticaq/hubot-toggl-payment.svg?style=flat-square)](https://david-dm.org/lgaticaq/hubot-toggl-payment#info=dependencies)
[![Join the chat at https://gitter.im/lgaticaq/hubot-toggl-payment](https://img.shields.io/badge/gitter-join%20chat%20%E2%86%92-brightgreen.svg?style=flat-square)](https://gitter.im/lgaticaq/hubot-toggl-payment?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

A Hubot script to close time entries for new payment

## Installation
```bash
npm i -S hubot-toggl-payment
```

add `["hubot-toggl-payment"]` to `external-scripts.json`.

## Examples
`hubot toggl login <token>` -> `Login success as <fullname>`

`hubot toggl payment <amount> <price>` -> `Processing time entries... Ready. Diference is a few seconds`
