import * as moment from "dayjs";
import { Column, DOBase, Mapping } from "@mybricks/rocker-dao";
import { genMainIndexOfDB } from "../utils";

export class AppDO {
  @Column
  id;

  @Column("name")
  name;

  @Column("namespace")
  namespace;

  @Column("icon")
  icon;

  @Column("description")
  description;

  @Column("install_type")
  installType;

  @Column("type")
  type;

  @Column("creator_name")
  creatorName;

  @Column("install_info")
  installInfo;

  @Column("version")
  version;

  _createTime;

  @Column("create_time")
  set createTime(createTime) {
    this._createTime = new Date(createTime).getTime();
  }

  get createTime() {
    return moment(this._createTime).format("YYYY-MM-DD HH:mm:ss");
  }
}

export default class AppDao extends DOBase {
  @Mapping(AppDO)
  public async queryLatestApp(params?: { creatorName }): Promise<Array<AppDO>> {
    return await this.exe<Array<AppDO>>("apaas_app:queryLatestAppList", params);
  }

  @Mapping(AppDO)
  public async getLatestAppByNamespace(namespace: string): Promise<AppDO> {
    const data = await this.exe<AppDO>("apaas_app:getLatestAppByNamespace", { namespace });
    return data ? data[0] : null;
  }
	
  @Mapping(AppDO)
  public async getAppByNamespace_Version(namespace: string, version: string): Promise<Array<AppDO>> {
    return await this.exe<Array<AppDO>>("apaas_app:getAppByNamespace_Version", { namespace, version });
  }

  @Mapping(AppDO)
  public async getAppById(id: number): Promise<Array<AppDO>> {
    return await this.exe<Array<AppDO>>("apaas_app:getAppById", { id });
  }
	
	async insertApp(params: {
		name: string;
		namespace: string;
		icon: string;
		description: string;
		install_type: string;
		type: string;
		install_info: string;
		version: string;
		creator_name: string;
		create_time: number;
	}) {

		return await this.exe<{ insertId: number }>('apaas_app:insert', {
      ...params,
      id: genMainIndexOfDB()
    })
	}
}
