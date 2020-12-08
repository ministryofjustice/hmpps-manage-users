package uk.gov.justice.digital.hmpps.manageusers.specs


import org.junit.Rule
import uk.gov.justice.digital.hmpps.manageusers.mockapis.PrisonApi

import uk.gov.justice.digital.hmpps.manageusers.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.manageusers.mockapis.TokenVerificationApi
import uk.gov.justice.digital.hmpps.manageusers.model.Caseload
import uk.gov.justice.digital.hmpps.manageusers.model.TestFixture
import uk.gov.justice.digital.hmpps.manageusers.model.UserAccount
import uk.gov.justice.digital.hmpps.manageusers.pages.*

import static uk.gov.justice.digital.hmpps.manageusers.model.UserAccount.ITAG_USER

class MaintainRolesSpecification extends BrowserReportingSpec {

    @Rule
    OauthApi oauthApi = new OauthApi()

    @Rule
    PrisonApi prisonApi = new PrisonApi()

    @Rule
    TokenVerificationApi tokenVerificationApi = new TokenVerificationApi()


    TestFixture fixture = new TestFixture(browser, prisonApi, oauthApi, tokenVerificationApi)

    def "should allow an unsupported prison's default settings to be displayed"() {
        finish
    }


    def "should allow a user search and display results"() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)

        given: "I have navigated to the Maintain roles - User search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()

        when: "i perform a search"
        at UserSearchPage
        prisonApi.stubUserLocalAdministratorSearch()
        searchButton.click()

        then: "the user search results page is displayed"
        at UserSearchResultsPage
        rows.size() == 6
    }

    def "should allow an ADMIN user search and display results"() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)

        given: "I have navigated to the Maintain roles - User search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRolesIncludingAdminRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()

        when: "i perform a global user search"
        at UserSearchPage
        prisonApi.stubUserSearchAdmin(0)
        searchButton.click()

        then: "the user search results page is displayed"
        at UserSearchResultsPage
        rows.size() == 3

        and: "i select a user to edit"
        prisonApi.stubGetUserDetails(UserAccount.API_TEST_USER)
        prisonApi.stubGetAgencyDetailsMultipleAgencies(Caseload.LEI)
        prisonApi.stubGetNWEBAccessRolesForUserAndCaseloadForAdminUser(UserAccount.API_TEST_USER.username, true)
        editButtonAPI_TEST_USER.click()

        then: "i am presented with the Staff profile page"
        at StaffRoleProfilePage

        and: 'And no errors are displayed'
        !errorSummary.displayed
    }

    def "handles empty caseload on Staff role profile"() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)

        given: "I have navigated to the Maintain roles - User search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRolesIncludingAdminRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()

        when: "i perform a global user search"
        at UserSearchPage
        prisonApi.stubUserSearchAdmin(0)
        searchButton.click()

        then: "the user search results page is displayed"
        at UserSearchResultsPage
        rows.size() == 3

        and: "i select a user to edit"
        prisonApi.stubGetUserDetails(UserAccount.API_TEST_USER)
        prisonApi.stubGetAgencyDetailsEmptyResult(Caseload.LEI)
        prisonApi.stubGetNWEBAccessRolesForUserAndCaseloadForAdminUser(UserAccount.API_TEST_USER.username, true)
        editButtonAPI_TEST_USER.click()

        then: "i am presented with the Staff profile page without a caseload description"
        at StaffRoleProfilePage
        !caseload.isDisplayed()

        and: 'And no errors are displayed'
        !errorSummary.displayed
    }

    def "should display Staff Role profile and allow role removal"() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)

        given: "I have navigated to the Staff Profile page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()
        at UserSearchPage
        prisonApi.stubUserLocalAdministratorSearch()
        searchButton.click()
        at UserSearchResultsPage
        prisonApi.stubGetUserDetails(UserAccount.API_TEST_USER)
        prisonApi.stubGetAgencyDetails(Caseload.LEI)
        prisonApi.stubGetNWEBAccessRolesForUserAndCaseload(UserAccount.API_TEST_USER.username, true)
        editButtonAPI_TEST_USER.click()
        at StaffRoleProfilePage

        when: "I remove a role"
        prisonApi.stubGetUserDetails(UserAccount.API_TEST_USER)
        prisonApi.stubGetAgencyDetails(Caseload.LEI)
        prisonApi.stubGetNWEBAccessRolesForUserAndCaseload(UserAccount.API_TEST_USER.username, false)
        prisonApi.stubRemoveNWEBRole(UserAccount.API_TEST_USER.username, "OMIC_ADMIN")
        removeButtonOMIC_ADMIN.click()

        then: "The new role list is displayed"
        at StaffRoleProfilePage

        and: 'And no errors are displayed'
        !errorSummary.displayed
    }

    def "should allow adding a new role"() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)

        given: "I have navigated to the Staff Profile page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()
        at UserSearchPage
        prisonApi.stubUserLocalAdministratorSearch()
        searchButton.click()
        at UserSearchResultsPage
        prisonApi.stubGetUserDetails(UserAccount.API_TEST_USER)
        prisonApi.stubGetAgencyDetails(Caseload.LEI)
        prisonApi.stubGetNWEBAccessRolesForUserAndCaseload(UserAccount.API_TEST_USER.username, true)
        editButtonAPI_TEST_USER.click()
        at StaffRoleProfilePage

        and: "I select add a role"
        oauthApi.stubGetMyRoles(roles)
        addButton.click()

        when: "I select a new role and submit"
        at AddRolePage
        prisonApi.stubGetUserDetails(UserAccount.API_TEST_USER)
        prisonApi.stubGetAgencyDetails(Caseload.LEI)
        prisonApi.stubGetNWEBAccessRolesForUserAndCaseload(UserAccount.API_TEST_USER.username, true)
        prisonApi.stubAddNWEBRole(UserAccount.API_TEST_USER.username)
        choose("USER_ADMIN")

        then: "I am returned to the StaffRoleProfile page with an updated role list"
        at StaffRoleProfilePage

        and: 'And no errors are displayed'
        !errorSummary.displayed
    }
}
