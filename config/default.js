module.exports = {
  database: {
    url: 'mysql://udx-user:s3cret@localhost/udx',
    version: {
      select: 'select version()',
      get: '[0][0].version()'
    },
    dialect: 'mysql'
  },
  listener: {
    port: 3000,
    secret:
      'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAiJVhAMEY4rllFv9KgWh2/eo2MIx80KlCnpiZZC+K97tPqTglNwgh9YIGro5j178EgBBA3LlRZrTrfV6MSSZT3gnPsypEn/Yx9pVPc1zsPDLFoUSgclg1VafXvh9JuhE1n7i3LunV0b6hwTInXB0nQPZLiCM9w494DShQ830necoGL3mWwcJV+WuTBQrq1cDYpuYxiFdONMAqywslgbEtob9OYeknvTqLvtd6iLNWut/b91bkQnXR6mKNAWt+avvLg3H2W5dpy/+HL2yjWfFdGEkdwglg2Li9IhuEYaWhH3ki8BTMkngUNb/gPnCvtkk1spwdexSbMPb5QJpsEbubkwIDAQAB',
    credentialsRequired: true,
    whitelist: ['/', '/healthz']
  },
  oauth: {
    issuer: {
      url: 'https://auth.lab.ds.aetna.com/auth/realms/realm-1/.well-known/openid-configuration'
    },
    client: {
      id: 'client-2',
      secret: '62597053-51ae-49e2-85b8-75ddf0961042',
      redirectUri: 'http://localhost:3000/auth/cb'
    }
    // provider: 'keycloak',
    // server: {
    //   protocol: 'http',
    //   host: 'localhost:3000',
    //   callback: '/callback',
    //   transport: 'session'
    // },
    // keycloak: {
    //   authorize_url:
    //     'https://auth.lab.ds.aetna.com/auth/realms/realm-1/protocol/openid-connect/auth',
    //   access_url: 'https://auth.lab.ds.aetna.com/auth/realms/realm-1/protocol/openid-connect/token',
    //   oauth: 2,
    //   key: 'client-2',
    //   secret: '62597053-51ae-49e2-85b8-75ddf0961042',
    //   scope: ['openid']
    // }
  },
  api: {
    // assumes all api's at single location,
    // would need to be revisited if this wasn't the case...
    url: 'http://localhost:3001'
  },
  mock: {
    sleep: 1000,
    port: 3001
  }
}
