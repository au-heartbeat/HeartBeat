class Config {
  private readonly backButton = () => cy.contains('Previous')

  private readonly saveButton = () => cy.contains('Save')

  private readonly yesButton = () => cy.contains('Yes')

  private readonly projectNameInput = () => cy.contains('Project name *').siblings().first()

  private readonly collectionDateFrom = () => cy.contains('From').parent()

  private readonly requiredDataSelect = () => cy.contains('Required metrics').siblings()

  private readonly requiredDataAllSelectOption = () => cy.contains('All')

  private readonly requiredDataModelCloseElement = () =>
    cy.get('div.MuiBackdrop-root.MuiBackdrop-invisible.MuiModal-backdrop')

  private readonly boardInfoConfigSection = () => cy.get('[aria-label="Board Config"]')

  private readonly boardInfoSelectionJira = () => cy.contains('Jira')

  private readonly boardInfoSelectionClassicJira = () => cy.contains('Classic Jira')

  private readonly boardInfoBoardIdInput = () => cy.contains('Board Id').siblings().first()

  private readonly boardInfoEmailInput = () => cy.contains('Email').siblings().first()

  private readonly boardInfoProjectKeyInput = () => cy.contains('Project Key').siblings().first()

  private readonly boardInfoSiteInput = () => cy.contains('Site').siblings().first()

  private readonly boardInfoTokenInput = () => cy.contains('Token').siblings().first()

  private readonly boardInfoVerifyButton = () => this.boardInfoConfigSection().contains('Verify')

  private readonly pipelineToolTokenInput = () => cy.contains("[data-testid='pipelineToolTextField']", 'Token')

  private readonly pipelineToolVerifyButton = () => cy.get('[data-test-id="pipelineVerifyButton"]')

  private readonly sourceControlTokenInput = () => cy.contains("[data-testid='sourceControlTextField']", 'Token')

  private readonly sourceControlVerifyButton = () => cy.get('[data-test-id="sourceControlVerifyButton"]')

  private readonly progressBar = () => cy.get('[data-testid="loading-page"]', { timeout: 10000 })

  private readonly cancelButton = () => cy.contains('Cancel')

  private readonly goToMetricsStepButton = () => cy.contains('Next')

  navigate() {
    cy.visit(Cypress.env('url') + '/metrics')
  }

  goHomePage() {
    this.backButton().click()
    this.yesButton().click()

    cy.url().should('include', '/home')
  }

  typeProjectName(projectName: string) {
    this.projectNameInput().type(projectName)
  }

  selectDateRange() {
    this.collectionDateFrom().type('09012022')
  }

  selectMetricsData() {
    this.requiredDataSelect().click()

    this.requiredDataAllSelectOption().click()

    this.requiredDataModelCloseElement().click({ force: true })
  }

  fillBoardInfoAndVerifyWithClassicJira(
    boardId: string,
    email: string,
    projectKey: string,
    site: string,
    token: string
  ) {
    this.boardInfoSelectionJira().click()
    this.boardInfoSelectionClassicJira().click()

    this.boardInfoBoardIdInput().type(boardId)
    this.boardInfoEmailInput().type(email)
    this.boardInfoProjectKeyInput().type(projectKey)
    this.boardInfoSiteInput().type(site)
    this.boardInfoTokenInput().type(token)
    this.boardInfoVerifyButton().click()
    this.waitingForProgressBar()
  }

  fillPipelineToolFieldsInfoAndVerify(token: string) {
    this.pipelineToolTokenInput().type(token)

    this.pipelineToolVerifyButton().click()
  }

  fillSourceControlFieldsInfoAndVerify(token: string) {
    this.sourceControlTokenInput().type(token)

    this.sourceControlVerifyButton().click()
  }

  verifyAndClickNextToMetrics() {
    cy.contains('Verify').click()
    this.pipelineToolVerifyButton().click()
    this.sourceControlVerifyButton().click()
  }

  CancelBackToHomePage() {
    this.backButton().click()
    this.cancelButton().click()
  }

  goMetricsStep() {
    this.goToMetricsStepButton().click()
  }

  waitingForProgressBar() {
    this.progressBar().should('be.visible')
    this.progressBar().should('not.exist')
  }

  exportProjectConfig() {
    this.saveButton().click()
  }
}

const configPage = new Config()
export default configPage
