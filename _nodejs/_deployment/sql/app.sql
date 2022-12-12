CREATE TABLE `app` (
  `id` int unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '应用中文名称',
  `namespace` varchar(255) DEFAULT NULL COMMENT 'namespace',
  `icon` varchar(255) DEFAULT NULL COMMENT '应用图标',
  `status` int DEFAULT NULL COMMENT '状态',
  `description` varchar(255) DEFAULT NULL COMMENT '应用描述',
  `install_type` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '安装方式',
  `type` varchar(255) DEFAULT NULL COMMENT '应用类型',
  `install_info` text COMMENT '应用安装信息',
  `version` varchar(255) DEFAULT NULL COMMENT '版本',
  `creator_name` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(255) DEFAULT NULL COMMENT '新建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;