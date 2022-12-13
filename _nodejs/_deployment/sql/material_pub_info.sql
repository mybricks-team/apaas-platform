CREATE TABLE `material_pub_info` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `material_id` bigint unsigned NOT NULL DEFAULT '0' COMMENT '文件id',
  `version` varchar(50) CHARACTER SET utf8mb4 NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `content` mediumtext CHARACTER SET utf8mb4  NOT NULL COMMENT '文件内容',
  `creator_id` varchar(50) CHARACTER SET utf8mb4  NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) CHARACTER SET utf8mb4  NOT NULL DEFAULT '' COMMENT '创建者名称',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `commit_info` mediumtext CHARACTER SET utf8mb4  NOT NULL COMMENT '发布日志',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) CHARACTER SET utf8mb4  NOT NULL DEFAULT '' COMMENT '更新人id',
  `updator_name` varchar(50) CHARACTER SET utf8mb4  NOT NULL DEFAULT '' COMMENT '更新人名称',
  `status` int DEFAULT '1' COMMENT '状态，-1-删除，0-禁用，1-正常',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_material_id` (`material_id`),
  FULLTEXT KEY `idx_content` (`content`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='物料发布表';
