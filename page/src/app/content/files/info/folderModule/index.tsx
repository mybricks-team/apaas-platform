import React, {
	FC,
	useMemo,
	useState,
	useEffect,
	useCallback
} from 'react'

import axios from 'axios'
import {message} from 'antd'
import {observe} from '@mybricks/rxui'

import {Card, Title} from '..'
import Ctx from '../../Ctx'

import styles from './index.less'

const FolderModule: FC = () => {
	const ctx = observe(Ctx, {from: 'parents'})
	const [loading, setLoading] = useState(false)
	const [list, setList] = useState(null)

	const getList = useCallback(() => {
		const { id } = ctx.path[ctx?.path?.length - 1]
		axios({
			method: 'get',
			url: `/paas/api/module/publish/getVersionsByFileId?id=${id}&pagtIndex=0&pageSize=20`
		}).then(({data: {data}}) => {
			setList(data)
		})
	}, [])

	useEffect(() => {
		getList()
	}, [])
	
	const publish = useCallback(async () => {
		setLoading(true)
		const latestPath = ctx.path[ctx?.path?.length - 1]
		console.log('latestPath', latestPath, ctx.user)
		try {
			const allFilesRes = (await axios({
				method: 'post',
				url: '/paas/api/module/publish',
				data: {
					fileId: latestPath.id,
					userId: ctx.user.id
				}
			})).data
			
			if (allFilesRes.code === -1) {
				throw new Error(`${allFilesRes.msg ?? '服务异常'}`)
			} else {
				message.success('发布成功')
				getList()
			}
		} catch(e) {
			message.error(`发布失败，${e.message ?? '服务异常'}`)
		}
		setLoading(false)
	}, [])
	
  return (
	  <div className={styles.container}>
			<Title content='模块管理'/>
		  <button className={styles.publish} disabled={loading} onClick={publish}>{loading ? '发布中...' : '发布模块'}</button>
			<PublishList list={list}/>
	  </div>
  )
}

const Version = ({ version, name, time }) => {
	return (
		<div className={styles.version}>
			<div className={styles.row}>
				<div className={styles.ver}>版本：{version}</div>
				<div className={styles.name}>{name}</div>
			</div>
			<div className={`${styles.row} ${styles.time}`}>发布于 {time}</div>
		</div>
	)
}

function PublishList({list}) {
	const RenderList = useMemo(() => {
		if (!list) {
			return <div>加载中...</div>
		}
		if (!list.length) {
			return <div>暂无发布记录</div>
		}
		return list.map((item) => {
			return <Version key={item?.version} version={item?.version} name={item.creatorName} time={item.createTime} />

			return (
				<Card key={item?.version}>
					<div className={styles.item}>
						<div className={styles.label}>版本:</div>
						<div className={styles.value}>{item.version}</div>
					</div>
					<div className={styles.item}>
						<div className={styles.label}>发布人:</div>
						<div className={styles.value}>{item.creatorName}</div>
					</div>
					<div className={styles.item}>
						<div className={styles.label}>发布时间:</div>
						<div className={styles.value}>{item.createTime}</div>
					</div>
				</Card>
			)
		})
	}, [list])
	
	return (
		<div className={styles.listContainer}>
			{RenderList}
		</div>
	)
}

export default FolderModule
