Helper = require("hubot-test-helper")
expect = require("chai").expect
proxyquire = require("proxyquire")
simpleEncryptor = require("simple-encryptor")
nock = require("nock")

apiToken = "DK89YJJRktQ2X0B3i1o7N96Z75pWL2MR"
password = "19QBn1kzsKyuC9IKHz9byjCL8222wuop"
encryptor = simpleEncryptor password
apiTokenEnc = encryptor.encrypt apiToken
# process.env.TOGGL_CHANNEL = "user"

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
          description: "Testing 1"
        },
        {
          id: 2,
          duration: 100,
          description: "Testing 2"
        },
        {
          id: 3,
          tags: "Pagado",
          duration: 100,
          description: "Testing 3"
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
    nock.disableNetConnect()

  afterEach ->
    room.destroy()
    nock.cleanAll()

  context "login", ->
    beforeEach (done) ->
      room.user.say("user", "hubot toggl login #{apiToken} #{password}")
      setTimeout(done, 100)

    it "should get a success message", ->
      expect(room.messages).to.eql([
        ["user", "hubot toggl login #{apiToken} #{password}"]
        ["hubot", "Login success as Testing User"]
      ])

  context "process time entries", ->
    beforeEach (done) ->
      nock("http://indicadoresdeldia.cl")
      .get("/webservice/indicadores.json")
      .reply 200, {indicador: {uf: "$26.029,52"}}
      room.robot.brain.data.users.user =
        toggl: {api_token: apiTokenEnc}
        room: "user"
        name: "user"
      room.user.say("user", "hubot toggl payment 500000 0.3 #{password}")
      setTimeout(done, 100)

    it "should get a success message", ->
      message = """Time entries to payment:
        Testing 1 00:01:40
        Testing 2 00:01:40
        Finish. Total time is: 00:03:20"""
      expect(room.messages).to.eql([
        ["user", "hubot toggl payment 500000 0.3 #{password}"]
        ["hubot", "Processing time entries..."]
        ["hubot", "user close tasks successfull\n#{message}"]
        ["hubot", message]
      ])
