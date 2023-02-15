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

 Date: 30/12/2022 18:13:38
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for file
-- ----------------------------
DROP TABLE IF EXISTS `file`;
CREATE TABLE `file` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `group_id` bigint(20) unsigned DEFAULT '0' COMMENT '组id',
  `parent_id` bigint(20) unsigned DEFAULT '0' COMMENT '父id',
  `name` varchar(100) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '文件名称',
  `icon` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '文件图标',
  `ext_name` varchar(100) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '扩展名',
  `namespace` varchar(255) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '组件唯一标识',
  `status` int(16) NOT NULL DEFAULT '1' COMMENT '状态',
  `description` varchar(256) COLLATE utf8mb4_bin DEFAULT '' COMMENT '描述',
  `version` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `uri` varchar(255) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '资源路径',
  `delivery_channel` mediumtext COLLATE utf8mb4_bin,
  `template_id` bigint(20) unsigned DEFAULT NULL COMMENT '模板id',
  `team_id` varchar(32) COLLATE utf8mb4_bin DEFAULT NULL COMMENT '当前绑定的teamid',
  `creator_id` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人id',
  `creator_name` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建人名称',
  `updator_id` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '更新人id',
  `updator_name` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '更新人名称',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `update_time` bigint(20) NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_file_info` (`name`,`ext_name`,`namespace`),
  KEY `idx_namespace` (`namespace`),
  KEY `idx_ext_name` (`ext_name`),
  KEY `idx_uri` (`uri`),
  KEY `idx_template_id` (`template_id`),
  KEY `idx_group_id` (`group_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='文件表';

SET FOREIGN_KEY_CHECKS = 1;
