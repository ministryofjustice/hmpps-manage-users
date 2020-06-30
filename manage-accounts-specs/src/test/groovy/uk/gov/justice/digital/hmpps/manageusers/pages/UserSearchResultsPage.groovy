package uk.gov.justice.digital.hmpps.manageusers.pages

import geb.Page

class UserSearchResultsPage extends Page {


    static url = "/maintain-roles/search-results"

    static at = {
        browser.currentUrl.contains(url)
        headingText.contains('Search for a user')
    }

    static content = {
        headingText { $('h1').first().text() }
        searchButton { $('#search-button') }
        nextPage (required: false){ $('#next-page') }
        previousPage (required: false){ $('#previous-page') }
        backLink { $('a.backlink')}
        roleSelect { $('#role-select')}
        nameFilter { $('#name-Filter')}
        editButtonAPI_TEST_USER (required: false){ $('#edit-button-API_TEST_USER') }
        messageBar(required: false) { $('div #messageBar')}
        rows (required: false) { $('table tbody tr') }
    }

}
