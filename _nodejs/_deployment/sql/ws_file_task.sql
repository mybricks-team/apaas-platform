CREATE TABLE `ws_file_task` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `file_id` bigint NOT NULL,
  `name` varchar(512) CHARACTER SET utf8mb4  NOT NULL,
  `type` varchar(128) CHARACTER SET utf8mb4  NOT NULL,
  `meta_info` text CHARACTER SET utf8mb4 ,
  `content` mediumtext ,
  `creator_id` varchar(128)  NOT NULL,
  `creator_name` varchar(128) CHARACTER SET utf8mb4  NOT NULL,
  `create_time` bigint NOT NULL,
  `running_status` int DEFAULT NULL,
  `status` int DEFAULT NULL,
  `updator_id` varchar(128)  DEFAULT NULL,
  `updator_name` varchar(128) CHARACTER SET utf8mb4  DEFAULT NULL,
  `update_time` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
