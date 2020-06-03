package uk.gov.justice.digital.hmpps.manageusers.pages

import geb.Page
import uk.gov.justice.digital.hmpps.manageusers.model.UserAccount
import uk.gov.justice.digital.hmpps.manageusers.modules.ErrorsModule

class LoginPage extends Page {

    static url = 'login'

    static at = {
        title == 'Digital Prison Services'
        headingText == 'Sign in'
    }

    static content = {
        errors { module(ErrorsModule) }
        headingText { $('h1').first().text() }
        signInButton{ $("input", type: 'submit') }
    }

    void loginAs(UserAccount userAccount, String password) {

        $('form').username = userAccount.username
        $('form').password = password

        assert signInButton.value() == 'Sign in'

        signInButton.click()
    }

}
