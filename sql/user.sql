/*
 Navicat Premium Data Transfer

 Source Server         : fz-pass-staging
 Source Server Type    : MySQL
 Source Server Version : 50726
 Source Host           : public-xm-d-cds-staging-node51.idchb1az1.hb1.kwaidc.com:15933
 Source Schema         : gifshow

 Target Server Type    : MySQL
 Target Server Version : 50726
 File Encoding         : 65001

 Date: 30/12/2022 20:13:06
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `avatar` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `department` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT '',
  `email` varchar(255) COLLATE utf8mb4_bin NOT NULL,
  `status` int(255) NOT NULL,
  `update_time` bigint(20) NOT NULL,
  `create_time` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_userid_status` (`user_id`,`status`)
) ENGINE=InnoDB AUTO_INCREMENT=543 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='用户表';

SET FOREIGN_KEY_CHECKS = 1;
