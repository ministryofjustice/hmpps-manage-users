export default class CsvValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CsvValidationError'
  }
}
