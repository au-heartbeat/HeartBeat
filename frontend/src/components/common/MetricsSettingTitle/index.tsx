import { Divider } from '@src/components/common/MetricsSettingTitle/style'
import React from 'react'

const MetricsSettingTitle = (props: { title: string }) => (
  <Divider>
    <span>{props.title}</span>
  </Divider>
)

export default MetricsSettingTitle
