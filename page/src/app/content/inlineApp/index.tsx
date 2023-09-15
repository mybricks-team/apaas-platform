import React from 'react'

import { Content } from '..'
import { T_App } from '../../AppCtx'
import { MicroApp } from '../../components'

import styles from './index.less'

const InlineApp = ({ app }: { app: T_App }) => {
	
	return (
		<Content title={app.title}>
			<div className={styles.inlineAppContainer}>
				{app.Element ? <app.Element /> : <MicroApp entry={app.homepage} />}
			</div>
		</Content>
	)
}

export default InlineApp
