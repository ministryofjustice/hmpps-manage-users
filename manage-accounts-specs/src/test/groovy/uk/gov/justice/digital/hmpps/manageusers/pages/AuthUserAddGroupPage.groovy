package uk.gov.justice.digital.hmpps.manageusers.pages;

import geb.Page

public class AuthUserAddGroupPage extends Page {
    static url = "/manage-auth-users/"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Select group')
    }

    static content = {
        headingText { $('h1').first().text() }
        addGroup { $('[data-qa="add-button"]') }
        selectOption { $('#group') }
    }

    void choose(String group) {
        def option = selectOption { $('select') }
        selectOption.find("option").find { it.text() == group }.click()
        addGroup.click()
    }
}
