package uk.gov.justice.digital.hmpps.manageusers.specs

import com.github.tomakehurst.wiremock.client.WireMock
import org.junit.Rule
import uk.gov.justice.digital.hmpps.manageusers.mockapis.PrisonApi

import uk.gov.justice.digital.hmpps.manageusers.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.manageusers.mockapis.TokenVerificationApi
import uk.gov.justice.digital.hmpps.manageusers.model.TestFixture
import uk.gov.justice.digital.hmpps.manageusers.pages.*
import wiremock.org.apache.commons.lang3.RandomStringUtils

import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo
import static uk.gov.justice.digital.hmpps.manageusers.model.UserAccount.ITAG_USER

class MaintainAuthUsersSpecification extends BrowserReportingSpec {

    @Rule
    OauthApi oauthApi = new OauthApi()

    @Rule
    PrisonApi prisonApi = new PrisonApi()

    @Rule
    TokenVerificationApi tokenVerificationApi = new TokenVerificationApi()

    TestFixture fixture = new TestFixture(browser, prisonApi, oauthApi, tokenVerificationApi)

    def "should add and remove a group from a user"() {
        def MaintainAuthUsersRole = [roleId: -1, roleCode: 'MAINTAIN_OAUTH_USERS']
        oauthApi.stubGetMyRoles([MaintainAuthUsersRole])

        given: "I have navigated to the Maintain External user search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        to AuthUserSearchPage

        when: "I perform a search by username"
        oauthApi.stubAuthUsernameSearch()
        search('sometext')

        then: "The external user search results page is displayed"
        at AuthUserSearchResultsPage
        assert waitFor { rows.size() == 2 }
        user.value() == 'sometext'

        when: "I choose a user to edit"
        oauthApi.stubAuthUserRoles()
        oauthApi.stubAuthUserGroups()
        rows[1].find("#edit-button-AUTH_ADM").click()

        then: "I can see the user details"
        at AuthUserPage
        headingText == 'Auth Adm'
        userRows[0].find("td", 1).text() == 'AUTH_ADM'
        userRows[1].find("td", 1).text() == 'auth_test2@digital.justice.gov.uk'

        groupRows.size() == 2
        groupRows[0].find("td", 0).text() == 'Site 1 - Group 1'

        oauthApi.stubAuthAllGroups()

        when: 'I navigate to the add group page'
        addGroupButton.click()

        at AuthUserAddGroupPage

        then: 'I am on the add group page'
        assert waitFor { headingText == 'Select group' }
        oauthApi.stubAuthAddGroup()

        when: 'I select to add the Site 1 - Group 3 to the user'
        choose('Site 1 - Group 3')

        at AuthUserPage
        then: 'I remove the Site 1 - Group 3 from the user'
        oauthApi.stubAuthRemoveGroup()
        groupRows[0].find("[data-qa='remove-button-SITE_1_GROUP_1']").click()
    }

    def "add and remove a group not available for group managers"() {
        def MaintainAuthUsersRole = [roleId: -1, roleCode: 'AUTH_GROUP_MANAGER']
        oauthApi.stubGetMyRoles([MaintainAuthUsersRole])

        given: "I have navigated to the Maintain External user search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        to AuthUserSearchPage

        when: "I perform a search by username"
        oauthApi.stubAuthUsernameSearch()
        search('sometext')

        then: "The external user search results page is displayed"
        at AuthUserSearchResultsPage
        assert waitFor { rows.size() == 2 }
        user.value() == 'sometext'

        when: "I choose a user to edit"
        oauthApi.stubAuthUserRoles()
        oauthApi.stubAuthUserGroups()
        rows[1].find("#edit-button-AUTH_ADM").click()

        then: "I can see the user details"
        at AuthUserPage
        headingText == 'Auth Adm'
        userRows[0].find("td", 1).text() == 'AUTH_ADM'
        userRows[1].find("td", 1).text() == 'auth_test2@digital.justice.gov.uk'

        groupRows.size() == 2
        groupRows[0].find("td", 0).text() == 'Site 1 - Group 1'

        oauthApi.stubAuthAllGroups()

        then: 'The add group button is missing'
        assert !addGroupButton.displayed

        then: 'The remove group button is missing'
        assert !groupRows[0].find("[data-qa='remove-button-SITE_1_GROUP_1']").displayed

    }

    def "should create a user"() {
        def MaintainAuthUsersRole = [roleId: -1, roleCode: 'MAINTAIN_OAUTH_USERS']
        oauthApi.stubGetMyRoles([MaintainAuthUsersRole])

        given: "I have navigated to the Create External user page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        oauthApi.stubAuthAllGroups()
        to AuthUserCreatePage

        when: "I create a user"
        createUser('user', 'email@joe', 'first', 'last', '--')

        then: "I am shown validation errors"
        at AuthUserCreatePage
        waitFor { errors == 'There is a problem\nUsername must be 6 characters or more\nEnter an email address in the correct format, like first.last@justice.gov.uk'}

        when: "I have another go at creating a user"
        def username = RandomStringUtils.randomAlphanumeric(6)
        def email = "${RandomStringUtils.randomAlphanumeric(6)}.noone@justice.gov.uk"

        oauthApi.stubAuthCreateUser()
        oauthApi.stubAuthUsernameSearch()
        oauthApi.stubAuthUserRoles()
        oauthApi.stubAuthUserGroups()
        createUser(username, email, 'first', 'last', '--')

        then: "My user is created"
        at AuthUserPage

        userRows[0].find("td", 1).text() == 'AUTH_ADM'
        userRows[1].find("td", 1).text() == 'auth_test2@digital.justice.gov.uk'

        oauthApi.verify(WireMock.getRequestedFor(urlPathEqualTo("/auth/api/authuser/$username")));
    }

    def "should create a user and assign to a group"() {
        def MaintainAuthUsersRole = [roleId: -1, roleCode: 'AUTH_GROUP_MANAGER']
        oauthApi.stubGetMyRoles([MaintainAuthUsersRole])

        given: "I have navigated to the Create External user page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        oauthApi.stubAuthAllGroups()
        to AuthUserCreatePage

        when: "I create a user"
        createUser('userdwdw', 'email@digital.justice.gov.uk', 'first', 'last', '--')

        then: "I am shown validation errors"
        at AuthUserCreatePage
        waitFor { errors == 'There is a problem\nSelect a group'}

        when: "I have another go at creating a user"
        def username = RandomStringUtils.randomAlphanumeric(6)
        def email = "${RandomStringUtils.randomAlphanumeric(6)}.noone@justice.gov.uk"

        oauthApi.stubAuthCreateUser()
        oauthApi.stubAuthUsernameSearch()
        oauthApi.stubAuthUserRoles()
        oauthApi.stubAuthUserGroups()
        createUser(username, email, 'first', 'last', 'GROUP_1')

        then: "My user is created"
        at AuthUserPage

        userRows[0].find("td", 1).text() == 'AUTH_ADM'
        userRows[1].find("td", 1).text() == 'auth_test2@digital.justice.gov.uk'

        oauthApi.verify(WireMock.getRequestedFor(urlPathEqualTo("/auth/api/authuser/$username")));
    }

    def "should enable and disable a user"() {
        def MaintainAuthUsersRole = [roleId: -1, roleCode: 'MAINTAIN_OAUTH_USERS']
        oauthApi.stubGetMyRoles([MaintainAuthUsersRole])

        given: "I have navigated to the Maintain External user search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        oauthApi.stubAuthUsernameSearch()
        oauthApi.stubAuthUserRoles()
        oauthApi.stubAuthUserGroups()

        when:
        browser.go('/manage-external-users/AUTH_TEST')
        at AuthUserPage
        enabled.text() == 'ACTIVE ACCOUNT'
        oauthApi.stubAuthUserDisable()
        oauthApi.stubAuthUsernameSearch(false)
        enableButton.click()

        then:
        at AuthUserPage

        enabled.text() == 'INACTIVE ACCOUNT'
        oauthApi.stubAuthUserEnable()
        enableButton.click()
    }

    def "should amend a user"() {
        def MaintainAuthUsersRole = [roleId: -1, roleCode: 'MAINTAIN_OAUTH_USERS']
        oauthApi.stubGetMyRoles([MaintainAuthUsersRole])

        given: "I have navigated to the Maintain External user search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        oauthApi.stubAuthUsernameSearch()
        oauthApi.stubAuthUserRoles()
        oauthApi.stubAuthUserGroups()

        when:
        browser.go('/manage-external-users/AUTH_TEST')
        at AuthUserPage
        amendLink.click()

        then:
        at AuthUserAmendPage

        when: "I enter an invalid email address"
        amendUser('invalid_email@somewhere')

        then: "The error message is displayed"
        at AuthUserAmendPage
        assert waitFor { errorSummary.text() == 'There is a problem\nEnter an email address in the correct format, like first.last@justice.gov.uk' }

        when: "I enter a new email address"
        oauthApi.stubAuthUsernameAmend()
        amendUser('some.where@a.place.com')

        then: "The email address is amended and user is taken back to the user page"
        at AuthUserPage
    }

    def "should show empty list if searching for non-existing user"() {
        def MaintainAuthUsersRole = [roleId: -1, roleCode: 'MAINTAIN_OAUTH_USERS']
        oauthApi.stubGetMyRoles([MaintainAuthUsersRole])

        given: "I have navigated to the Maintain External user search page"
        fixture.loginWithoutStaffRoles(ITAG_USER)
        prisonApi.stubGetRoles()
        to AuthUserSearchPage

        when: "I perform a search by email for a non-existing user"
        oauthApi.stubAuthEmailSearchNoUsersFound()
        search('not.a.user@justice.gov.uk')

        then: "The error message is displayed"
        at AuthUserSearchResultsPage
        assert waitFor { errorSummary.text().contains('There is a problem') }
        assert errorSummary.text().contains('not.a.user@justice.gov.uk')
        !rows.displayed
    }
}
