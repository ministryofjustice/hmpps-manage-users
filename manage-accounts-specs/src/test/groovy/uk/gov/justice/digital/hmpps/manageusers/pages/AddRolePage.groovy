package uk.gov.justice.digital.hmpps.manageusers.pages;

import geb.Page

class AddRolePage extends Page {


    static url = "/select-roles"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Select roles')
    }

    static content = {
        headingText { $('h1').first().text() }
        backLink { $('a.backlink')}
        addButton { $('[data-qa="add-button"]')}
        selectOption { $('#roles') }
    }

    void choose(String role) {
        selectOption.value(role)
        addButton.click()
    }
}
