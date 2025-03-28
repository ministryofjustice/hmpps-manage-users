const menuFactory = (getNotificationMessage) => {
  const index = async (req, res) => {
    let bannerMessage = ''
    if (res.locals.user.maintainAccess || res.locals.user.maintainAccessAdmin) {
      const { message } = await getNotificationMessage(res.locals)
      bannerMessage = message
    }

    res.render('menu.njk', {
      message: bannerMessage,
      hasManageUserAllowList:
        res.locals.featureSwitches.manageUserAllowList.enabled && res.locals.user.manageUserAllowList,
    })
  }
  return { index }
}

module.exports = {
  menuFactory,
}
