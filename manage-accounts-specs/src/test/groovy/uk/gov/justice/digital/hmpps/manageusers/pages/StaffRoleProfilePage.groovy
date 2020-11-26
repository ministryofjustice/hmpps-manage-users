package uk.gov.justice.digital.hmpps.manageusers.pages

import geb.Page

class StaffRoleProfilePage extends Page {
    static url = "/manage-dps-users"

    static at = {
        browser.currentUrl.contains(url)
    }

    static content = {
        headingText { $('h1').first().text() }
        removeButtons { $('.removeButton') }
        backLink { $('a.backlink')}
        addButton { $("[data-qa='add-role-button']")}
        messageBar(required: false) { $('div #messageBar')}
        caseload(required: false) { $('div #caseloadDiv')}
        removeButtonOMIC_ADMIN (required: false) { $("[data-qa='remove-button-OMIC_ADMIN']")}
        rows (required: false) { $('table tbody tr') }
        errorSummary(required: false) { $('.error-summary') }
    }

}
