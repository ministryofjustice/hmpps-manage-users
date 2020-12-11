package uk.gov.justice.digital.hmpps.manageusers.pages

import geb.Page
import org.openqa.selenium.Keys

class AuthUserCreatePage extends Page {
    static url = "/create-external-user"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Create an external user')
    }

    static content = {
        headingText { $('h1').first().text() }
        createButton { $('[data-qa="create-button"]') }
        selectOption { $('#groupCode') }
        errorSummary(required: false) { $('[data-qa-errors]') }
    }

    void choose(String group) {
        selectOption = group
        selectOption << Keys.ENTER
    }

    void createUser(String username, String email, String firstName, String lastName, String groupCode) {
        $('form').username = username
        $('form').email = email
        $('form').firstName = firstName
        $('form').lastName = lastName
        groupCode == ''? '': choose(groupCode)
        assert createButton.text() == 'Create'
        createButton.click()
    }
}
