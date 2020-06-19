const { stubFor } = require('./wiremock')

module.exports = {
  stubUserMe: () =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/users/me',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: {
          firstName: 'JAMES',
          lastName: 'STUART',
          activeCaseLoadId: 'MDI',
        },
      },
    }),
  stubUserCaseloads: caseloads =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/users/me/caseLoads',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: caseloads || [
          {
            caseLoadId: 'MDI',
            description: 'Moorland',
          },
        ],
      },
    }),
  stubUserLocations: locations =>
    stubFor({
      request: {
        method: 'GET',
        urlPattern: '/api/users/me/locations',
      },
      response: {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
        },
        jsonBody: locations || [
          {
            locationId: 1,
            locationType: 'INST',
            description: 'Moorland (HMP & YOI)',
            agencyId: 'MDI',
            locationPrefix: 'MDI',
          },
          {
            locationId: 2,
            locationType: 'WING',
            description: 'Houseblock 1',
            agencyId: 'MDI',
            locationPrefix: 'MDI-1',
            userDescription: 'Houseblock 1',
          },
          {
            locationId: 3,
            locationType: 'WING',
            description: 'Houseblock 2',
            agencyId: 'MDI',
            locationPrefix: 'MDI-2',
            userDescription: 'Houseblock 2',
          },
        ],
      },
    }),
}
