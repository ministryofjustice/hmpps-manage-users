const allowDownload = (response) => {
  return (
    response.locals?.user?.maintainAccessAdmin ||
    (response.locals?.user?.maintainAuthUsers && !response.locals?.user?.groupManager)
  )
}

module.exports = {
  allowDownload,
}
