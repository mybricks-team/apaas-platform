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

 Date: 03/01/2023 11:06:29
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for file_cooperation
-- ----------------------------
DROP TABLE IF EXISTS `file_cooperation`;
CREATE TABLE `file_cooperation` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `file_id` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '文件id',
  `user_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '用户id',
  `last_time` bigint(20) NOT NULL COMMENT '最后一次心跳时间',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '当前状态',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
