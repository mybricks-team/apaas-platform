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

 Date: 30/12/2022 20:02:07
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for file_pub
-- ----------------------------
DROP TABLE IF EXISTS `file_pub`;
CREATE TABLE `file_pub` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `file_id` bigint(20) unsigned NOT NULL DEFAULT '0' COMMENT '文件id',
  `version` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '1.0.0' COMMENT '版本号',
  `content` mediumtext COLLATE utf8mb4_bin NOT NULL COMMENT '文件内容',
  `content_type` varchar(100) COLLATE utf8mb4_bin DEFAULT '' COMMENT '文件内容类型',
  `creator_id` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建者id',
  `creator_name` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '创建者名称',
  `status` int(16) DEFAULT NULL COMMENT '状态，-1-删除，0-禁用，1-正常',
  `create_time` bigint(20) NOT NULL COMMENT '创建时间',
  `update_time` bigint(20) DEFAULT NULL COMMENT '更新时间',
  `commit_info` mediumtext COLLATE utf8mb4_bin NOT NULL COMMENT '发布日志',
  `env_type` varchar(50) COLLATE utf8mb4_bin NOT NULL DEFAULT '' COMMENT '发布环境',
  `opt_type` int(11) DEFAULT NULL COMMENT '操作类型 0: 下线；1: 上线',
  `file_content_id` bigint(20) DEFAULT NULL COMMENT '对应保存id',
  `runtime_json` mediumtext COLLATE utf8mb4_bin COMMENT '运行时json数据',
  `edit_total_time` bigint(20) DEFAULT NULL COMMENT '当前版本搭建时长',
  PRIMARY KEY (`id`),
  KEY `idx_creator_info` (`creator_id`,`creator_name`),
  KEY `idx_content_type` (`content_type`),
  KEY `idx_file_id` (`file_id`),
  FULLTEXT KEY `idx_content` (`content`)
) ENGINE=InnoDB AUTO_INCREMENT=46873 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin COMMENT='文件发布表';

SET FOREIGN_KEY_CHECKS = 1;
