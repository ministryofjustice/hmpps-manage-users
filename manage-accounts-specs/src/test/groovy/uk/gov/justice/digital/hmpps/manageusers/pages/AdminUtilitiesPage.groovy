package uk.gov.justice.digital.hmpps.manageusers.pages

import geb.Page

class AdminUtilitiesPage extends Page {
    static url = "/"

    static at = {
        headingText == 'Maintain HMPPS Users'
    }

    static content = {
        headingText { $('h1').first().text() }
        keyworkerSettingsLink(required: false, to: KeyworkerSettingsPage) { $('#keyworker_settings_link') }
        maintainRolesLink(required: false, to: UserSearchPage) { $('#maintain_roles_link') }
        maintainAuthUsersLink(required: false, to: AuthUserSearchPage) { $('#maintain_auth_users_link') }
        messageBar(required: false) { $('div #messageBar')}
    }
}
