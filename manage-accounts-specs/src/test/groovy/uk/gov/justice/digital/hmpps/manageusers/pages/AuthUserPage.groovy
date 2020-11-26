package uk.gov.justice.digital.hmpps.manageusers.pages

public class AuthUserPage extends AuthUserSearchPage {
    static url = "/manage-external-users/"

    static at = {
        browser.currentUrl.contains(url)
    }

    static content = {
        headingText { $('h1').first().text() }
        userRows(required: false) { $('[data-qa="user-details"] tbody tr') }
        roleRows(required: false) { $('[data-qa="user-roles"] tbody tr') }
        groupRows(required: false) { $('[data-qa="user-groups"] tbody tr') }
        addRoleButton { $('[data-qa="add-role-button"]')}
        addGroupButton(required: false) { $('[data-qa="add-group-button"]')}
        enableButton { $('[data-qa="enable-button"]')}
        enabled { $('[data-qa="enabled"]')}
        amendLink(required: false) { $('[data-qa="amend-link"]')}
    }
}
