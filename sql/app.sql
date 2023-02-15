CREATE TABLE `apaas_app` (
  `id`  bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '应用中文名称',
  `namespace` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'namespace',
  `icon` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '应用图标',
  `status` int DEFAULT NULL COMMENT '状态',
  `description` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '应用描述',
  `install_info` text COLLATE utf8mb4_general_ci COMMENT '应用安装信息',
  `scope` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '应用生效范围：全局、内部',
  `version` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '版本',
  `creator_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '创建人名称',
  `create_time` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '新建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;