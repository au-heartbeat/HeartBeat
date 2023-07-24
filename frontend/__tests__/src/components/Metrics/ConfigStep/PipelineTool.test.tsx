import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { PipelineTool } from '@src/components/Metrics/ConfigStep/PipelineTool'
import {
  CONFIG_TITLE,
  ERROR_MESSAGE_COLOR,
  MOCK_PIPELINE_URL,
  MOCK_PIPELINE_VERIFY_REQUEST_PARAMS,
  PIPELINE_TOOL_FIELDS,
  PIPELINE_TOOL_TYPES,
  RESET,
  TOKEN_ERROR_MESSAGE,
  VERIFY,
  VERIFY_ERROR_MESSAGE,
  VERIFY_FAILED,
} from '../../../fixtures'
import { Provider } from 'react-redux'
import { setupStore } from '../../../utils/setupStoreUtil'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import userEvent from '@testing-library/user-event'
import { HttpStatusCode } from 'axios'
import { act } from 'react-dom/test-utils'
import { navigateMock } from '../../../../setupTests'
import { ERROR_PAGE_ROUTE } from '@src/constants'

export const fillPipelineToolFieldsInformation = async () => {
  const mockInfo = 'bkua_mockTokenMockTokenMockTokenMockToken1234'
  const tokenInput = screen.getByTestId('pipelineToolTextField').querySelector('input') as HTMLInputElement
  await userEvent.type(tokenInput, mockInfo)

  expect(tokenInput.value).toEqual(mockInfo)
}

let store = null

const server = setupServer(
  rest.get(MOCK_PIPELINE_URL, (req, res, ctx) =>
    res(
      ctx.json({
        pipelineList: [
          {
            name: 'pipelineName',
            id: '0186104b-aa31-458c-a58c-63266806f2fe',
          },
        ],
      }),
      ctx.status(200)
    )
  )
)

describe('PipelineTool', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())
  store = setupStore()
  const setup = () => {
    store = setupStore()
    return render(
      <Provider store={store}>
        <PipelineTool />
      </Provider>
    )
  }
  afterEach(() => {
    store = null
  })

  it('should show pipelineTool title and fields when render pipelineTool component ', () => {
    const { getByRole, getByLabelText } = setup()

    PIPELINE_TOOL_FIELDS.map((field) => {
      expect(getByLabelText(`${field} *`)).toBeInTheDocument()
    })

    expect(getByRole('heading', { name: CONFIG_TITLE.PIPELINE_TOOL })).toBeInTheDocument()
  })

  it('should show default value buildKite when init pipelineTool component', () => {
    const { getByText, queryByText } = setup()
    const pipelineToolType = getByText(PIPELINE_TOOL_TYPES.BUILD_KITE)

    expect(pipelineToolType).toBeInTheDocument()

    const option = queryByText(PIPELINE_TOOL_TYPES.GO_CD)

    expect(option).not.toBeInTheDocument()
  })

  it('should clear other fields information when change pipelineTool Field selection', async () => {
    const { getByRole, getByText } = setup()
    const tokenInput = screen.getByTestId('pipelineToolTextField').querySelector('input') as HTMLInputElement

    await fillPipelineToolFieldsInformation()

    await userEvent.click(getByRole('button', { name: 'Pipeline Tool' }))
    await userEvent.click(getByText(PIPELINE_TOOL_TYPES.GO_CD))
    expect(tokenInput.value).toEqual('')
  })

  it('should clear all fields information when click reset button', async () => {
    const { getByRole, getByText, queryByRole } = setup()
    const tokenInput = screen.getByTestId('pipelineToolTextField').querySelector('input') as HTMLInputElement
    await fillPipelineToolFieldsInformation()

    await userEvent.click(getByText(VERIFY))
    await userEvent.click(getByRole('button', { name: RESET }))

    expect(tokenInput.value).toEqual('')
    expect(getByText(PIPELINE_TOOL_TYPES.BUILD_KITE)).toBeInTheDocument()
    expect(queryByRole('button', { name: RESET })).not.toBeInTheDocument()
    expect(queryByRole('button', { name: VERIFY })).toBeDisabled()
  })

  it('should show detail options when click pipelineTool fields', async () => {
    const { getByRole } = setup()
    await userEvent.click(getByRole('button', { name: 'Pipeline Tool' }))
    const listBox = within(getByRole('listbox'))
    const options = listBox.getAllByRole('option')
    const optionValue = options.map((li) => li.getAttribute('data-value'))

    expect(optionValue).toEqual(Object.values(PIPELINE_TOOL_TYPES))
  })

  it('should enabled verify button when all fields checked correctly given disable verify button', async () => {
    const { getByRole } = setup()
    const verifyButton = getByRole('button', { name: VERIFY })

    expect(verifyButton).toBeDisabled()

    await fillPipelineToolFieldsInformation()

    expect(verifyButton).toBeEnabled()
  })

  it('should show error message and error style when token is empty', async () => {
    const { getByText } = setup()
    await fillPipelineToolFieldsInformation()
    const mockInfo = 'mockToken'
    const tokenInput = screen.getByTestId('pipelineToolTextField').querySelector('input') as HTMLInputElement

    await userEvent.type(tokenInput, mockInfo)
    await userEvent.clear(tokenInput)

    expect(getByText(TOKEN_ERROR_MESSAGE[1])).toBeVisible()
    expect(getByText(TOKEN_ERROR_MESSAGE[1])).toHaveStyle(ERROR_MESSAGE_COLOR)
  })

  it('should show error message and error style when token is invalid', async () => {
    const { getByText } = setup()
    const mockInfo = 'mockToken'
    const tokenInput = screen.getByTestId('pipelineToolTextField').querySelector('input') as HTMLInputElement

    await userEvent.type(tokenInput, mockInfo)

    expect(tokenInput.value).toEqual(mockInfo)

    expect(getByText(TOKEN_ERROR_MESSAGE[0])).toBeInTheDocument()
    expect(getByText(TOKEN_ERROR_MESSAGE[0])).toHaveStyle(ERROR_MESSAGE_COLOR)
  })

  it('should show reset button when verify succeed ', async () => {
    const { getByText } = setup()
    await fillPipelineToolFieldsInformation()
    await userEvent.click(getByText(VERIFY))

    act(() => {
      expect(getByText(RESET)).toBeVisible()
    })
  })

  it('should called verifyPipelineTool method once when click verify button', async () => {
    const { getByRole, getByText } = setup()
    await fillPipelineToolFieldsInformation()
    await userEvent.click(getByRole('button', { name: VERIFY }))

    expect(getByText('Verified')).toBeInTheDocument()
  })

  it('should check loading animation when click verify button', async () => {
    const { getByRole, container } = setup()
    await fillPipelineToolFieldsInformation()
    fireEvent.click(getByRole('button', { name: VERIFY }))

    await waitFor(() => {
      expect(container.getElementsByTagName('span')[0].getAttribute('role')).toEqual('progressbar')
    })
  })

  it('should check error notification show when pipelineTool verify response status is 401', async () => {
    server.use(
      rest.get(MOCK_PIPELINE_URL, (req, res, ctx) =>
        res(ctx.status(HttpStatusCode.Unauthorized), ctx.json({ hintInfo: VERIFY_ERROR_MESSAGE.UNAUTHORIZED }))
      )
    )
    const { getByText, getByRole } = setup()
    await fillPipelineToolFieldsInformation()

    await userEvent.click(getByRole('button', { name: VERIFY }))
    expect(
      getByText(`${MOCK_PIPELINE_VERIFY_REQUEST_PARAMS.type} ${VERIFY_FAILED}: ${VERIFY_ERROR_MESSAGE.UNAUTHORIZED}`)
    ).toBeInTheDocument()
  })

  it('should check error page show when isServerError is true', async () => {
    server.use(rest.get(MOCK_PIPELINE_URL, (req, res, ctx) => res(ctx.status(HttpStatusCode.InternalServerError))))
    const { getByRole } = setup()
    await fillPipelineToolFieldsInformation()

    await userEvent.click(getByRole('button', { name: VERIFY }))

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith(ERROR_PAGE_ROUTE)
    })
  })
})
