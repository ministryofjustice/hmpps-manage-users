FROM node:14-buster as builder

ARG BUILD_NUMBER
ARG GIT_REF

RUN apt-get update && \
    apt-get upgrade -y

WORKDIR /app

COPY package.json .
COPY package-lock.json .
ADD ./src/ src/
ADD ./scripts/ scripts/
ADD ./static/ static/
ADD ./html-template/ html-template/
COPY *.js ./

RUN CYPRESS_INSTALL_BINARY=0 npm ci --no-audit && \
    npm run build && \
    export BUILD_NUMBER=${BUILD_NUMBER} && \
    export GIT_REF=${GIT_REF} && \
    npm run record-build-info

FROM node:14-buster-slim
LABEL maintainer="HMPPS Digital Studio <info@digital.justice.gov.uk>"

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*

RUN addgroup --gid 2000 --system appgroup && \
    adduser --uid 2000 --system appuser --gid 2000

ENV TZ=Europe/London
RUN ln -snf "/usr/share/zoneinfo/$TZ" /etc/localtime && echo "$TZ" > /etc/timezone

# Create app directory
RUN mkdir /app && chown appuser:appgroup /app
USER 2000
WORKDIR /app
ADD --chown=appuser:appgroup . .

COPY --from=builder --chown=appuser:appgroup /app/build /app/build
COPY --from=builder --chown=appuser:appgroup /app/node_modules /app/node_modules
COPY --from=builder --chown=appuser:appgroup /app/build-info.json /app/build-info.json

ENV PORT=3000

EXPOSE 3000
USER 2000
CMD [ "npm", "start" ]
