const downloadButtonEnabled = (enabled) => {
  const $downloadButton = $('.downloadButton')

  if (enabled) {
    $downloadButton.removeAttr('disabled')
    $downloadButton.removeAttr('aria-disabled')
    $downloadButton.removeClass('govuk-button--disabled')
  } else {
    $downloadButton.attr('disabled', 'disabled')
    $downloadButton.attr('aria-disabled', 'true')
    $downloadButton.addClass('govuk-button--disabled')
  }
}

const displayDownloadInProgress = (display) => {
  const $downloadInProgress = $('#downloadInProgress')

  if (display) {
    $downloadInProgress.removeClass('govuk-!-display-none')
  } else {
    $downloadInProgress.addClass('govuk-!-display-none')
  }
}

const displayDownloadError = (display) => {
  const $downloadError = $('#downloadError')

  if (display) {
    $downloadError.removeClass('govuk-!-display-none')
  } else {
    $downloadError.addClass('govuk-!-display-none')
  }
}

const serveFile = (response, filename) => {
  const url = window.URL.createObjectURL(new Blob([response]))
  const link = $('<a></a>').attr({
    href: url,
    download: filename,
  })
  $('body').append(link)
  link[0].click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

const handleFormSubmit = (event, $form, filename) => {
  event.preventDefault()
  downloadButtonEnabled(false)
  displayDownloadInProgress(true)
  displayDownloadError(false)

  $.ajax({
    url: $form.prop('action'),
    method: 'GET',
    success: (response) => {
      downloadButtonEnabled(true)
      displayDownloadInProgress(false)
      displayDownloadError(false)
      serveFile(response, filename)
    },
    error: () => {
      downloadButtonEnabled(true)
      displayDownloadInProgress(false)
      displayDownloadError(true)
    },
  })
}

$(() => {
  const $downloadUsersForm = $('#downloadUsersForm')
  $downloadUsersForm.on('submit', (event) => handleFormSubmit(event, $downloadUsersForm, 'user-search.csv'))
  const $downloadLsaForm = $('#downloadLsaForm')
  $downloadLsaForm.on('submit', (event) => handleFormSubmit(event, $downloadLsaForm, 'lsa-report.csv'))
  const $downloadAllowListForm = $('#downloadAllowListForm')
  $downloadAllowListForm.on('submit', (event) => handleFormSubmit(event, $downloadAllowListForm, 'allow-list.csv'))
})
