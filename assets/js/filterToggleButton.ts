import { FilterToggleButton } from '@ministryofjustice/frontend'

export default () => {
  const root = document.querySelector<HTMLDivElement>('[data-module="moj-filter"]')
  if (root) {
    // eslint-disable-next-line no-new
    new FilterToggleButton(root, {
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
    const newContainer = document.querySelector('.moj-action-bar__filterTagsContainer')
    const tagsContainer = document.querySelector('.moj-filter__selected')
    if (newContainer && tagsContainer) {
      newContainer.append(tagsContainer)
    }
  }
}
