const idpPort = 3002
const idpUrl = `http://localhost:${idpPort}`

module.exports = {
  listener: {
    port: 3000
  },
  session: {
    secret: 's3cret'
  },
  oauth: {
    issuer: {
      port: idpPort,
      url: idpUrl
    },
    client: {
      id: 'client-2',
      secret: 's3cret',
      redirectUri: 'http://localhost:3000/auth/cb',
      userAgentRedirectUri: 'http://localhost:8080/#/authenticated',
      timeout: 3000
    },
    clockTolerance: 5
  },
  idp: {features: {sessionManagement: true}},
  api: {
    // assumes all api's at single location,
    // would need to be revisited if this wasn't the case...
    url: 'http://localhost:3001'
  },
  mock: {
    sleep: 1000,
    port: 3001,
    url: 'http://localhost:3001',
    db: 'mock-server/db.json'
  }
}
