package uk.gov.justice.digital.hmpps.manageusers.pages

import geb.Page

class AuthUserCreatePage extends Page {
    static url = "/create-external-user"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Create external users')
    }

    static content = {
        headingText { $('h1').first().text() }
        createButton { $('#create-button') }
        errors { $('#error-summary').text() }
    }

    void createUser(String username, String email, String firstName, String lastName, String groupCode) {
        $('form').username = username
        $('form').email = email
        $('form').firstName = firstName
        $('form').lastName = lastName
        $('form').groupCode = groupCode
        assert createButton.text() == 'Create'
        createButton.click()
    }
}
