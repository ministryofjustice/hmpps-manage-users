package uk.gov.justice.digital.hmpps.manageusers.specs


import org.junit.Rule
import uk.gov.justice.digital.hmpps.manageusers.mockapis.Elite2Api

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
    Elite2Api elite2api = new Elite2Api()

    @Rule
    TokenVerificationApi tokenVerificationApi = new TokenVerificationApi()


    TestFixture fixture = new TestFixture(browser, elite2api, oauthApi, tokenVerificationApi)

    def "should allow an unsupported prison's default settings to be displayed"() {
        finish
    }


    def "should allow a user search and display results"() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)

        given: "I have navigated to the Maintain roles - User search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        elite2api.stubGetRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()

        when: "i perform a search"
        at UserSearchPage
        elite2api.stubUserLocalAdministratorSearch()
        searchButton.click()

        then: "the user search results page is displayed"
        at UserSearchResultsPage
        rows.size() == 6
        searchButton.text() == 'Search'
        roleSelect.find('option').size() == 3
    }

    def "should allow an ADMIN user search and display results"() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES_ADMIN']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)

        given: "I have navigated to the Maintain roles - User search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        elite2api.stubGetRolesIncludingAdminRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()

        when: "i perform a global user search"
        at UserSearchPage
        elite2api.stubUserSearchAdmin(0)
        searchButton.click()

        then: "the user search results page is displayed"
        at UserSearchResultsPage
        rows.size() == 3
        searchButton.text() == 'Search'
        roleSelect.find('option').size() == 5

        and: "i select a user to edit"
        elite2api.stubGetUserDetails(UserAccount.API_TEST_USER)
        elite2api.stubGetAgencyDetailsMultipleAgencies(Caseload.LEI)
        elite2api.stubGetNWEBAccessRolesForUserAndCaseloadForAdminUser(UserAccount.API_TEST_USER.username, true)
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
        elite2api.stubGetRolesIncludingAdminRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()

        when: "i perform a global user search"
        at UserSearchPage
        elite2api.stubUserSearchAdmin(0)
        searchButton.click()

        then: "the user search results page is displayed"
        at UserSearchResultsPage
        rows.size() == 3
        searchButton.text() == 'Search'
        roleSelect.find('option').size() == 5

        and: "i select a user to edit"
        elite2api.stubGetUserDetails(UserAccount.API_TEST_USER)
        elite2api.stubGetAgencyDetailsEmptyResult(Caseload.LEI)
        elite2api.stubGetNWEBAccessRolesForUserAndCaseloadForAdminUser(UserAccount.API_TEST_USER.username, true)
        editButtonAPI_TEST_USER.click()

        then: "i am presented with the Staff profile page without a caseload description"
        at StaffRoleProfilePage
        !caseload.isDisplayed()

        and: 'And no errors are displayed'
        !errorSummary.displayed
    }


    def "should handle pagination"() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)

        given: "I have navigated to the Maintain roles - User search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        elite2api.stubGetRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()

        when: "i perform a search"
        at UserSearchPage
        elite2api.stubUserLocalAdministratorSearch(0)
        searchButton.click()

        then: "the user search results page is displayed"
        at UserSearchResultsPage
        rows.size() == 3
        nextPage.text() == "Next\n2 of 3"
        !previousPage.isDisplayed()
        rows[0].find("td",1).text() == 'user0'

        and: "i click on the next page link"
        elite2api.stubUserLocalAdministratorSearch(1)
        nextPage.click()

        then:
        at UserSearchResultsPage
        rows.size() == 3
        waitFor { nextPage.text() == "Next\n3 of 3" }
        previousPage.text() == "Previous\n1 of 3"
        rows[0].find("td",1).text() == 'user1'
        MaintainRolesSpecification
        and: "i click on the next page link"
        elite2api.stubUserLocalAdministratorSearch(2)
        nextPage.click()

        then:
        at UserSearchResultsPage
        rows.size() == 3
        waitFor { !nextPage.isDisplayed() }
        previousPage.text() == "Previous\n2 of 3"
        rows[0].find("td",1).text() == 'user2'

        and: "i click on the previous page link"
        elite2api.stubUserLocalAdministratorSearch(1)
        previousPage.click()

        then:
        at UserSearchResultsPage
        rows.size() == 3
        waitFor { previousPage.text() == "Previous\n1 of 3" }

        and: "i click on the previous page link"
        elite2api.stubUserLocalAdministratorSearch(0)
        previousPage.click()

        then: "i'm back to the first page"
        at UserSearchResultsPage
        rows.size() == 3
        waitFor { nextPage.text() == "Next\n2 of 3" }
        !previousPage.isDisplayed()
        rows[0].find("td",1).text() == 'user0'
    }


    def "should display Staff Role profile and allow role removal"() {
        def MaintainAccessRolesRole = [roleId: -1, roleCode: 'MAINTAIN_ACCESS_ROLES']
        def roles = [MaintainAccessRolesRole]
        oauthApi.stubGetMyRoles(roles)

        given: "I have navigated to the Staff Profile page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        elite2api.stubGetRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()
        at UserSearchPage
        elite2api.stubUserLocalAdministratorSearch()
        searchButton.click()
        at UserSearchResultsPage
        elite2api.stubGetUserDetails(UserAccount.API_TEST_USER)
        elite2api.stubGetAgencyDetails(Caseload.LEI)
        elite2api.stubGetNWEBAccessRolesForUserAndCaseload(UserAccount.API_TEST_USER.username, true)
        editButtonAPI_TEST_USER.click()
        at StaffRoleProfilePage

        when: "I remove a role"
        elite2api.stubGetUserDetails(UserAccount.API_TEST_USER)
        elite2api.stubGetAgencyDetails(Caseload.LEI)
        elite2api.stubGetNWEBAccessRolesForUserAndCaseload(UserAccount.API_TEST_USER.username, false)
        elite2api.stubRemoveNWEBRole(UserAccount.API_TEST_USER.username, "OMIC_ADMIN")
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
        elite2api.stubGetRoles()
        to AdminUtilitiesPage
        maintainRolesLink.click()
        at UserSearchPage
        elite2api.stubUserLocalAdministratorSearch()
        searchButton.click()
        at UserSearchResultsPage
        elite2api.stubGetUserDetails(UserAccount.API_TEST_USER)
        elite2api.stubGetAgencyDetails(Caseload.LEI)
        elite2api.stubGetNWEBAccessRolesForUserAndCaseload(UserAccount.API_TEST_USER.username, true)
        editButtonAPI_TEST_USER.click()
        at StaffRoleProfilePage

        and: "I select add a role"
        oauthApi.stubGetMyRoles(roles)
        addButton.click()

        when: "I select a new role and submit"
        at AddRolePage
        elite2api.stubGetUserDetails(UserAccount.API_TEST_USER)
        elite2api.stubGetAgencyDetails(Caseload.LEI)
        elite2api.stubGetNWEBAccessRolesForUserAndCaseload(UserAccount.API_TEST_USER.username, true)
        roleOptionUSER_ADMIN.click()
        elite2api.stubAddNWEBRole(UserAccount.API_TEST_USER.username, 'USER_ADMIN')
        addButton.click()

        then: "I am returned to the StaffRoleProfile page with an updated role list"
        at StaffRoleProfilePage

        and: 'And no errors are displayed'
        !errorSummary.displayed
    }
}
