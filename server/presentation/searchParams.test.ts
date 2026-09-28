import SearchParamsHelper from './searchParams'

describe('SearchParamsHelper', () => {
  const baseUrl = '/test/search'
  const helper: SearchParamsHelper = new SearchParamsHelper(baseUrl)

  describe('removeField', () => {
    it('removes all values for a field when no value is provided', () => {
      const params = new URLSearchParams('a=1&b=2&a=3')

      const result = helper.removeField(params, 'a')

      expect(result.toString()).toBe('b=2')
    })

    it('removes only the matching field/value pair when value is provided', () => {
      const params = new URLSearchParams('a=1&a=2&a=3')

      const result = helper.removeField(params, 'a', '2')

      expect(result.toString()).toBe('a=1&a=3')
    })

    it('does nothing if field does not exist', () => {
      const params = new URLSearchParams('a=1&b=2')

      const result = helper.removeField(params, 'c')

      expect(result.toString()).toBe('a=1&b=2')
    })

    it('does not mutate the original searchParams object', () => {
      const params = new URLSearchParams('a=1&b=2')

      helper.removeField(params, 'a')

      expect(params.toString()).toBe('a=1&b=2')
    })
  })

  describe('hrefToRemoveFilter', () => {
    it('returns URL with field removed (no value provided)', () => {
      const params = new URLSearchParams('a=1&b=2&a=3')

      const result = helper.hrefToRemoveFilter(params, 'a')

      expect(result).toBe(`${baseUrl}?b=2`)
    })

    it('returns URL with specific field/value removed', () => {
      const params = new URLSearchParams('a=1&a=2&b=3')

      const result = helper.hrefToRemoveFilter(params, 'a', '2')

      expect(result).toBe(`${baseUrl}?a=1&b=3`)
    })

    it('returns URL unchanged when field does not exist', () => {
      const params = new URLSearchParams('a=1&b=2')

      const result = helper.hrefToRemoveFilter(params, 'c')

      expect(result).toBe(`${baseUrl}?a=1&b=2`)
    })

    it('returns base URL with empty query string if all params removed', () => {
      const params = new URLSearchParams('a=1')

      const result = helper.hrefToRemoveFilter(params, 'a')

      expect(result).toBe(`${baseUrl}?`)
    })
  })
})
