# Description
#   A Hubot script to close time entries for new payment
#
# Dependencies:
#   "bluebird": "^3.2.1",
#   "moment": "^2.11.2",
#   "request-promise": "^2.0.0",
#   "toggl-api": "0.0.4"
#
# Commands:
#   hubot toggl login <token> - Login to Toggl
#   hubot toggl payment <amount> <price> - Close time entries for the amount and price
#
# Author:
#   lgaticaq

moment = require "moment"
rp = require "request-promise"
TogglClient = require "toggl-api"
Promise = require "bluebird"

getClient = (token) ->
  toggl = new TogglClient apiToken: token
  Promise.promisifyAll Object.getPrototypeOf toggl
  toggl

getUf = () ->
  options =
    url: "http://indicadoresdeldia.cl/webservice/indicadores.json"
    json: true
    transform: (body) ->
      parseFloat body.indicador.uf.replace("$", "").replace(".", "").replace(",", ".")
  rp options

process = (timeEntries, amount, price) ->
  new Promise (resolve, reject) ->
    getUf().then (uf) ->
      limit = (amount / (uf * price)) * 3600
      teIds = []
      duration = 0
      for i in timeEntries
        if ((duration + i.duration) < limit) and i.tags?
          duration += i.duration
          teIds.push i.id
      difference = if limit > duration then ". Diference is #{moment.duration(limit - duration, 'seconds').humanize()}" else ""
      resolve {difference: difference, teIds: teIds}
    .catch reject

module.exports = (robot) ->
  robot.respond /toggl login (\w{32})/, (res) ->
    token = res.match[1]
    toggl = getClient token
    toggl.getUserDataAsync({}).then (userData) ->
      unless robot.brain.data.users[res.message.user.id]?
        robot.brain.data.users[res.message.user.id] = {name: res.message.user.name}
        robot.brain.save()
      user = robot.brain.userForName res.message.user.name
      user.toggl = userData
      robot.brain.save()
      res.send "Login success as #{userData.fullname}"
    .catch (err) ->
      res.reply "an error occurred in toggl"
      robot.emit "error", err

  robot.respond /toggl payment (\d+) (\d*(\.\d+))/, (res) ->
    res.send "Processing time entries..."
    amount = res.match[2]
    price = res.match[3]
    tags = ["Pagado"]
    action = "add"
    end = moment()
    start = end.subtract 1, "years"
    user = robot.brain.userForName res.message.user.name
    message = ""
    toggl = getClient user.toggl.api_token
    toggl.getTimeEntriesAsync(start.toISOString(), end.toISOString()).then (timeEntries) ->
      process timeEntries, amount, price
    .then (data) ->
      message = "Ready#{data.difference}"
      toggl.updateTimeEntriesTagsAsync data.teIds, tags, action
    .then () ->
      res.send message
    .catch (err) ->
      res.reply "an error occurred in toggl"
      robot.emit "error", err
