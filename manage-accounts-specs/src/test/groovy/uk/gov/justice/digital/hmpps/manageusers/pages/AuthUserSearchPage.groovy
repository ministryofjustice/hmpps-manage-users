package uk.gov.justice.digital.hmpps.manageusers.pages;

import geb.Page

public class AuthUserSearchPage extends Page {
    static url = "/search-external-users"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Search for an external user')
    }

    static content = {
        headingText { $('h1').first().text() }
        searchButton { $('[data-qa="search-button"]')}
    }

    void search(String text) {
        $('form').user = text
        assert searchButton.text() == 'Search'
        searchButton.click()
    }
}
