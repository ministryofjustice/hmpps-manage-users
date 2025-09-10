import { FilterToggleButton } from './moj-frontend.min.js'

const $filters = document.querySelectorAll('[data-module="moj-filter"]')

$filters.forEach(($sortableTable) => {
  new FilterToggleButton($sortableTable, {
    bigModeMediaQuery: '(min-width: 48.063em)',
    startHidden: false,
    toggleButton: {
      showText: 'Show filters',
      hideText: 'Hide filters',
      classes: 'govuk-button--secondary',
    },
    toggleButtonContainer: {
      selector: '.moj-action-bar__filter',
    },
    closeButton: {
      text: 'Close',
      classes: 'moj-filter__close',
    },
    closeButtonContainer: {
      selector: '.moj-filter__header-action',
    },
  })
})

function moveFilterTagsToResults() {
  const newContainer = $('.moj-action-bar__filterTagsContainer')
  const tagsContainer = $('.moj-filter__selected')
  tagsContainer.appendTo(newContainer)
}

moveFilterTagsToResults()
