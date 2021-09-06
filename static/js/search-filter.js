$('.moj-filter__options')
  .find(':button')
  .on('click', () => {
    $('#filter-form').submit()
  })
