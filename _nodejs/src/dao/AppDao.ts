import * as moment from "dayjs";
import { Column, DOBase, Mapping } from "@mybricks/rocker-dao";

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
  public async queryLatestApp(): Promise<Array<AppDO>> {
    return await this.exe<Array<AppDO>>("app:queryLatestApp", {});
  }
	
  @Mapping(AppDO)
  public async getAppByNamespace_Version(namespace: string, version: string): Promise<Array<AppDO>> {
    return await this.exe<Array<AppDO>>("app:getAppByNamespace_Version", { namespace, version });
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
		return await this.exe('app:insert', params)
	}
}
