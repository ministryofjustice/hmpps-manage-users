[![CircleCI](https://circleci.com/gh/ministryofjustice/hmpps-manage-users/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/hmpps-manage-users)
[![Known Vulnerabilities](https://snyk.io/test/github/ministryofjustice/hmpps-manage-users/badge.svg)](https://snyk.io/test/github/ministryofjustice/hmpps-manage-users)

# Manage HMPPS Auth Accounts

The service requires the following minimum tool versions:

- node v16+ 
- Chrome 
- Chromedriver (align the version with chrome version installed on your machine)

Ensure that you have these installed using your system package manager and/or npm for node. 

# Dependent services when running locally

When running locally this service needs to use several other supporting services which
need to be running and available at known locations.

- prison-api        port: 8080
- Oauth2 Server    port: 9090

For simplicity, the easiest way to make these services available is to clone the prison-api
repository and to run the docker compose file in the root directory to bring up local 
versions of all three. This starts the services at the above default ports on your
machine.

```
docker-compose pull && docker-compose up
```

# Running hmpps-manage-users locally

The application can be built & run with the following bash commands : 

```
npm install
npm run start:dev
```

This will start the service and use the default dependent services as above.

The UI will be available on http://localhost:3001

NPM will use the package.json file in the root of the project to download any required dependencies.
The application will listen for any changes and restart as necessary.

# Overriding the Default Environment Settings

When hmpps-manage-users runs in non-local environments it requires a set of environment variables to 
tell it where to find the dependent services and other important settings.
The following environment variables supply these values:


| Environment Variable    | Description                                  |
|------------------------ |:--------------------------------------------:|
| API_CLIENT_ID           | Client ID for accessing prison-api            |
| API_CLIENT_SECRET       | Client secret for accessing prison-api        |
| API_ENDPOINT_URL        | URL to the prison-api                         |
| OAUTH_ENDPOINT_URL      | URL to the Oauth2 server                     |
| DPS_ENDPOINT_URL        | DPS Core UI                                  |
| SESSION_COOKIE_SECRET   | Session cookie secret                        | 


# Production execution

For a production build run the following within bash :

```
npm run build
node-env mode=PRODUCTION npm start
```

# Running in Docker locally

```
docker run -p 3001:3000 -d \
     --name hmpps-manage-users \
     -e USE_API_GATEWAY_AUTH=no \
     quay.io/hmpps/hmpps-manage-users:latest
```

# Cypress Integration tests

The `integration-tests` directory contains a set of Cypress integration tests.
These tests WireMock to stub the application's dependencies on the prison, ouath RESTful APIs.

## Running the feature tests

They do not need the dependent services to be running as it uses a special version of the service with wiremocked stubs for these.
Feature tests may be run either from the commandline of from within IntelliJ.
A choice of web browsers can be configured, though Chrome or Chrome headless are configured by default.

* Preparation (do this whether running from commandline or IntelliJ)

   - Download the latest version of ChromeDriver and follow the installation instructions here:
     ```
      https://sites.google.com/a/chromium.org/chromedriver/downloads
      https://sites.google.com/a/chromium.org/chromedriver/getting-started
     ```
   - Check that a chromedriver executable is available on your path
   - Check that the versions of chromedriver and your installed chrome browser match 

### Running the Cypress tests

You need to fire up the wiremock server first:
```docker-compose -f docker-compose-test.yaml up```

This will give you useful feedback if the app is making requests that you haven't mocked out. You can see
the reqest log at `localhost:9191/__admin/requests/` and a JSON representation of the mocks `localhost:9191/__admin/mappings`.

### Starting feature tests node instance

A separate node instance needs to be started for the feature tests. This will run on port 3008 and won't conflict
with any of the api services, e.g. prison-api or oauth.

```npm run start-feature:dev```

Note that the circleci will run `start-feature-no-webpack` instead, which will rely on a production webpack build
rather than using the dev webpack against the assets.

### Running the tests

With the UI:
```
npm run int-test-ui
```

Just on the command line (any console log outputs will not be visible, they appear in the browser the Cypress UI fires up):
```
npm run int-test
```

### Linting and unit tests

to run typescript typechecking:
```npm run typecheck```

to run linting:
```npm run lint```

to run jest unit tests:
```npm test```

#### Phase Name Banner
To show the phase name banner add the environment variable ``` SYSTEM_PHASE=ENV_NAME ```.
This will trigger the banner to become visible showing the given name.

### Useful links

- WireMock: http://wiremock.org/
- Chromedriver: https://sites.google.com/a/chromium.org/chromedriver

