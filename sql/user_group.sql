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

 Date: 03/01/2023 11:15:34
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for user_group
-- ----------------------------
DROP TABLE IF EXISTS `user_group`;
CREATE TABLE `user_group` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `name` varchar(100) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '组名',
  `admin_id` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '管理员id',
  `icon` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '图标',
  `namespace` varchar(100) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '协作组命名空间',
  `status` int(16) NOT NULL DEFAULT '1' COMMENT '状态',
  `creator_id` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建者名称',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `update_time` bigint(20) DEFAULT NULL COMMENT '更新时间',
  `description` varchar(256) COLLATE utf8mb4_bin DEFAULT '' COMMENT '描述',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_namespace` (`namespace`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_group_info` (`name`,`namespace`,`admin_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='用户组表';

SET FOREIGN_KEY_CHECKS = 1;
