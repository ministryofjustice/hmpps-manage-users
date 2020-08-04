package uk.gov.justice.digital.hmpps.manageusers.model

import groovy.transform.TupleConstructor

@TupleConstructor
enum StaffMember {

    SM_1(-1, Caseload.NWEB, Caseload.NWEB, 'User', 'Prison', 'API', true),
    SM_2(-2, Caseload.LEI, Caseload.LEI, 'User', 'API', 'ITAG', true),
    SM_3(-3, Caseload.LEI, Caseload.LEI, 'User', 'HPA', null, true),
    SM_4(-4, Caseload.MUL, Caseload.MUL, 'User', 'Test', null, true),
    SM_5(-5, Caseload.LEI, Caseload.LEI, 'User', 'Another', 'Test', true),
    SM_6(-6, Caseload.MDI, Caseload.MDI, 'Officer1', 'Wing', null, true),
    SM_7(-7, Caseload.BXI, Caseload.BXI, 'Officer2', 'Wing', null, true),
    SM_8(-8, Caseload.WAI, Caseload.WAI, 'Officer3', 'Wing', null, true),
    SM_9(-9, Caseload.SYI, Caseload.SYI, 'Officer4', 'Wing', null, true),
    SM_10(-10, Caseload.LEI, Caseload.LEI, 'Officer', 'Ex', null, false)

    Integer id
    Caseload assginedCaseload
    Caseload workingCaseload
    String lastName
    String firstName
    String middleName
    Boolean active
}
