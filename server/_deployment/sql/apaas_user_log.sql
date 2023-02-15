CREATE TABLE `apaas_user_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `type` int NOT NULL,
  `user_id` bigint NOT NULL,
  `user_email` varchar(256) CHARACTER SET utf8mb4 NOT NULL,
  `log_content` varchar(512) CHARACTER SET utf8mb4 NOT NULL,
  `create_time` bigint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;