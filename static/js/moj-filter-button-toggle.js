new MOJFrontend.FilterToggleButton({
  bigModeMediaQuery: '(min-width: 48.063em)',
  startHidden: false,
  toggleButton: {
    container: $('.moj-action-bar__filter'),
    showText: 'Show filters',
    hideText: 'Hide filters',
    classes: 'govuk-button--secondary',
  },
  closeButton: {
    container: $('.moj-filter'),
    text: 'Close',
  },
  filter: {
    container: $('.moj-filter-layout__filter'),
  },
})

function moveFilterTagsToResults() {
  var newContainer = $('.moj-action-bar__filterTagsContainer')
  var tagsContainer = $('.moj-filter__selected')
  tagsContainer.appendTo(newContainer)
}

moveFilterTagsToResults()
