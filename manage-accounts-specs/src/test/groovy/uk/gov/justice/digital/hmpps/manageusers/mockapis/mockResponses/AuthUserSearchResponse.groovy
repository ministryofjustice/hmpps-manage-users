package uk.gov.justice.digital.hmpps.manageusers.mockapis.mockResponses


class AuthUserSearchResponse {

  static getUsernameResponse(enabled = true) { """
        {"username": "AUTH_ADM", "email": "auth_test2@digital.justice.gov.uk", "enabled": ${enabled}, "locked": false, "verified": false, "firstName": "Auth", "lastName": "Adm"}
""" }

  static usernameSearchResponse(enabled = true) {
    """ {
          "content": [
            {"username": "AUTH_ADM", "email": "auth_test2@digital.justice.gov.uk", "enabled": ${enabled}, "locked": false, "verified": false, "firstName": "Auth", "lastName": "Adm"}
          ],
          "pageable": {
            "offset": 0,
            "pageNumber": 0,
            "pageSize": 10
          },
          "totalElements": 1
        } """
  }

  static rolesResponse = """[
        {"roleCode": "GLOBAL_SEARCH", "roleName": "Global Search"},
        {"roleCode": "LICENCE_RO", "roleName": "Licence Responsible Officer"}
]"""

  static groupsResponse = """[
        {"groupCode": "SITE_1_GROUP_1", "groupName": "Site 1 - Group 1"},
        {"groupCode": "SITE_1_GROUP_2", "groupName": "Site 1 - Group 2"}
]"""

  static assignableRolesResponse = """[
        {"roleCode": "GLOBAL_SEARCH", "roleName": "Global Search"},
        {"roleCode": "LICENCE_RO", "roleName": "Licence Responsible Officer"},
        {"roleCode": "LICENCE_VARY", "roleName": "Licence Vary"}
]"""

  static allGroupsResponse = """[
        {"groupCode": "GROUP_1", "groupName": "Site 1 - Group 1"},
        {"groupCode": "GROUP_2", "groupName": "Site 1 - Group 2"},
        {"groupCode": "GROUP_3", "groupName": "Site 1 - Group 3"}
]"""
}
