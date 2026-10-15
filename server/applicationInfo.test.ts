import applicationInfoSupplier from './applicationInfo'
import config from './config'

describe('applicationInfo', () => {
  it('reads the application name from package.json and build details from config', () => {
    const applicationInfo = applicationInfoSupplier()

    expect(applicationInfo).toEqual({
      applicationName: 'hmpps-manage-users',
      buildNumber: config.buildNumber,
      gitRef: config.gitRef,
      gitShortHash: config.gitRef.substring(0, 7),
      productId: config.productId,
      branchName: config.branchName,
    })
  })
})
