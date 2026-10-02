# Build / runtime image for the ERP frontend (Vite dev server)
#
# The Vite dev server proxies /api requests to the backend using the target
# set via VITE_SSO_BASE_URL (provided by docker-compose) and keeps the SSO
# cookie/token rewriting logic defined in vite.config.js.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
