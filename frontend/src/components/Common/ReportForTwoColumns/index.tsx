import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material'
import { MetricsSettingTitle } from '@src/components/Common/MetricsSettingTitle'
import { Container, Row } from '@src/components/Common/ReportForTwoColumns/style'
import { Fragment } from 'react'
import { ReportDataWithTwoColumns } from '@src/hooks/reportMapper/reportUIDataStructure'

interface ReportForTwoColumnsProps {
  title: string
  data: ReportDataWithTwoColumns[]
}

export const ReportForTwoColumns = ({ title, data }: ReportForTwoColumnsProps) => {
  const renderRows = () => {
    return data.map((row) => (
      <Fragment key={row.id}>
        <Row>
          <TableCell rowSpan={row.valueList.length}>{row.name}</TableCell>
          <TableCell>
            {row.valueList[0]?.unit ? `${row.valueList[0].value}${row.valueList[0].unit}` : row.valueList[0].value}
          </TableCell>
        </Row>
        {row.valueList.slice(1).map((data) => (
          <Row key={row.id}>
            <TableCell>{`${data.value}${data.unit}`}</TableCell>
          </Row>
        ))}
      </Fragment>
    ))
  }

  return (
    <>
      <MetricsSettingTitle title={title} />
      <Container>
        <Table>
          <TableHead>
            <TableRow id={title}>
              <TableCell>Name</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody key={title}>{renderRows()}</TableBody>
        </Table>
      </Container>
    </>
  )
}

export default ReportForTwoColumns
