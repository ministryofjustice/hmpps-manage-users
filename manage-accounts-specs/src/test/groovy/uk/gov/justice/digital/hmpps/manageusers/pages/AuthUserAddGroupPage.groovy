package uk.gov.justice.digital.hmpps.manageusers.pages;

import geb.Page
import org.openqa.selenium.Keys

public class AuthUserAddGroupPage extends Page {
    static url = "/manage-external-users/"

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
        selectOption = group
        selectOption << Keys.ENTER
        addGroup.click()
    }
}
