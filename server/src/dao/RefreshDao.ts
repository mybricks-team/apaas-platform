import {DOBase} from '@mybricks/rocker-dao'

export default class RefreshDao extends DOBase {
	public async queryAll(table: string, fieldName?: string[]): Promise<any[]> {
		return await this.exe<any>('apaas_refresh:queryAll', { table, fieldName });
	}
	public async queryCount(table: string): Promise<any[]> {
		return await this.exe<any>('apaas_refresh:queryCount', { table });
	}
	public async update(params: { table: string; field: string; value: number; id: number }): Promise<any[]> {
		return await this.exe<any>('apaas_refresh:update', params);
	}
}