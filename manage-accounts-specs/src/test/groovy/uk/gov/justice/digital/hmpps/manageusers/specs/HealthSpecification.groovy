package uk.gov.justice.digital.hmpps.manageusers.specs

import groovyx.net.http.HttpBuilder
import groovyx.net.http.HttpException
import org.junit.Rule
import spock.lang.Specification
import uk.gov.justice.digital.hmpps.manageusers.mockapis.PrisonApi
import uk.gov.justice.digital.hmpps.manageusers.mockapis.OauthApi
import uk.gov.justice.digital.hmpps.manageusers.mockapis.TokenVerificationApi

import static groovyx.net.http.HttpBuilder.configure

class HealthSpecification extends Specification {

  @Rule
  PrisonApi prisonApi = new PrisonApi()

  @Rule
  OauthApi oauthApi = new OauthApi()

  @Rule
  TokenVerificationApi tokenVerificationApi = new TokenVerificationApi()

  HttpBuilder http

  def setup() {
    http = configure {
      request.uri = 'http://localhost:3005/health'
    }
  }

  def "Health page reports ok"() {

    given:
    prisonApi.stubHealth()
    oauthApi.stubHealth()
    tokenVerificationApi.stubHealth()

    when:
    def response = this.http.get()
    then:
    response.uptime > 0.0
    response.name == "manage-hmpps-auth-accounts"
    !response.version.isEmpty()
    response.api == [auth: 'UP', prison: 'UP', tokenverification: 'UP']
  }

  def "Health page reports API down"() {

    given:
    prisonApi.stubDelayedError('/health/ping', 500)
    oauthApi.stubHealth()
    tokenVerificationApi.stubHealth()

    when:
    def response
    try {
      response = http.get()
    } catch (HttpException e) {
      response = e.body
    }

    then:
    response.name == "manage-hmpps-auth-accounts"
    !response.version.isEmpty()
    response.api == [auth             : 'UP',
                     prison           : [timeout: 1000, code: 'ECONNABORTED', errno: 'ETIMEDOUT', retries: 2],
                     tokenverification: 'UP']
  }
}
