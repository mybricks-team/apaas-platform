CREATE TABLE `user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(256) DEFAULT NULL,
  `email` varchar(256) NOT NULL,
  `mobile_phone` varchar(256) DEFAULT NULL,
  `password` varchar(256) NOT NULL,
  `license_code` varchar(512) DEFAULT NULL,
  `create_time` bigint NOT NULL,
  `update_time` bigint DEFAULT NULL,
  `status` int NOT NULL DEFAULT '1',
  `role` int NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;