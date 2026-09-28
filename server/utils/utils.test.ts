import {
  convertToTitleCase,
  initialiseName,
  isAlphaStringOrSpecialChars,
  toArray,
  toBoolean,
  toStringArray,
} from './utils'

describe('convert to title case', () => {
  it.each([
    [null, null, ''],
    ['empty string', '', ''],
    ['Lower case', 'robert', 'Robert'],
    ['Upper case', 'ROBERT', 'Robert'],
    ['Mixed case', 'RoBErT', 'Robert'],
    ['Multiple words', 'RobeRT SMiTH', 'Robert Smith'],
    ['Leading spaces', '  RobeRT', '  Robert'],
    ['Trailing spaces', 'RobeRT  ', 'Robert  '],
    ['Hyphenated', 'Robert-John SmiTH-jONes-WILSON', 'Robert-John Smith-Jones-Wilson'],
  ])('%s convertToTitleCase(%s, %s)', (_: string | null, a: string | null, expected: string) => {
    expect(convertToTitleCase(a)).toEqual(expected)
  })
})

describe('initialise name', () => {
  it.each([
    [null, null, null],
    ['Empty string', '', null],
    ['One word', 'robert', 'r. robert'],
    ['Two words', 'Robert James', 'R. James'],
    ['Three words', 'Robert James Smith', 'R. Smith'],
    ['Double barrelled', 'Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('%s initialiseName(%s, %s)', (_: string | null, a: string | null, expected: string | null) => {
    expect(initialiseName(a)).toEqual(expected)
  })
})

describe('isAlphaStringOrSpecialChars', () => {
  test.each([
    ['John', true],
    ["O'Connor", true],
    ['Jean-Paul', true],
    ['Anne-Marie', true],
    ['D’Angelo', true],
    ['O’Brien', true],
    ['Alpha-Beta', true],
  ])('returns %s -> %s for valid/invalid input', (input, expected) => {
    const result = isAlphaStringOrSpecialChars(input)
    expect(result).toBe(expected)
  })

  test.each([
    ['John123', false],
    ['123', false],
    ['John!', false],
    ['John_Doe', false],
    ['John Doe', false],
    ['', false],
  ])('rejects invalid values %s -> %s', (input, expected) => {
    const result = isAlphaStringOrSpecialChars(input)
    expect(result).toBe(expected)
  })
})

describe('toArray', () => {
  describe('array inputs', () => {
    it('returns the same array reference when input is an array', () => {
      const input = [1, 2, 3]

      const result = toArray(input)

      expect(result).toBe(input)
      expect(result).toEqual([1, 2, 3])
    })

    it('works with arrays of objects', () => {
      const input = [{ id: 1 }, { id: 2 }]

      const result = toArray(input)

      expect(result).toBe(input)
    })
  })

  describe('single values', () => {
    it('wraps a number in an array', () => {
      const result = toArray(42)

      expect(result).toEqual([42])
    })

    it('wraps a string in an array', () => {
      const result = toArray('hello')

      expect(result).toEqual(['hello'])
    })

    it('wraps an object in an array', () => {
      const input = { a: 1 }
      const result = toArray(input)

      expect(result).toEqual([input])
    })
  })

  describe('falsy values', () => {
    it('wraps 0 in an array', () => {
      const result = toArray(0)

      expect(result).toEqual([0])
    })

    it('wraps empty string in an array', () => {
      const result = toArray('')

      expect(result).toEqual([''])
    })

    it('wraps false in an array', () => {
      const result = toArray(false)

      expect(result).toEqual([false])
    })
  })

  describe('undefined input', () => {
    it('returns an empty array', () => {
      const result = toArray(undefined)

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('returns a new empty array each call', () => {
      const a = toArray(undefined)
      const b = toArray(undefined)

      expect(a).not.toBe(b)
    })
  })
})

describe('toStringArray', () => {
  it('returns the same array reference when input is an array', () => {
    const input = ['a', 'b']

    const result = toStringArray(input)

    expect(result).toBe(input)
    expect(result).toEqual(['a', 'b'])
  })

  it('wraps a non-empty string in an array', () => {
    const result = toStringArray('hello')

    expect(result).toEqual(['hello'])
  })

  it('returns an empty array for empty string', () => {
    const result = toStringArray('')

    expect(result).toEqual([])
  })

  it('returns an empty array for undefined', () => {
    const result = toStringArray(undefined)

    expect(result).toEqual([])
  })
})

describe('toBoolean', () => {
  it.each<[string | undefined, boolean | undefined]>([
    [undefined, undefined],

    ['true', true],
    ['TRUE', true],
    ['True', true],
    [' tRuE ', true],

    ['false', false],
    ['FALSE', false],
    [' False ', false],

    ['yes', false],
    ['1', false],
    ['', false],
    ['   ', false],
    ['tru', false],
  ])('toBoolean(%p) → %p', (input, expected) => {
    expect(toBoolean(input)).toBe(expected)
  })
})
