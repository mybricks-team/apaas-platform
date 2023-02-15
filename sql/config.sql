/*
 Navicat Premium Data Transfer

 Source Server         : mybricks-staging
 Source Server Type    : MySQL
 Source Server Version : 80024
 Source Host           : 47.111.7.45:3306
 Source Schema         : mybricks-staging

 Target Server Type    : MySQL
 Target Server Version : 80024
 File Encoding         : 65001

 Date: 30/12/2022 20:27:48
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for apaas_config
-- ----------------------------
DROP TABLE IF EXISTS `apaas_config`;
CREATE TABLE `apaas_config` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `config` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci COMMENT '配置信息',
  `app_namespace` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '关联APP，如果是系统则是保留关键字',
  `version` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT '版本',
  `creator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '创建者ID',
  `creator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '创建者',
  `create_time` bigint NOT NULL COMMENT '创建时间',
  `update_time` bigint NOT NULL COMMENT '更新时间',
  `updator_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '更新者ID',
  `updator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '更新者',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
