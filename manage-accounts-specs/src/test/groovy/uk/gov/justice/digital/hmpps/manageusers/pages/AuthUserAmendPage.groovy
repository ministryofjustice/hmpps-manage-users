package uk.gov.justice.digital.hmpps.manageusers.pages

import geb.Page

public class AuthUserAmendPage extends Page {
    static url = "/manage-auth-users/"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Change email')
    }

    static content = {
        headingText { $('h1').first().text() }
        amendButton { $('[data-qa="confirm-button"]') }
        errorSummary(required: false) { $('[data-qa-errors]') }
    }

    void amendUser(String email) {
        $('form').email = email
        assert amendButton.text() == 'Confirm'
        amendButton.click()
    }
}
