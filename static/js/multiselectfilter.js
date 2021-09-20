window.onload = function () {
  document.querySelectorAll('.msf-multi-select-filter').forEach((filter) => {
    new window.GOVUK.Modules.MultiSelectFilter(filter).init()
  })
}

;(window.GOVUK = window.GOVUK || {}),
  (window.GOVUK.Modules = window.GOVUK.Modules || {}),
  (function (root) {
    function MultiSelectFilter(multiSelectFilter) {
      ;(this.$optionSelect = multiSelectFilter),
        (this.$options = this.$optionSelect.querySelectorAll("input[type='checkbox']")),
        (this.$optionsContainer = this.$optionSelect.querySelector('.js-options-container')),
        (this.$optionList = this.$optionsContainer.querySelector('.js-auto-height-inner')),
        (this.$allCheckboxes = this.$optionsContainer.querySelectorAll('.govuk-checkboxes__item')),
        (this.checkedCheckboxes = [])
    }
    ;(MultiSelectFilter.prototype.init = function () {
      ;(this.$filter = this.$optionSelect.querySelector('input.js-search-input')),
        (this.checkboxLabels = []),
        (this.filterTimeout = 0),
        this.getAllCheckedCheckboxes()
      for (var n = 0; n < this.$allCheckboxes.length; n++)
        this.checkboxLabels.push(this.cleanString(this.$allCheckboxes[n].textContent))
      this.$filter.addEventListener('keyup', this.typeFilterText.bind(this))
      this.setupHeight()
      this.$filterCount = document.getElementById(this.$filter.getAttribute('aria-describedby'))
      this.$optionsContainer
        .querySelector('.govuk-checkboxes')
        .addEventListener('change', this.updateCheckedCount.bind(this))
      this.updateCheckedCount()
    }),
      (MultiSelectFilter.prototype.typeFilterText = function (searchInput) {
        searchInput.stopPropagation()
        var enterKey = 13
        searchInput.keyCode !== enterKey
          ? (clearTimeout(this.filterTimeout),
            (this.filterTimeout = setTimeout(
              function () {
                this.doFilter(this)
              }.bind(this),
              300,
            )))
          : searchInput.preventDefault()
      }),
      (MultiSelectFilter.prototype.cleanString = function (label) {
        return (label = (label = (label = label.replace(/&/g, 'and')).replace(/[\u2019',:\u2013-]/g, '')).replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        ))
          .trim()
          .replace(/\s\s+/g, ' ')
          .toLowerCase()
      }),
      (MultiSelectFilter.prototype.getAllCheckedCheckboxes = function () {
        this.checkedCheckboxes = []
        for (var index = 0; index < this.$options.length; index++)
          this.$options[index].checked && this.checkedCheckboxes.push(index)
      }),
      (MultiSelectFilter.prototype.doFilter = function (multiSelectFilterInstance) {
        var searchPhrase = multiSelectFilterInstance.cleanString(multiSelectFilterInstance.$filter.value),
          currentlySelected = multiSelectFilterInstance.checkedCheckboxes.slice(),
          index = 0
        for (index = 0; index < multiSelectFilterInstance.$allCheckboxes.length; index++)
          -1 === currentlySelected.indexOf(index) &&
            -1 !== multiSelectFilterInstance.checkboxLabels[index].search(searchPhrase) &&
            currentlySelected.push(index)
        for (index = 0; index < multiSelectFilterInstance.$allCheckboxes.length; index++)
          multiSelectFilterInstance.$allCheckboxes[index].style.display = 'none'
        for (index = 0; index < currentlySelected.length; index++)
          multiSelectFilterInstance.$allCheckboxes[currentlySelected[index]].style.display = 'block'
        var selectedItems = multiSelectFilterInstance.$optionsContainer.querySelectorAll(
            '.govuk-checkboxes__input:checked',
          ).length,
          counterText = currentlySelected.length + ' found, ' + selectedItems + ' selected'
        multiSelectFilterInstance.$filterCount.innerHTML = counterText
      }),
      (MultiSelectFilter.prototype.setContainerHeight = function (height) {
        this.$optionsContainer.style.height = height + 'px'
      }),
      (MultiSelectFilter.prototype.isCheckboxVisible = function (multiSelectFilterInstance) {
        var containerHeight = this.$optionsContainer.clientHeight,
          optionsTop = this.$optionList.getBoundingClientRect().top
        return multiSelectFilterInstance.getBoundingClientRect().top - optionsTop < containerHeight
      }),
      (MultiSelectFilter.prototype.getVisibleCheckboxes = function () {
        for (var visibleOptions = [], index = 0; index < this.$options.length; index++)
          this.isCheckboxVisible(this.$options[index]) && visibleOptions.push(this.$options[index])
        return (
          this.$options[visibleOptions.length] && visibleOptions.push(this.$options[visibleOptions.length]),
          visibleOptions
        )
      }),
      (MultiSelectFilter.prototype.setupHeight = function () {
        var containerHeight = this.$optionsContainer.clientHeight,
          optionsOffsetHeight = this.$optionList.offsetHeight,
          optionParent = this.$optionSelect.parentElement
        if (
          (!(optionParent.offsetWidth || optionParent.offsetHeight || optionParent.getClientRects().length) &&
            (optionsOffsetHeight = containerHeight = 200),
          optionsOffsetHeight < containerHeight + 50)
        )
          this.setContainerHeight(optionsOffsetHeight + 1)
        else {
          var visibleCheckboxes = this.getVisibleCheckboxes(),
            lastVisible = visibleCheckboxes[visibleCheckboxes.length - 1],
            topOfLastVisible = lastVisible.parentNode.offsetTop
          this.setContainerHeight(topOfLastVisible + lastVisible.clientHeight / 1.5)
        }
      }),
      (MultiSelectFilter.prototype.updateCheckedCount = function () {
        var checked = this.checkedString(),
          selectedCounter = this.$optionSelect.querySelector('.js-selected-counter')
        selectedCounter.textContent = checked
      })
    ;(MultiSelectFilter.prototype.checkedString = function () {
      this.getAllCheckedCheckboxes()
      var selectedCount = this.checkedCheckboxes.length

      if (selectedCount > 0) {
        return selectedCount + ' selected'
      }
      return ''
    }),
      (root.MultiSelectFilter = MultiSelectFilter)
  })(window.GOVUK.Modules)
