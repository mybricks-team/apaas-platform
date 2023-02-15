use gifshow;

CREATE TABLE `apaas_app` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '应用中文名称',
  `namespace` varchar(255) DEFAULT NULL COMMENT 'namespace',
  `icon` varchar(255) DEFAULT NULL COMMENT '应用图标',
  `status` int DEFAULT NULL COMMENT '状态',
  `description` varchar(255) DEFAULT NULL COMMENT '应用描述',
  `install_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '安装方式',
  `type` varchar(255) DEFAULT NULL COMMENT '应用类型',
  `install_info` text COMMENT '应用安装信息',
  `version` varchar(255) DEFAULT NULL COMMENT '版本',
  `creator_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(255) DEFAULT NULL COMMENT '新建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 表的结构 `apaas_config`
--

CREATE TABLE `apaas_config` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `config` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '配置信息',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '创建者ID',
  `creator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '创建者',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '更新者ID',
  `updator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '更新者',
  `app_namespace` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '关联APP',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 表的结构 `apaas_file`
--

CREATE TABLE `apaas_file` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `parent_id` bigint DEFAULT NULL COMMENT 'parent_id',
  `group_id` bigint DEFAULT NULL COMMENT 'group_id',
  `name` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'name',
  `namespace` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'namespace',
  `version` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'version',
  `ext_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'ext_name',
  `path` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'path',
  `icon` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'icon',
  `creator_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'creator_id',
  `creator_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'creator_name',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  `update_time` bigint DEFAULT NULL COMMENT 'update_time',
  `updator_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'updator_id',
  `updator_name` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'updator_name',
  `description` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'description',
  `type` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'ExtName 相同时标识类型',
  `share_type` int DEFAULT NULL COMMENT 'share_type',
  `status` int DEFAULT NULL COMMENT 'status',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 表的结构 `apaas_file_content`
--

CREATE TABLE `apaas_file_content` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `file_id` bigint NOT NULL COMMENT 'file_id',
  `content` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT 'content',
  `creator_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'creator_id',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  `update_time` bigint DEFAULT NULL COMMENT 'update_time',
  `version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '1.0.0' COMMENT 'version',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 表的结构 `apaas_file_cooperation`
--

CREATE TABLE `apaas_file_cooperation` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `file_id` bigint NOT NULL COMMENT '文件ID',
  `user_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '用户ID',
  `update_time` bigint NOT NULL COMMENT '最后一次心跳更新时间',
  `status` int NOT NULL DEFAULT '1' COMMENT '状态，-1-离线，0-在线，1-在线编辑',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 表的结构 `apaas_file_pub`
--

CREATE TABLE `apaas_file_pub` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `file_id` bigint UNSIGNED NOT NULL DEFAULT '0' COMMENT '文件id',
  `version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `content` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文件内容',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '创建者名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `commit_info` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '发布日志',
  `status` int DEFAULT NULL COMMENT '状态，-1-删除，0-禁用，1-正常',
  `file_content_id` bigint DEFAULT NULL COMMENT '对应保存id',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '发布类型，线上、测试、日常等',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_file_id` (`file_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='文件发布表';

-- --------------------------------------------------------

--
-- 表的结构 `apaas_user`
--

CREATE TABLE `apaas_user` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(256) DEFAULT NULL COMMENT 'name',
  `email` varchar(256) NOT NULL COMMENT 'email',
  `mobile_phone` varchar(256) DEFAULT NULL COMMENT 'mobile_phone',
  `password` varchar(256) NOT NULL COMMENT 'password',
  `license_code` varchar(512) DEFAULT NULL COMMENT 'password',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  `update_time` bigint DEFAULT NULL COMMENT 'update_time',
  `status` int NOT NULL DEFAULT '1' COMMENT 'status',
  `role` int NOT NULL DEFAULT '1' COMMENT 'role',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 表的结构 `apaas_user_log`
--

CREATE TABLE `apaas_user_log` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `type` int NOT NULL COMMENT 'type',
  `user_id` bigint NOT NULL COMMENT 'user_id',
  `user_email` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'user_email',
  `log_content` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT 'log_content',
  `create_time` bigint NOT NULL COMMENT 'create_time',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- 表的结构 `domain_table_action`
--

CREATE TABLE `domain_table_action` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '表记录id',
  `table_meta` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '表格元信息',
  `action_log` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin COMMENT '表格操作记录',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='领域模型操作记录表';

-- --------------------------------------------------------

CREATE TABLE `domain_table_meta` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '表记录id',
  `table_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '表名',
  `domain_file_id` bigint NOT NULL COMMENT '领域模型文件 ID',
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，1-正常',
  `action_log_id` bigint NOT NULL COMMENT '操作记录 ID',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_domain_file_id` (`domain_file_id`),
  KEY `idx_table_name` (`table_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='领域模型元信息表';

-- --------------------------------------------------------

--
-- 表的结构 `material_info`
--

CREATE TABLE `material_info` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '物料记录id',
  `type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '组件库/组件类型',
  `scope_status` int DEFAULT '0' COMMENT '物料露出状态，-1-私有，0-workspace公开，1-全局公开',
  `namespace` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '组件唯一标识',
  `version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '创建人id',
  `creator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '创建人名',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '更新人id',
  `updator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '更新人名称',
  `icon` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '物料图标',
  `preview_img` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '物料预览图',
  `title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '物料名称',
  `description` varchar(256) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '' COMMENT '描述',
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，0-禁用，1-正常',
  `meta` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '物料额外信息',
  PRIMARY KEY (`id`),
  KEY `idx_namespace` (`namespace`),
  KEY `idx_type` (`type`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='物料表';

-- --------------------------------------------------------

--
-- 表的结构 `material_pub_info`
--

CREATE TABLE `material_pub_info` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `material_id` bigint UNSIGNED NOT NULL DEFAULT '0' COMMENT '文件id',
  `version` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `content` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '文件内容',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '创建者名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `commit_info` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '发布日志',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '更新人id',
  `updator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '更新人名称',
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，0-禁用，1-正常',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_material_id` (`material_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COMMENT='物料发布表';
