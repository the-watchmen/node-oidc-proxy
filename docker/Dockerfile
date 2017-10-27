from node:alpine
add build /app
env NODE_CONFIG_DIR /app/config
run rm /app/config/local.js || /bin/true
entrypoint ["env", "DEBUG=app:*", "node"]
cmd ["/app/dist"]
