import { DOBase } from "@mybricks/rocker-dao";
import { genMainIndexOfDB } from "../utils";

export default class GPTLogDao extends DOBase {
	async create(params: {
		session: string;
		userName: string;
		question: string;
		answer: string;
		judge: number;
		suggestedAnswer: string;
	}) {
		const result = await this.exe<{ insertId: number }>('apaas_gpt_log:insert', {
			...params,
			id: genMainIndexOfDB(),
			createTime: Date.now()
		});

		return { id: result.insertId };
	}

	async update(params: { id: number; judge: number; suggestedAnswer: string; }) {
		await this.exe('apaas_gpt_log:update', params);
	}

	async insertDocs(params: { docs: Array<any> }) {
		await this.exe('apaas_gpt_log:insertDocs', params);
	}
}
