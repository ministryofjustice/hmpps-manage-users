package uk.gov.justice.digital.hmpps.manageusers.model

import groovy.transform.TupleConstructor

@TupleConstructor
public enum OmsRole {

    MAINTAIN_OAUTH_USERS(-100, 'External user Manager', 'MAINTAIN_OAUTH_USERS'),
    MAINTAIN_ACCESS_ROLES_ADMIN(-101, 'NOMIS Admin User Manager', 'MAINTAIN_ACCESS_ROLES_ADMIN'),
    MAINTAIN_ACCESS_ROLES(-203, 'LSA', 'MAINTAIN_ACCESS_ROLES')

    Integer id
    String name
    String code
}
