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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
