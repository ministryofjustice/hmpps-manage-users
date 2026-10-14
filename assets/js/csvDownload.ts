export default () => {
  CsvDownload.setup('downloadUsersForm', 'user-search.csv')
  CsvDownload.setup('downloadLsaForm', 'lsa-report.csv')
  CsvDownload.setup('downloadCRSGroups', 'crs-group-members.csv')
  CsvDownload.setup('downloadExternalUsersForm', 'external-user-search.csv')
  CsvDownload.setup('downloadAllowListForm', 'user-allowlist-search.csv')
}

class CsvDownload {
  readonly filename: string

  readonly downloadButton: HTMLElement

  readonly downloadInProgress: HTMLDivElement

  readonly downloadError: HTMLElement

  readonly form: HTMLFormElement

  private constructor(form: HTMLFormElement, filename: string) {
    this.filename = filename
    this.form = form
    this.downloadButton = form.querySelector<HTMLElement>('.downloadButton')
    this.downloadInProgress = document.querySelector<HTMLDivElement>('#downloadInProgress')
    this.downloadError = document.querySelector<HTMLElement>('#downloadError')
  }

  public static setup(formId: string, filename: string) {
    const form = document.querySelector<HTMLFormElement>(`#${formId}`)
    if (form) {
      const csvDownload = new CsvDownload(form, filename)
      csvDownload.init()
    }
  }

  init = () => {
    this.form.addEventListener('submit', this.handleFormSubmit)
  }

  downloadButtonEnabled = (enabled: boolean) => {
    if (enabled) {
      this.downloadButton.removeAttribute('disabled')
      this.downloadButton.removeAttribute('aria-disabled')
      this.downloadButton.classList.remove('govuk-button--disabled')
    } else {
      this.downloadButton.setAttribute('disabled', 'disabled')
      this.downloadButton.setAttribute('aria-disabled', 'true')
      this.downloadButton.classList.add('govuk-button--disabled')
    }
  }

  displayDownloadInProgress = (display: boolean) => {
    if (display) {
      this.downloadInProgress.classList.remove('govuk-!-display-none')
    } else {
      this.downloadInProgress.classList.add('govuk-!-display-none')
    }
  }

  displayDownloadError = (display: boolean) => {
    if (display) {
      this.downloadError.classList.remove('govuk-!-display-none')
    } else {
      this.downloadError.classList.add('govuk-!-display-none')
    }
  }

  downloadCsv = (csvText: string) => {
    const blob = new Blob([csvText], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = this.filename

    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  handleFormSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    this.downloadButtonEnabled(false)
    this.displayDownloadInProgress(true)
    this.displayDownloadError(false)

    try {
      const response = await fetch(`${this.form.action}`, {
        method: 'GET',
        headers: {
          Accept: 'text/csv',
        },
      })

      const csvText = await response.text()

      this.downloadButtonEnabled(true)
      this.displayDownloadInProgress(false)
      this.displayDownloadError(!response.ok)
      if (response.ok) {
        this.downloadCsv(csvText)
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      this.downloadButtonEnabled(true)
      this.displayDownloadInProgress(false)
      this.displayDownloadError(true)
    }
  }
}
