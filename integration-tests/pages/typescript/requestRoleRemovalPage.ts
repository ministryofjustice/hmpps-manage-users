import Page from './page'
import { getDataQa } from '../../support/utils'

export default class RequestRoleRemovalPage extends Page {
  constructor() {
    super('Request role removal')
  }

  verifyRemovalMessage = (expectedMessage: string): RequestRoleRemovalPage => {
    getDataQa('removal-message').contains(expectedMessage)
    return this
  }

  clickContinue = () => getDataQa('continue-button').click()
}
