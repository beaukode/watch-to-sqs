FROM node:10-alpine

COPY dist/*.js /app/
COPY dist/LICENSE /app/

WORKDIR /app

CMD ["/usr/local/bin/node", "index.js"]