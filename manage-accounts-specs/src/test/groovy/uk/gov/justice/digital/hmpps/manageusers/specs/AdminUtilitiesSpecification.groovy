package uk.gov.justice.digital.hmpps.manageusers.specs


import org.junit.Rule
import uk.gov.justice.digital.hmpps.manageusers.mockapis.PrisonApi
import uk.gov.justice.digital.hmpps.manageusers.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.manageusers.mockapis.TokenVerificationApi
import uk.gov.justice.digital.hmpps.manageusers.model.TestFixture
import uk.gov.justice.digital.hmpps.manageusers.pages.AdminUtilitiesPage

import static uk.gov.justice.digital.hmpps.manageusers.model.UserAccount.ITAG_USER

class AdminUtilitiesSpecification extends BrowserReportingSpec {
    @Rule
    OauthApi oauthApi = new OauthApi()

    @Rule
    PrisonApi prisonApi = new PrisonApi()

    @Rule
    TokenVerificationApi tokenVerificationApi = new TokenVerificationApi()

    TestFixture fixture = new TestFixture(browser, prisonApi, oauthApi, tokenVerificationApi)


    def "should see Search for an external user link if the user has the MAINTAIN_OAUTH_USERS role"() {
        def maintainAuthUsersRole = [roleId: -1, roleCode: 'MAINTAIN_OAUTH_USERS']
        oauthApi.stubGetMyRoles([maintainAuthUsersRole])

        given: "I logged in and go to the Manage user accounts page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        to AdminUtilitiesPage

        when: "I am on the Manage user accounts page"

        then: "I should see the Search for an external user link"
        assert maintainAuthUsersLink.displayed
    }

    def "should see Search for an external user link if the user has the group manager role"() {
        def maintainAuthUsersRole = [roleId: -1, roleCode: 'AUTH_GROUP_MANAGER']
        oauthApi.stubGetMyRoles([maintainAuthUsersRole])

        given: "I logged in and go to the Manage user accounts page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        to AdminUtilitiesPage

        when: "I am on the Manage user accounts page"

        then: "I should see the Search for an external user link"
        assert maintainAuthUsersLink.displayed
    }

    private void setupRoles() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)
    }
}
