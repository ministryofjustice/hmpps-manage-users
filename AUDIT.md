# Manage HMPPS Auth Accounts

## Audit events

The service sends EVENT_ATTEMPT and EVENT_FAILURE events to audit from controllers using the `hmpps-audit` service.

| ManageUsersEvent     | SubjectType     | Details                                                                                                        |
|----------------------|-----------------|----------------------------------------------------------------------------------------------------------------|
| VIEW_USER_GROUPS     | USER_ID         |                                                                                                                |
| ADD_USER_GROUP       | USER_ID         | groupCode                                                                                                      |
| REMOVE_USER_GROUP    | USER_ID         | groupCode                                                                                                      |
| VIEW_USER_ROLES      | USER_ID         |                                                                                                                |
| ADD_USER_ROLES       | USER_ID         | roles                                                                                                          |
| REMOVE_USER_ROLE     | USER_ID         | role                                                                                                           |
| ADD_USER_CASELOAD    | USER_ID         | caseloads                                                                                                      |
| REMOVE_USER_CASELOAD | USER_ID         | caseload                                                                                                       |
| LIST_ROLES           |                 |                                                                                                                |
| VIEW_ROLE_DETAILS    | ROLE_CODE       |                                                                                                                |
| CREATE_ROLE          |                 | role                                                                                                           |
| UPDATE_ROLE          | ROLE_CODE       | role, newRoleAdminType                                                                                         |
| UPDATE_ROLE          | ROLE_CODE       | role, newRoleDescription                                                                                       |
| UPDATE_ROLE          | ROLE_CODE       | role, newRoleName                                                                                              |
| VIEW_USER            | USER_ID         |                                                                                                                |
| UPDATE_USER          | USER_ID         | email                                                                                                          |
| CREATE_USER          | USER_ID         | user (email, firstname, lastname, groupcodes[]), authsource=external                                           |
| CREATE_USER          | USER_ID         | user (email, firstname, lastname, userType, defaultCaseloadId), authsource=nomis                               |
| ENABLE_USER          | USER_ID         |                                                                                                                |
| DISABLE_USER         | USER_ID         |                                                                                                                |
| LIST_GROUPS          |                 |                                                                                                                |
| VIEW_GROUP_DETAILS   | GROUP_CODE      |                                                                                                                |
| CREATE_GROUP         |                 | groupCode, groupName, parentGroupCode?                                                                         |
| UPDATE_GROUP         | GROUP_CODE      | newGroupName, parentGroupCode?                                                                                 |
| DELETE_GROUP         | GROUP_CODE      |                                                                                                                |
| LIST_EMAIL_DOMAINS   |                 |                                                                                                                |
| CREATE_EMAIL_DOMAIN  |                 | domain                                                                                                         |
| DELETE_EMAIL_DOMAIN  | EMAIL_DOMAIN_ID |                                                                                                                |
| CREATE_LINKED_USER   | USER_ID         | action (create-search, create-gen, create-admin, create-lsa), existingUsername, adminUsername, generalUsername |
| DEACTIVATE_USER      | USER_ID         |                                                                                                                |
| SEARCH_USER          |                 | authsource (external, nomis), filter (full query object)                                                       |
| DOWNLOAD_REPORT      |                 | authsource (external, nomis), report (user-search, lsa-report), query (full query object)                      |