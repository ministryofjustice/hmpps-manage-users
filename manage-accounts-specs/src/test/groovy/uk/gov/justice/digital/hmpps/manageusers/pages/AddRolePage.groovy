package uk.gov.justice.digital.hmpps.manageusers.pages;

import geb.Page

class AddRolePage extends Page {


    static url = "/add-role"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Add another role')
    }

    static content = {
        headingText { $('h1').first().text() }
        backLink { $('a.backlink')}
        addButton { $('#add-button')}
        roleOptionUSER_ADMIN { $('#USER_ADMIN_option')}
    }

}
