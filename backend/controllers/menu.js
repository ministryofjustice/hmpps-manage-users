const menuFactory = () => {
  const index = async (req, res) => res.render('menu.njk')

  return { index }
}

module.exports = { menuFactory }
