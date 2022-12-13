CREATE TABLE `apaas_file_content` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `file_id` bigint NOT NULL,
  `content` mediumtext CHARACTER SET utf8mb4 ,
  `creator_id` varchar(128) CHARACTER SET utf8mb4  NOT NULL,
  `create_time` bigint NOT NULL,
  `update_time` bigint DEFAULT NULL,
  `version` varchar(50) CHARACTER SET utf8mb4 NOT NULL DEFAULT '1.0.0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4