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

 Date: 30/12/2022 19:54:14
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for file_content
-- ----------------------------
DROP TABLE IF EXISTS `file_content`;
CREATE TABLE `file_content` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `file_id` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '文件id',
  `content` mediumtext COLLATE utf8mb4_bin NOT NULL COMMENT '文件内容对象',
  `content_type` varchar(100) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '文件内容类型',
  `creator_id` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建者名称',
  `status` int(16) NOT NULL COMMENT '状态，-1-删除，0-禁用，1-正常',
  `version` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `file_pub_id` bigint(20) DEFAULT NULL COMMENT '对应发布id',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `update_time` bigint(20) NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_content_type` (`content_type`),
  KEY `idx_file_id` (`file_id`),
  FULLTEXT KEY `idx_content` (`content`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='文件内容表';

SET FOREIGN_KEY_CHECKS = 1;
