export default () => {
  document.querySelectorAll<HTMLDivElement>('.multi-select-filter').forEach(root => {
    MultiSelectFilter.setup(root)
  })
}

class MultiSelectFilter {
  readonly searchInput: HTMLInputElement

  readonly allCheckboxes: HTMLElement[]

  readonly selectedCounter: HTMLDivElement

  readonly govukCheckboxes: HTMLDivElement

  filterTimeoutId: number

  private constructor(root: HTMLDivElement) {
    this.searchInput = root.querySelector<HTMLInputElement>('.search-input')
    this.allCheckboxes = Array.from(root.querySelectorAll<HTMLElement>('.govuk-checkboxes__item'))
    this.selectedCounter = root.querySelector<HTMLDivElement>('.selected-counter')
    const optionsContainer = root.querySelector<HTMLDivElement>('.options-container')
    this.govukCheckboxes = optionsContainer.querySelector<HTMLDivElement>('.govuk-checkboxes')
    this.filterTimeoutId = 0
  }

  public static setup(root: HTMLDivElement) {
    const multiSelect = new MultiSelectFilter(root)
    multiSelect.init()
  }

  init = () => {
    this.searchInput.addEventListener('keyup', event => {
      event.stopPropagation()
      if (event.key === 'Enter') {
        event.preventDefault()
      } else {
        clearTimeout(this.filterTimeoutId)
        this.filterTimeoutId = setTimeout(this.filterCheckBoxes, 300)
      }
    })
    this.govukCheckboxes.addEventListener('change', this.updateCheckedCount)
    this.updateCheckedCount()
  }

  filterCheckBoxes = () => {
    const searchPhrase = this.searchInput.value.toLowerCase().trim()
    this.allCheckboxes.forEach(checkbox => {
      const label = (checkbox.children[1] as HTMLLabelElement).innerText
      if (label.toLowerCase().trim().includes(searchPhrase)) {
        checkbox.classList.remove('govuk-!-display-none')
      } else {
        checkbox.classList.add('govuk-!-display-none')
      }
    })
  }

  updateCheckedCount = () => {
    const numChecked = this.allCheckboxes.filter(checkbox => (checkbox.children[0] as HTMLInputElement).checked).length
    this.selectedCounter.textContent = numChecked > 0 ? `${numChecked} selected` : ''
  }
}
