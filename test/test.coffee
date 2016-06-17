Helper = require("hubot-test-helper")
expect = require("chai").expect
proxyquire = require("proxyquire")

apiToken = "DK89YJJRktQ2X0B3i1o7N96Z75pWL2MR"
password = "19QBn1kzsKyuC9IKHz9byjCL8222wuop"

togglStub = () ->
  getUserDataAsync: () ->
    return new Promise (resolve) ->
      resolve({
        api_token: apiToken,
        fullname: "Testing User"
      })
  getTimeEntriesAsync: () ->
    return new Promise (resolve) ->
      resolve([
        {
          id: 1,
          duration: 100,
          description: "Testing"
        },
        {
          id: 2,
          duration: 100,
          description: "Testing"
        },
        {
          id: 3,
          tags: "Pagado",
          duration: 100,
          description: "Testing"
        },
      ])
  updateTimeEntriesTagsAsync: () ->
    return new Promise (resolve) ->
      resolve()
proxyquire("./../src/script.coffee", {"toggl-api": togglStub})

helper = new Helper("./../src/index.coffee")

describe "hubot-toggl-payment", ->
  room = null

  beforeEach ->
    room = helper.createRoom({name: "user"})

  afterEach ->
    room.destroy()

  context "get w3w from address", ->
    beforeEach (done) ->
      room.user.say("user", "hubot toggl login #{apiToken} #{password}")
      setTimeout(done, 100)

    it "should get a w3w", ->
      expect(room.messages).to.eql([
        ["user", "hubot toggl login #{apiToken} #{password}"]
        ["hubot", "Login success as Testing User"]
      ])
