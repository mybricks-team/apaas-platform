CREATE TABLE `apaas_config` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `config` mediumtext CHARACTER SET utf8mb4 COMMENT '配置信息',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 NOT NULL COMMENT '创建者ID',
  `creator_name` varchar(50) CHARACTER SET utf8mb4 NOT NULL COMMENT '创建者',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) CHARACTER SET utf8mb4 NOT NULL COMMENT '更新者ID',
  `updator_name` varchar(50) CHARACTER SET utf8mb4 NOT NULL COMMENT '更新者',
  `app_namespace` varchar(255) CHARACTER SET utf8mb4 DEFAULT NULL COMMENT '关联APP',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;