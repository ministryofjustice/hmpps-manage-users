import React, { Component } from 'react'
import qs from 'qs'

const searchComponent = (WrappedComponent) => {
  class AuthUserSearchHoc extends Component {
    handleChange = (event) => {
      const { name, value } = event.target
      this.setState({ [name]: value })
    }

    handleSearch = (event) => {
      const userQuery = qs.stringify(this.state)
      event.preventDefault()
      // @ts-ignore
      window.location = `/search-external-users/results?${userQuery}`
    }

    render() {
      return <WrappedComponent {...this.props} handleSearch={this.handleSearch} handleChange={this.handleChange} />
    }
  }

  return AuthUserSearchHoc
}

export default searchComponent
