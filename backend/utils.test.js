const { capitalize, getDate, getTime, trimObjValues } = require('./utils')

describe('capitalize()', () => {
  describe('when a string IS NOT provided', () => {
    it('should return an empty string', () => {
      expect(capitalize()).toEqual('')
      expect(capitalize(['array item 1, array item 2'])).toEqual('')
      expect(capitalize({ key: 'value' })).toEqual('')
      expect(capitalize(1)).toEqual('')
    })
  })

  describe('when a string IS provided', () => {
    it('should handle uppercased strings', () => {
      expect(capitalize('HOUSEBLOCK 1')).toEqual('Houseblock 1')
    })

    it('should handle lowercased strings', () => {
      expect(capitalize('houseblock 1')).toEqual('Houseblock 1')
    })

    it('should handle multiple word strings', () => {
      expect(capitalize('Segregation Unit')).toEqual('Segregation unit')
    })
  })
})

describe('getDate()', () => {
  it('should return the correctly formatted date only', () => {
    expect(getDate('2019-09-23T15:30:00')).toEqual('Monday 23 September 2019')
  })

  it('should return Invalid message if invalid string is used', () => {
    expect(getDate('2019-13-23')).toEqual('Invalid date or time')
  })

  it('should return Invalid message if no date time string is used', () => {
    expect(getDate()).toEqual('Invalid date or time')
  })
})

describe('getTime()', () => {
  it('should return the correctly formatted time only', () => {
    expect(getTime('2019-09-23T15:30:00')).toEqual('15:30')
  })

  it('should return Invalid message if invalid string is used', () => {
    expect(getTime('2019-13-23')).toEqual('Invalid date or time')
  })

  it('should return Invalid message if no date time string is used', () => {
    expect(getTime()).toEqual('Invalid date or time')
  })
})

describe('trimObjectValues()', () => {
  it('should trim all fields of an object with proper values', () => {
    expect(trimObjValues({ firstName: ' Andy ', lastName: ' Thomas ' })).toEqual({
      firstName: 'Andy',
      lastName: 'Thomas',
    })
  })
  it('should trim fields of an object with some undefined fields ', () => {
    expect(trimObjValues({ firstName: ' Andy ', lastName: undefined })).toEqual({
      firstName: 'Andy',
      lastName: undefined,
    })
  })
  it('should trim fields of an object with some null fields ', () => {
    expect(trimObjValues({ firstName: null, lastName: ' Thomas ' })).toEqual({
      firstName: null,
      lastName: 'Thomas',
    })
  })
  it('should trim fields of an object with some empty fields ', () => {
    expect(trimObjValues({ firstName: '', lastName: ' Thomas ' })).toEqual({
      firstName: '',
      lastName: 'Thomas',
    })
  })
})
