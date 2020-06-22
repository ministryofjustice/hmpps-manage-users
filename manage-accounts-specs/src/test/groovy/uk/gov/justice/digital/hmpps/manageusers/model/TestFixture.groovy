package uk.gov.justice.digital.hmpps.manageusers.model

import geb.Browser
import uk.gov.justice.digital.hmpps.manageusers.mockapis.Elite2Api

import uk.gov.justice.digital.hmpps.manageusers.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.manageusers.mockapis.TokenVerificationApi
import uk.gov.justice.digital.hmpps.manageusers.pages.AdminUtilitiesPage

class TestFixture {

    Browser browser
    Elite2Api elite2Api
    OauthApi oauthApi
    TokenVerificationApi tokenVerificationApi

    UserAccount currentUser

    TestFixture(Browser browser, Elite2Api elite2Api, OauthApi oauthApi, TokenVerificationApi tokenVerificationApi) {
        this.browser = browser
        this.elite2Api = elite2Api
        this.oauthApi = oauthApi
        this.tokenVerificationApi = tokenVerificationApi
    }

    def loginAs(UserAccount user) {
        currentUser = user
        oauthApi.stubValidOAuthTokenLogin()
        oauthApi.stubGetMyDetails currentUser
        elite2Api.stubGetMyCaseloads currentUser.caseloads

        oauthApi.stubGetMyRoles([[roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN']])

        browser.to AdminUtilitiesPage
    }

    def loginWithoutStaffRoles(UserAccount user) {
        currentUser = user
        oauthApi.stubValidOAuthTokenLogin()
        oauthApi.stubGetMyDetails currentUser
        elite2Api.stubGetMyCaseloads currentUser.caseloads
        tokenVerificationApi.stubVerifyToken()

        browser.to AdminUtilitiesPage
    }
}
