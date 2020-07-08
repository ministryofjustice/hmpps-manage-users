package uk.gov.justice.digital.hmpps.manageusers.model

import geb.Browser
import uk.gov.justice.digital.hmpps.manageusers.mockapis.PrisonApi

import uk.gov.justice.digital.hmpps.manageusers.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.manageusers.mockapis.TokenVerificationApi
import uk.gov.justice.digital.hmpps.manageusers.pages.AdminUtilitiesPage

class TestFixture {

    Browser browser
    PrisonApi prisonApi
    OauthApi oauthApi
    TokenVerificationApi tokenVerificationApi

    UserAccount currentUser

    TestFixture(Browser browser, PrisonApi prisonApi, OauthApi oauthApi, TokenVerificationApi tokenVerificationApi) {
        this.browser = browser
        this.prisonApi = prisonApi
        this.oauthApi = oauthApi
        this.tokenVerificationApi = tokenVerificationApi
    }

    def loginAs(UserAccount user) {
        currentUser = user
        oauthApi.stubValidOAuthTokenLogin()
        oauthApi.stubGetMyDetails currentUser
        prisonApi.stubGetMyCaseloads currentUser.caseloads

        oauthApi.stubGetMyRoles([[roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN']])

        browser.to AdminUtilitiesPage
    }

    def loginWithoutStaffRoles(UserAccount user) {
        currentUser = user
        oauthApi.stubValidOAuthTokenLogin()
        oauthApi.stubGetMyDetails currentUser
        prisonApi.stubGetMyCaseloads currentUser.caseloads
        tokenVerificationApi.stubVerifyToken()

        browser.to AdminUtilitiesPage
    }
}
