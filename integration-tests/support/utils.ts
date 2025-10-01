import moment from 'moment/moment'
import { PageElement } from '../pages/typescript/page'

const getRadio = (label: string): PageElement => cy.contains('label', label).prev()

const getFormField = (fieldName: string): PageElement => {
  const selector = `#${fieldName}`
  return cy.get(selector)
}

const getDataQa = (dataQa: string): PageElement => {
  const selector = `[data-qa=${dataQa}]`
  return cy.get(selector)
}

const isChecked = (element: PageElement) => element.should('be.checked')

const typeOrClear = (element: PageElement, text?: string) => {
  if (text) element.type(text)
  else element.clear()
}

const selectDropdownItem = (selectDataQa: string, itemCode: string) => getDataQa(selectDataQa).select(itemCode)

const verifyFormError = (fieldName: string) => {
  const selector = `#${fieldName}-error`
  cy.get(selector).should('be.visible')
}

const verifyEmptyFormField = (fieldName: string) => getFormField(fieldName).should('be.empty')

const verifyFilterTag = (tag: string) => cy.get('.moj-filter__tag').contains(tag).should('exist')

const verifyFormValue = (fieldName: string, value: string) => getFormField(fieldName).should('have.value', value)

const verifyDataQaText = (dataQa: string, text: string) => {
  getDataQa(dataQa).should(($el) => expect($el.text().trim()).to.equal(text))
}

const getEndDate = (
  accessPeriod: 'EXPIRE' | 'ONE_MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'TWELVE_MONTHS' | 'NO_RESTRICTION',
): Date => {
  switch (accessPeriod) {
    case 'ONE_MONTH':
      return moment().endOf('day').add(1, 'months').toDate()
    case 'THREE_MONTHS':
      return moment().endOf('day').add(3, 'months').toDate()
    case 'SIX_MONTHS':
      return moment().endOf('day').add(6, 'months').toDate()
    case 'TWELVE_MONTHS':
      return moment().endOf('day').add(12, 'months').toDate()
    case 'NO_RESTRICTION':
      return moment().endOf('day').add(1000, 'years').toDate()
    case 'EXPIRE':
    default:
      return moment().endOf('day').subtract(1, 'day').toDate()
  }
}

export {
  getDataQa,
  getEndDate,
  getFormField,
  getRadio,
  isChecked,
  typeOrClear,
  verifyDataQaText,
  verifyEmptyFormField,
  verifyFilterTag,
  verifyFormError,
  verifyFormValue,
  selectDropdownItem,
}
