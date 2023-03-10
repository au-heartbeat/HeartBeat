class Metrics {
  navigate() {
    cy.visit(Cypress.env('url') + '/metrics')
  }
  typeProjectName(projectName: string) {
    cy.contains('Project Name').siblings().type(projectName)
  }

  selectDateRange(from: string, to: string) {
    cy.contains('From').parent().find('button').click()
    cy.get('.MuiPickersPopper-root').find('button').contains(from).click()

    cy.contains('To').parent().find('button').click()
    cy.get('.MuiPickersPopper-root').find('button').contains(to).click()
  }

  selectVelocityAndCycleTime() {
    cy.contains('Required Data').siblings().click()

    cy.contains('Velocity').click()
    cy.contains('Cycle time').click()

    cy.get('div.MuiBackdrop-root.MuiBackdrop-invisible.MuiModal-backdrop').click({ force: true })
  }

  fillBoardFieldsInfo(boardId: string, email: string, projectKey: string, site: string, token: string) {
    cy.get('button:contains("Verify")').should('be.disabled')

    cy.contains('BoardId').siblings().type(boardId)
    cy.contains('Email').siblings().type(email)
    cy.contains('Project Key').siblings().type(projectKey)
    cy.contains('Site').siblings().type(site)
    cy.contains('Token').siblings().type(token)

    cy.get('button:contains("Verify")').should('be.enabled')
  }

  selectLeadTimeForChangesAndDeploymentFrequency() {
    cy.contains('Required Data').siblings().click()
    cy.get("[type='checkbox']").uncheck()

    cy.contains('Lead time for changes').click()
    cy.contains('Deployment frequency').click()

    cy.get('div.MuiBackdrop-root.MuiBackdrop-invisible.MuiModal-backdrop').click({ force: true })
  }

  fillPipelineToolFieldsInfo(token: string) {
    cy.get('button:contains("Verify")').should('be.disabled')

    cy.contains('Token').siblings().type(token)
    cy.get('button:contains("Verify")').should('be.enabled')
  }

  fillSourceControlFieldsInfo(token: string) {
    cy.get('[data-test-id="sourceControlVerifyButton"]').should('be.disabled')

    cy.contains("[data-testid='sourceControlTextField']", 'Token').type(token)
    cy.get('button:contains("Verify")').should('be.enabled')
  }

  goMetricsStep() {
    cy.contains('Next').click()
    cy.contains('Crews Setting').should('exist')
    cy.contains('Real Done').should('exist')
  }

  checkRealDoneOption() {
    cy.contains('Consider as Done').siblings().click()
    cy.get("[type='checkbox']").uncheck()

    cy.contains('DONE').click()
    cy.contains('CANCELLED').click()

    cy.get('div.MuiBackdrop-root.MuiBackdrop-invisible.MuiModal-backdrop').click({ force: true })
  }
}

const metricsPage = new Metrics()
export default metricsPage
