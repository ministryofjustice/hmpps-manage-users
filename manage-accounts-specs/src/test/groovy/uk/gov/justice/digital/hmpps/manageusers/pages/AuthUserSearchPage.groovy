package uk.gov.justice.digital.hmpps.manageusers.pages;

import geb.Page

public class AuthUserSearchPage extends Page {
    static url = "/maintain-auth-users"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Search for auth user')
    }

    static content = {
        headingText { $('h1').first().text() }
        searchButton { $('#search-button') }
    }

    void search(String text) {
        $('form').user = text
        assert searchButton.text() == 'Search'
        searchButton.click()
    }
}
