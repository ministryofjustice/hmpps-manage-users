import accessibleAutocomplete from 'accessible-autocomplete'

export default () => {
  document.querySelectorAll<HTMLElement>('.autocomplete-select').forEach(select => {
    accessibleAutocomplete.enhanceSelectElement({
      selectElement: select,
      showAllValues: true,
      preserveNullOptions: true,
      menuClasses: 'govuk-body',
    })
  })
}
