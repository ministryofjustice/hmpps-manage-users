package uk.gov.justice.digital.hmpps.manageusers.specs


import org.junit.Rule
import uk.gov.justice.digital.hmpps.manageusers.mockapis.Elite2Api
import uk.gov.justice.digital.hmpps.manageusers.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.manageusers.model.TestFixture
import uk.gov.justice.digital.hmpps.manageusers.pages.AdminUtilitiesPage

import static uk.gov.justice.digital.hmpps.manageusers.model.UserAccount.ITAG_USER

class AdminUtilitiesSpecification extends BrowserReportingSpec {
    @Rule
    OauthApi oauthApi = new OauthApi()

    @Rule
    Elite2Api elite2api = new Elite2Api()

    TestFixture fixture = new TestFixture(browser, elite2api, oauthApi)


    def "should see maintain auth users link if the user has the MAINTAIN_OAUTH_USERS role"() {
        def maintainAuthUsersRole = [roleId: -1, roleCode: 'MAINTAIN_OAUTH_USERS']
        oauthApi.stubGetMyRoles([maintainAuthUsersRole])

        given: "I logged in and go to the Maintain HMPPS Users page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        to AdminUtilitiesPage

        when: "I am on the Maintain HMPPS Users page"

        then: "I should see the maintain auth users link"
        assert maintainAuthUsersLink.displayed
    }

    def "should see maintain auth users link if the user has the group manager role"() {
        def maintainAuthUsersRole = [roleId: -1, roleCode: 'AUTH_GROUP_MANAGER']
        oauthApi.stubGetMyRoles([maintainAuthUsersRole])

        given: "I logged in and go to the Maintain HMPPS Users page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        to AdminUtilitiesPage

        when: "I am on the Maintain HMPPS Users page"

        then: "I should see the maintain auth users link"
        assert maintainAuthUsersLink.displayed
    }

    private void setupRoles() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)
    }
}
