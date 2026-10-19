-- ========================================================
-- 极光VIP专属导航与精选资源目录 - MySQL 5.6+ 数据库表结构
-- 字符集: utf8mb4 / 引擎: InnoDB (兼容 MySQL 5.6, 5.7, 8.0+)
-- ========================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 系统设置表 (仅存放单行全局配置)
CREATE TABLE IF NOT EXISTS `nav_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `site_name` varchar(191) NOT NULL DEFAULT '极光VIP精选资源导航',
  `site_slogan` varchar(255) DEFAULT '专为互联网专业人士甄选的生产力工具与技术枢纽',
  `site_notice` text,
  `show_notice` tinyint(1) NOT NULL DEFAULT '1',
  `invite_purchase_url` varchar(255) DEFAULT 'https://t.me/aurora_vip_nav',
  `invite_purchase_button_text` varchar(64) DEFAULT '开通VIP卡密',
  `force_login_to_view_url` tinyint(1) NOT NULL DEFAULT '1',
  `allow_public_submission` tinyint(1) NOT NULL DEFAULT '1',
  `auto_approve_submission` tinyint(1) NOT NULL DEFAULT '0',
  `default_vip_days` int(11) NOT NULL DEFAULT '30',
  `contact_email` varchar(191) DEFAULT 'admin@auroranav.com',
  `telegram_group` varchar(191) DEFAULT '@aurora_vip_nav',
  `background_image_url` text,
  `logo_url` text,
  `installed` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. 会员用户表
CREATE TABLE IF NOT EXISTS `nav_users` (
  `id` varchar(64) NOT NULL,
  `username` varchar(64) NOT NULL,
  `nickname` varchar(64) DEFAULT '',
  `password_hash` varchar(191) NOT NULL,
  `salt` varchar(64) NOT NULL,
  `role` varchar(32) NOT NULL DEFAULT 'user',
  `avatar` varchar(255) DEFAULT NULL,
  `vip_tier` varchar(32) NOT NULL DEFAULT 'free',
  `vip_tier_name` varchar(64) NOT NULL DEFAULT '普通会员',
  `vip_expire_at` bigint(20) DEFAULT NULL,
  `invite_code_used` varchar(64) DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'active',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. 卡密邀请码表
CREATE TABLE IF NOT EXISTS `nav_invite_codes` (
  `id` varchar(64) NOT NULL,
  `code` varchar(64) NOT NULL,
  `vip_days` int(11) NOT NULL DEFAULT '30',
  `vip_tier` varchar(32) NOT NULL DEFAULT 'vip',
  `vip_tier_name` varchar(64) NOT NULL DEFAULT 'VIP 月度会员',
  `status` varchar(32) NOT NULL DEFAULT 'unused',
  `used_by_user_id` varchar(64) DEFAULT NULL,
  `used_by_username` varchar(64) DEFAULT NULL,
  `used_at` datetime DEFAULT NULL,
  `remark` varchar(255) DEFAULT '',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_code` (`code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. 目录分类表
CREATE TABLE IF NOT EXISTS `nav_categories` (
  `id` varchar(64) NOT NULL,
  `name` varchar(64) NOT NULL,
  `icon` varchar(64) DEFAULT 'Folder',
  `description` varchar(255) DEFAULT '',
  `sort_order` int(11) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. 收录站点表
CREATE TABLE IF NOT EXISTS `nav_sites` (
  `id` varchar(64) NOT NULL,
  `title` varchar(191) NOT NULL,
  `url` varchar(255) NOT NULL,
  `description` text,
  `category_id` varchar(64) NOT NULL,
  `icon_url` text,
  `tags` text,
  `is_pinned` tinyint(1) NOT NULL DEFAULT '0',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `min_vip_tier` varchar(32) NOT NULL DEFAULT 'all',
  `status` varchar(32) NOT NULL DEFAULT 'approved',
  `submitter_id` varchar(64) DEFAULT NULL,
  `submitter_name` varchar(64) DEFAULT '系统预置',
  `click_count` int(11) NOT NULL DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. 赞助与广告展位表
CREATE TABLE IF NOT EXISTS `nav_ads` (
  `id` varchar(64) NOT NULL,
  `title` varchar(191) NOT NULL,
  `position` varchar(64) NOT NULL DEFAULT 'grid_sponsor',
  `image_url` text,
  `target_url` varchar(255) NOT NULL,
  `badge_text` varchar(64) DEFAULT '精选特约',
  `description` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `click_count` int(11) NOT NULL DEFAULT '0',
  `sort_order` int(11) NOT NULL DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_position` (`position`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. 用户登录会话 Token 表
CREATE TABLE IF NOT EXISTS `nav_sessions` (
  `token` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `created_at` bigint(20) NOT NULL,
  PRIMARY KEY (`token`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
