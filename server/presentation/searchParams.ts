class SearchParamsHelper {
  private readonly searchUrl: string

  constructor(searchUrl: string) {
    this.searchUrl = searchUrl
  }

  hrefToRemoveFilter = (searchParams: URLSearchParams, fieldName: string, fieldValue?: string): string => {
    const searchParamsCopy = this.removeField(searchParams, fieldName, fieldValue)
    return `${this.searchUrl}?${searchParamsCopy.toString()}`
  }

  removeField = (searchParams: URLSearchParams, fieldName: string, fieldValue?: string): URLSearchParams => {
    const searchParamsCopy = new URLSearchParams(searchParams)
    searchParamsCopy.delete(fieldName, fieldValue)
    return searchParamsCopy
  }
}
export default SearchParamsHelper
