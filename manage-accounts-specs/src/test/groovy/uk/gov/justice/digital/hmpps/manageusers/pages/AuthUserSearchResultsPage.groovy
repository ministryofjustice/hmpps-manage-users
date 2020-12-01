package uk.gov.justice.digital.hmpps.manageusers.pages

public class AuthUserSearchResultsPage extends AuthUserSearchPage {
    static url = "/search-external-users/results"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Search results')
    }

    static content = {
        headingText { $('h1').first().text() }
        rows(required: false) { $('table tbody tr') }
        noResults(required: false) { $('[data-qa="no-results"]')}
    }
}
