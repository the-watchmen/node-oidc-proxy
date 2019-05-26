# node-oidc-proxy

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Build Status](https://travis-ci.org/the-watchmen/node-oidc-proxy.svg?branch=master)](https://travis-ci.org/the-watchmen/node-oidc-proxy)
[![npm (scoped)](https://img.shields.io/npm/v/@watchmen/oidc-proxy.svg)](https://img.shields.io/npm/v/@watchmen/oidc-proxy.svg)

a pattern using express for server side [openid-connect](https://openid.net/connect/) (oidc) support in terms of:

- an auth grant flow
- storing tokens in session
- a proxy for decorating api calls with a token obtained from session

## testing against oidc compliant idp

1. set up an appropriate config in the [`config` folder](config), for example:

    __keycloak.js__

    ```js
    module.exports = {
    	oauth: {
    		issuer: {
    			url: `https://keycloak.infra.hci.aetna.com/auth/realms/realm-1`
    		},
    		client: {
    			id: 'client-1',
    			secret: 's3cret'
    		}
    	}
    }
    ```

1. add the following to list of allowed redirects for client specified in config:

    - `http://localhost:3000/auth/cb`
    - `http://localhost:3000/logout/cb`

1. start server and redirect listener
    ```
    env DEBUG=dbg:*,app:*,lib:*,test:* NODE_ENV=keycloak npx babel-node test/shared/run-proxy-and-redirect
    ```

1. hit `localhost:3000/login`

1. if configuration is valid, this should forward you to the authentication page of the idp

1. enter valid credentials

1. if credentials are valid, you should see a response delivered to the browser from the redirect listener, something like:

    ```
    {
      "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJqR1k3YU1aYjVqMDlqWmJzTlpneDRra0dKd3BvaUFRNmdMUTVybmlVYzdZIn0.eyJqdGkiOiI2MGI5ZDc5Ny1jNDIzLTRmNjItYjQyYi1kYWVjYWVmY2NhNmYiLCJleHAiOjE1NTgzMDAzNzIsIm5iZiI6MCwiaWF0IjoxNTU4Mjk4NTcyLCJpc3MiOiJodHRwczovL2tleWNsb2FrLmxhYi5oY2kuYWV0bmEuY29tL2F1dGgvcmVhbG1zL21hc3RlciIsImF1ZCI6InBpbmVhcHBsZS1jbGllbnQiLCJzdWIiOiI0OWRmMDVjZi1kODFkLTRkODMtOTZlNS0zMzI2OWY2ZWM2NGUiLCJ0eXAiOiJJRCIsImF6cCI6InBpbmVhcHBsZS1jbGllbnQiLCJub25jZSI6InR5VXpvakhQVFhGMzNmemFIRU1SeUpmVDRpZGFnR2VLSFBsbVpDdjZLbXMiLCJhdXRoX3RpbWUiOjE1NTgyOTg1NzIsInNlc3Npb25fc3RhdGUiOiI3YjdiMDQ3ZC01YmQ5LTQyOTMtYThjYS1kNzllYzI5ZWE0OTgiLCJhY3IiOiIxIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJuYW1lIjoiTk9FTCBDVVRDSElOUyIsInByZWZlcnJlZF91c2VybmFtZSI6IjE3b3lhenBuanI5OXZiYm43enA4QGFldG5hZS5jb20iLCJwcm94eV9pZCI6IkY5NlYyMTExQlBYWSIsImdpdmVuX25hbWUiOiJOT0VMIiwiZmFtaWx5X25hbWUiOiJDVVRDSElOUyIsImhlYWx0aF9jbG91ZF9pZCI6ImU5M2ZhOWU5LWY5ZTYtNGYxYy05ZGU5LTY0OWE2MTA0ZjI3ZCJ9.DrBrZK8Z_QUsBKs-5VjeI1hE4-nTqgdSGlgRyv6KokpEzbOwGCiXZ-l8JT4EGJcirKKfMzic_FVES19aKCd-w0T1JMAhx60m0r_KQcopjUxvDCiBR1BDVm5ovCAKQqHa996O_lqpk-L4JmfkSaWNTjLlU_qjyA4gm42TtjFx1q5QxFd-y0OXLkrmrKZ5kixfCiQB_vi5OihF9Fj_7WJQBzSLhNspCxlIW8RPDvW-oiLGly4cKSi7YZBAojLkz3DfV9ah0KhcfzUwJit2BI9pk4ePzVkYCGXRfWEbLI-Uvsz-zSXAJtiKaPMLuE2tjgZxO_H8neaqwW3vq8SxnKKcKA",
      "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJqR1k3YU1aYjVqMDlqWmJzTlpneDRra0dKd3BvaUFRNmdMUTVybmlVYzdZIn0.eyJqdGkiOiJmOGY5YjgxYi1hZjgzLTQ5ZmMtOTFhMy0zYTA2NWZmMTBiZjEiLCJleHAiOjE1NTgzMDAzNzIsIm5iZiI6MCwiaWF0IjoxNTU4Mjk4NTcyLCJpc3MiOiJodHRwczovL2tleWNsb2FrLmxhYi5oY2kuYWV0bmEuY29tL2F1dGgvcmVhbG1zL21hc3RlciIsImF1ZCI6WyJicm9rZXIiLCJhY2NvdW50Il0sInN1YiI6IjQ5ZGYwNWNmLWQ4MWQtNGQ4My05NmU1LTMzMjY5ZjZlYzY0ZSIsInR5cCI6IkJlYXJlciIsImF6cCI6InBpbmVhcHBsZS1jbGllbnQiLCJub25jZSI6InR5VXpvakhQVFhGMzNmemFIRU1SeUpmVDRpZGFnR2VLSFBsbVpDdjZLbXMiLCJhdXRoX3RpbWUiOjE1NTgyOTg1NzIsInNlc3Npb25fc3RhdGUiOiI3YjdiMDQ3ZC01YmQ5LTQyOTMtYThjYS1kNzllYzI5ZWE0OTgiLCJhY3IiOiIxIiwiYWxsb3dlZC1vcmlnaW5zIjpbIi8qIl0sInJlYWxtX2FjY2VzcyI6eyJyb2xlcyI6WyJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiYnJva2VyIjp7InJvbGVzIjpbInJlYWQtdG9rZW4iXX0sImFjY291bnQiOnsicm9sZXMiOlsibWFuYWdlLWFjY291bnQiLCJtYW5hZ2UtYWNjb3VudC1saW5rcyIsInZpZXctcHJvZmlsZSJdfX0sInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsIm5hbWUiOiJOT0VMIENVVENISU5TIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiMTdveWF6cG5qcjk5dmJibjd6cDhAYWV0bmFlLmNvbSIsInByb3h5X2lkIjoiRjk2VjIxMTFCUFhZIiwiZ2l2ZW5fbmFtZSI6Ik5PRUwiLCJmYW1pbHlfbmFtZSI6IkNVVENISU5TIiwiaGVhbHRoX2Nsb3VkX2lkIjoiZTkzZmE5ZTktZjllNi00ZjFjLTlkZTktNjQ5YTYxMDRmMjdkIn0.BVjR8sr23spku399GFLzWmh3ohfsOSkgK113VSNiXsNpcGBeEy8oIN1zggm0a2zc1i1XNzoMQZfWKIBkHhsNCIs00-SBgAf2zgl-87rf5WCHGkOToAq0La148zud1amF6L6hAw72nCXcnSoMNn0-d61JfwbxE6k5ugTOYhc--xxDqrkW2fFpPONjJ_z85mw5-RmJyl7YxaD1vmbZ1vCVOG7iXQc9KbM7hq6gBcLpDG03-sHNFPucV1RkmuoKjfj__40udpIQ67p8KOTbzuz6h8PiCAspb138EaMAsAv1rgkN0v5ZROjng7fHe3dhWiJFXWKbthe5gCKFiOwnyDAptw",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI5NTYzMzU4NC0yMmEyLTQ5YTEtODA1Zi1mNmZiODJiODFmODUifQ.eyJqdGkiOiIwZjg4MDg3OC1hM2IwLTRlMWMtYjNiOS02MGRlOTY3NzhhNGMiLCJleHAiOjE1NTgzMDAzNzIsIm5iZiI6MCwiaWF0IjoxNTU4Mjk4NTcyLCJpc3MiOiJodHRwczovL2tleWNsb2FrLmxhYi5oY2kuYWV0bmEuY29tL2F1dGgvcmVhbG1zL21hc3RlciIsImF1ZCI6Imh0dHBzOi8va2V5Y2xvYWsubGFiLmhjaS5hZXRuYS5jb20vYXV0aC9yZWFsbXMvbWFzdGVyIiwic3ViIjoiNDlkZjA1Y2YtZDgxZC00ZDgzLTk2ZTUtMzMyNjlmNmVjNjRlIiwidHlwIjoiUmVmcmVzaCIsImF6cCI6InBpbmVhcHBsZS1jbGllbnQiLCJub25jZSI6InR5VXpvakhQVFhGMzNmemFIRU1SeUpmVDRpZGFnR2VLSFBsbVpDdjZLbXMiLCJhdXRoX3RpbWUiOjAsInNlc3Npb25fc3RhdGUiOiI3YjdiMDQ3ZC01YmQ5LTQyOTMtYThjYS1kNzllYzI5ZWE0OTgiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7ImJyb2tlciI6eyJyb2xlcyI6WyJyZWFkLXRva2VuIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBwcm9maWxlIGVtYWlsIn0.PamBr4K_-D9Y-befP2o2bUS4YguNDLFlXtfbmIFLDmU"
    }
    ```
1. to call a service decorated with a header like:

    ```
    Authentication: Bearer {the-access-token}
    ```

    use:

    ```
    http://localhost:3000/proxy/{the-route-of-the-target-service}
    ```

    for example:

    ```
    http://localhost:3000/proxy/express-js-scratch-dev
    ```

1. to logout from the session with the identity-provider, use:

    ```
    http://localhost:3000/logout
    ```
