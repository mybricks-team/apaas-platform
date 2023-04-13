DROP TABLE IF EXISTS `apaas_app`;
CREATE TABLE `apaas_app` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `name` varchar(255) DEFAULT NULL COMMENT '应用中文名称',
  `namespace` varchar(255) DEFAULT NULL COMMENT 'namespace',
  `icon` varchar(255) DEFAULT NULL COMMENT '应用图标',
  `status` int DEFAULT NULL COMMENT '状态',
  `description` varchar(255) DEFAULT NULL COMMENT '应用描述',
  `install_type` varchar(255) DEFAULT NULL COMMENT '安装方式',
  `type` varchar(255) DEFAULT NULL COMMENT '应用类型',
  `install_info` text COMMENT '应用安装信息',
  `version` varchar(255) DEFAULT NULL COMMENT '版本',
  `creator_name` varchar(255) DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(255) DEFAULT NULL COMMENT '新建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_config
-- ----------------------------
DROP TABLE IF EXISTS `apaas_config`;
CREATE TABLE `apaas_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `config` mediumtext COMMENT '配置信息',
  `creator_id` varchar(50) NOT NULL COMMENT '创建者ID',
  `creator_name` varchar(50) NOT NULL COMMENT '创建者',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) NOT NULL COMMENT '更新者ID',
  `updator_name` varchar(50) NOT NULL COMMENT '更新者',
  `app_namespace` varchar(255) DEFAULT NULL COMMENT '关联APP',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_file
-- ----------------------------
DROP TABLE IF EXISTS `apaas_file`;
CREATE TABLE `apaas_file` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `parent_id` bigint DEFAULT NULL COMMENT 'parent_id',
  `group_id` bigint DEFAULT NULL COMMENT 'group_id',
  `name` varchar(256) NOT NULL COMMENT 'name',
  `namespace` varchar(256) DEFAULT NULL COMMENT 'namespace',
  `version` varchar(128) DEFAULT NULL COMMENT 'version',
  `ext_name` varchar(128) NOT NULL COMMENT 'ext_name',
  `path` varchar(256) DEFAULT NULL COMMENT 'path',
  `icon` mediumtext COMMENT 'icon',
  `creator_id` varchar(128) NOT NULL COMMENT 'creator_id',
  `creator_name` varchar(128) DEFAULT NULL COMMENT 'creator_name',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  `update_time` bigint DEFAULT NULL COMMENT 'update_time',
  `updator_id` varchar(128) DEFAULT NULL COMMENT 'updator_id',
  `updator_name` varchar(128) DEFAULT NULL COMMENT 'updator_name',
  `description` varchar(256) DEFAULT NULL COMMENT 'description',
  `type` varchar(128) DEFAULT NULL COMMENT 'ExtName 相同时标识类型',
  `share_type` int DEFAULT NULL COMMENT 'share_type',
  `status` int DEFAULT NULL COMMENT 'status',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_file_content
-- ----------------------------
DROP TABLE IF EXISTS `apaas_file_content`;
CREATE TABLE `apaas_file_content` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `file_id` bigint NOT NULL COMMENT 'file_id',
  `content` mediumtext COMMENT 'content',
  `creator_id` varchar(128) NOT NULL COMMENT 'creator_id',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  `update_time` bigint DEFAULT NULL COMMENT 'update_time',
  `version` varchar(50) NOT NULL DEFAULT '1.0.0' COMMENT 'version',
  PRIMARY KEY (`id`),
  KEY `idx_fileId` (`file_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_file_cooperation
-- ----------------------------
DROP TABLE IF EXISTS `apaas_file_cooperation`;
CREATE TABLE `apaas_file_cooperation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `file_id` bigint NOT NULL COMMENT '文件ID',
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '用户ID',
  `update_time` bigint NOT NULL COMMENT '最后一次心跳更新时间',
  `status` int NOT NULL DEFAULT '1' COMMENT '状态，-1-离线，0-在线，1-在线编辑',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_file_pub
-- ----------------------------
DROP TABLE IF EXISTS `apaas_file_pub`;
CREATE TABLE `apaas_file_pub` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `file_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '文件id',
  `version` varchar(50) NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `content` mediumtext NOT NULL COMMENT '文件内容',
  `creator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) NOT NULL DEFAULT '' COMMENT '创建者名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `commit_info` mediumtext NOT NULL COMMENT '发布日志',
  `status` int DEFAULT NULL COMMENT '状态，-1-删除，0-禁用，1-正常',
  `file_content_id` bigint DEFAULT NULL COMMENT '对应保存id',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `type` varchar(50) NOT NULL COMMENT '发布类型，线上、测试、日常等',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_file_id` (`file_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='文件发布表';

-- ----------------------------
-- Table structure for apaas_module_info
-- ----------------------------
DROP TABLE IF EXISTS `apaas_module_info`;
CREATE TABLE `apaas_module_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `origin_file_id` bigint DEFAULT NULL COMMENT '源文件ID',
  `version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '版本',
  `description` varchar(256) DEFAULT NULL,
  `creator_name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `creator_id` varchar(128) DEFAULT NULL,
  `create_time` bigint DEFAULT NULL,
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，0-禁用，1-正常',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_module_pub_info
-- ----------------------------
DROP TABLE IF EXISTS `apaas_module_pub_info`;
CREATE TABLE `apaas_module_pub_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `module_id` bigint DEFAULT NULL,
  `version` varchar(50) DEFAULT NULL,
  `content` mediumtext,
  `ext_name` varchar(256) DEFAULT NULL,
  `file_name` varchar(256) DEFAULT NULL,
  `file_id` bigint DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `creator_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `creator_name` varchar(256) DEFAULT NULL,
  `create_time` bigint DEFAULT NULL,
  `commit_info` mediumtext,
  `status` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_moduleId_version` (`module_id`,`version`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_project_info
-- ----------------------------
DROP TABLE IF EXISTS `apaas_project_info`;
CREATE TABLE `apaas_project_info` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `file_id` bigint DEFAULT NULL COMMENT '项目ID',
  `version` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '项目版本信息',
  `module_info` mediumtext COLLATE utf8mb4_general_ci COMMENT '已安装项目列表',
  `status` int DEFAULT NULL COMMENT '状态',
  `creator_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建者',
  `create_time` bigint DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for apaas_service_pub
-- ----------------------------
DROP TABLE IF EXISTS `apaas_service_pub`;
CREATE TABLE `apaas_service_pub` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `file_id` int DEFAULT NULL COMMENT '文件id',
  `service_id` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '文件内具体服务id',
  `file_pub_id` bigint DEFAULT NULL COMMENT '所属文件发布id',
  `project_id` bigint DEFAULT NULL COMMENT '所属项目ID',
  `content` mediumtext COLLATE utf8mb4_general_ci COMMENT '详细内容',
  `env` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '发布环境',
  `status` int unsigned NOT NULL COMMENT '状态',
  `creator_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建者ID',
  `creator_name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建者名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '服务名称',
  PRIMARY KEY (`id`),
  KEY `idx_fileId_serviceId_env` (`file_id`,`service_id`,`env`),
  KEY `idx_fileid_serviceId_projectid_env` (`file_id`,`service_id`,`project_id`,`env`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for apaas_user
-- ----------------------------
DROP TABLE IF EXISTS `apaas_user`;
CREATE TABLE `apaas_user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `name` varchar(256) DEFAULT NULL COMMENT 'name',
  `email` varchar(256) NOT NULL COMMENT 'email',
  `mobile_phone` varchar(256) DEFAULT NULL COMMENT 'mobile_phone',
  `license_code` varchar(512) DEFAULT NULL COMMENT 'password',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  `update_time` bigint DEFAULT NULL COMMENT 'update_time',
  `status` int NOT NULL DEFAULT '1' COMMENT 'status',
  `role` int NOT NULL DEFAULT '1' COMMENT 'role',
  `avatar` varchar(255) DEFAULT NULL COMMENT '用户头像',
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_user_group
-- ----------------------------
DROP TABLE IF EXISTS `apaas_user_group`;
CREATE TABLE `apaas_user_group` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '组名称',
  `icon` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '组图标',
  `status` int NOT NULL DEFAULT '1' COMMENT '状态，-1-删除，1-正常',
  `creator_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '创建人名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `creator_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '创建人ID',
  `updator_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '更新人名称',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_user_group_relation
-- ----------------------------
DROP TABLE IF EXISTS `apaas_user_group_relation`;
CREATE TABLE `apaas_user_group_relation` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `status` int NOT NULL DEFAULT '1' COMMENT '状态，-1-删除，1-正常',
  `creator_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '创建人名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `creator_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '创建人ID',
  `updator_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '更新人名称',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '更新人ID',
  `role_description` int NOT NULL COMMENT '1-管理，2-编辑， 3-能看到组，-1-被移除 ...',
  `user_group_id` bigint NOT NULL COMMENT '组ID',
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '用户ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for apaas_user_log
-- ----------------------------
DROP TABLE IF EXISTS `apaas_user_log`;
CREATE TABLE `apaas_user_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `type` int NOT NULL COMMENT 'type',
  `user_id` bigint NOT NULL COMMENT 'user_id',
  `user_email` varchar(256) NOT NULL COMMENT 'user_email',
  `log_content` varchar(512) NOT NULL COMMENT 'log_content',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------
-- Table structure for domain_table_action
-- ----------------------------
DROP TABLE IF EXISTS `domain_table_action`;
CREATE TABLE `domain_table_action` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `table_meta` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '表格元信息',
  `action_log` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '表格操作记录',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `domain_meta_id` bigint NOT NULL COMMENT 'domain_meta表记录ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='领域模型操作记录表';

-- ----------------------------
-- Table structure for domain_table_meta
-- ----------------------------
DROP TABLE IF EXISTS `domain_table_meta`;
CREATE TABLE `domain_table_meta` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '表名',
  `domain_file_id` bigint NOT NULL COMMENT '领域模型文件 ID',
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，1-正常',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `project_id` bigint DEFAULT NULL COMMENT '领域模型文件所处项目ID',
  PRIMARY KEY (`id`),
  KEY `idx_domain_file_id` (`domain_file_id`),
  KEY `idx_table_name` (`table_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='领域模型元信息表';

-- ----------------------------
-- Table structure for material_info
-- ----------------------------
DROP TABLE IF EXISTS `material_info`;
CREATE TABLE `material_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `type` varchar(100) NOT NULL DEFAULT '' COMMENT '组件库/组件类型',
  `scope_status` int DEFAULT '0' COMMENT '物料露出状态，-1-私有，0-workspace公开，1-全局公开',
  `namespace` varchar(255) NOT NULL DEFAULT '' COMMENT '组件唯一标识',
  `version` varchar(50) NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `creator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '创建人id',
  `creator_name` varchar(50) NOT NULL DEFAULT '' COMMENT '创建人名',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '更新人id',
  `updator_name` varchar(50) NOT NULL DEFAULT '' COMMENT '更新人名称',
  `icon` mediumtext NOT NULL COMMENT '物料图标',
  `preview_img` mediumtext NOT NULL COMMENT '物料预览图',
  `title` varchar(100) NOT NULL DEFAULT '' COMMENT '物料名称',
  `description` varchar(256) DEFAULT '' COMMENT '描述',
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，0-禁用，1-正常',
  `meta` mediumtext COMMENT '物料额外信息',
  PRIMARY KEY (`id`),
  KEY `idx_namespace` (`namespace`),
  KEY `idx_type` (`type`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='物料表';

-- ----------------------------
-- Table structure for material_pub_info
-- ----------------------------
DROP TABLE IF EXISTS `material_pub_info`;
CREATE TABLE `material_pub_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'id',
  `material_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '文件id',
  `version` varchar(50) NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `content` mediumtext NOT NULL COMMENT '文件内容',
  `creator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) NOT NULL DEFAULT '' COMMENT '创建者名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `commit_info` mediumtext NOT NULL COMMENT '发布日志',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) NOT NULL DEFAULT '' COMMENT '更新人id',
  `updator_name` varchar(50) NOT NULL DEFAULT '' COMMENT '更新人名称',
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，0-禁用，1-正常',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_material_id` (`material_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='物料发布表';


