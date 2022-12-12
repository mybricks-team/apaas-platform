CREATE TABLE `ws_file_task_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `create_time` bigint NOT NULL,
  `content` mediumtext,
  `file_taskid` bigint DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
