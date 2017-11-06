# node-oidc-proxy

[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Build Status](https://travis-ci.org/the-watchmen/node-oidc-proxy.svg?branch=master)](https://travis-ci.org/the-watchmen/node-oidc-proxy)
[![npm (scoped)](https://img.shields.io/npm/v/@watchmen/oidc-proxy.svg)](https://img.shields.io/npm/v/@watchmen/oidc-proxy.svg)

a pattern using express for server side oauth support in terms of:

- an auth grant flow
- storing tokens in session
- a proxy for decorating api calls with a token obtained from session
