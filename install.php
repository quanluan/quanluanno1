<?php
/**
 * 极光VIP专属导航 - MySQL 5.6+ 网页可视化安装引导向导
 * 访问: http://你的域名/install.php
 */

error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', '1');

$lockFile = __DIR__ . '/install.lock';
$configFile = __DIR__ . '/config.php';

$isLocked = file_exists($lockFile);
$msg = '';
$msgType = '';

if ($isLocked && $_SERVER['REQUEST_METHOD'] !== 'GET') {
    $msg = '系统已完成安装。如需重新安装，请先登录服务器删除根目录下的 install.lock 文件。';
    $msgType = 'error';
} elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && !$isLocked) {
    $dbHost = trim($_POST['db_host'] ?? 'localhost');
    $dbPort = trim($_POST['db_port'] ?? '3306');
    $dbName = trim($_POST['db_name'] ?? 'nav_db');
    $dbUser = trim($_POST['db_user'] ?? 'root');
    $dbPass = (string)($_POST['db_pass'] ?? '');
    $dbPrefix = trim($_POST['db_prefix'] ?? 'nav_');
    if (!preg_match('/^[a-zA-Z0-9_]+$/', $dbPrefix)) {
        $dbPrefix = 'nav_';
    }

    $siteName = trim($_POST['site_name'] ?? '极光VIP精选资源导航');
    $siteSlogan = trim($_POST['site_slogan'] ?? '专为互联网专业人士甄选的生产力工具与技术枢纽');
    $adminUser = trim($_POST['admin_user'] ?? 'admin');
    $adminPass = (string)($_POST['admin_pass'] ?? 'admin888');
    $inviteUrl = trim($_POST['invite_url'] ?? 'https://t.me/aurora_vip_nav');

    if (empty($dbHost) || empty($dbName) || empty($dbUser)) {
        $msg = '请完整填写数据库连接信息（主机、数据库名与用户名）';
        $msgType = 'error';
    } elseif (empty($adminUser) || strlen($adminPass) < 6) {
        $msg = '管理员账号不能为空且密码不能少于 6 位';
        $msgType = 'error';
    } else {
        try {
            // 1. 测试连接 MySQL 服务端
            $dsnWithoutDb = "mysql:host={$dbHost};port={$dbPort};charset=utf8mb4";
            $pdo = new PDO($dsnWithoutDb, $dbUser, $dbPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);

            // 2. 检查或创建数据库 (过滤非法字符防注入)
            $safeDbName = str_replace('`', '``', $dbName);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$safeDbName}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `{$safeDbName}`");

            // 3. MySQL 5.6 规范建表 (使用安全表前缀)
            $p = $dbPrefix;

            // 表1: 系统配置表
            $pdo->exec("CREATE TABLE IF NOT EXISTS `{$p}settings` (
                `id` int(11) NOT NULL AUTO_INCREMENT,
                `site_name` varchar(191) NOT NULL DEFAULT '极光VIP精选资源导航',
                `site_slogan` varchar(255) DEFAULT '',
                `site_notice` text,
                `show_notice` tinyint(1) NOT NULL DEFAULT '1',
                `invite_purchase_url` varchar(255) DEFAULT '',
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 表2: 用户表
            $pdo->exec("CREATE TABLE IF NOT EXISTS `{$p}users` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 表3: 卡密表
            $pdo->exec("CREATE TABLE IF NOT EXISTS `{$p}invite_codes` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 表4: 分类表
            $pdo->exec("CREATE TABLE IF NOT EXISTS `{$p}categories` (
                `id` varchar(64) NOT NULL,
                `name` varchar(64) NOT NULL,
                `icon` varchar(64) DEFAULT 'Folder',
                `description` varchar(255) DEFAULT '',
                `sort_order` int(11) NOT NULL DEFAULT '1',
                PRIMARY KEY (`id`),
                KEY `idx_sort_order` (`sort_order`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 表5: 站点表
            $pdo->exec("CREATE TABLE IF NOT EXISTS `{$p}sites` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 表6: 广告展位表
            $pdo->exec("CREATE TABLE IF NOT EXISTS `{$p}ads` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 表7: 会话表
            $pdo->exec("CREATE TABLE IF NOT EXISTS `{$p}sessions` (
                `token` varchar(64) NOT NULL,
                `user_id` varchar(64) NOT NULL,
                `created_at` bigint(20) NOT NULL,
                PRIMARY KEY (`token`),
                KEY `idx_user_id` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

            // 4. 使用预处理参数化查询防 SQL 注入，插入初始数据
            // 写入系统设置
            $checkSettings = $pdo->query("SELECT COUNT(*) FROM `{$p}settings`")->fetchColumn();
            if ($checkSettings == 0) {
                $stmt = $pdo->prepare("INSERT INTO `{$p}settings` (
                    `site_name`, `site_slogan`, `site_notice`, `show_notice`, `invite_purchase_url`,
                    `invite_purchase_button_text`, `force_login_to_view_url`, `allow_public_submission`,
                    `auto_approve_submission`, `default_vip_days`, `contact_email`, `telegram_group`,
                    `background_image_url`, `logo_url`, `installed`, `updated_at`
                ) VALUES (?, ?, ?, 1, ?, '开通VIP卡密', 1, 1, 0, 30, 'admin@auroranav.com', '@aurora_vip_nav', '', '', 1, NOW())");
                $stmt->execute([
                    $siteName,
                    $siteSlogan,
                    '欢迎访问极光精选导航，全站收录站点均经严格安全与性能核验。',
                    $inviteUrl
                ]);
            }

            // 写入管理员账号 (SHA256 PBKDF2 安全盐散列)
            $adminSalt = bin2hex(random_bytes(12));
            $adminHash = hash_pbkdf2("sha256", $adminPass, $adminSalt, 1000, 128);
            $checkAdmin = $pdo->prepare("SELECT id FROM `{$p}users` WHERE username = ?");
            $checkAdmin->execute([$adminUser]);
            if ($checkAdmin->fetch()) {
                $updateAdmin = $pdo->prepare("UPDATE `{$p}users` SET password_hash = ?, salt = ?, role = 'admin', vip_tier = 'svip', vip_tier_name = 'SVIP 终身至尊', vip_expire_at = NULL WHERE username = ?");
                $updateAdmin->execute([$adminHash, $adminSalt, $adminUser]);
            } else {
                $insertAdmin = $pdo->prepare("INSERT INTO `{$p}users` (
                    id, username, nickname, password_hash, salt, role, vip_tier, vip_tier_name, vip_expire_at, status, created_at
                ) VALUES (?, ?, '超级管理员', ?, ?, 'admin', 'svip', 'SVIP 终身至尊', NULL, 'active', NOW())");
                $insertAdmin->execute(['user-admin-' . uniqid(), $adminUser, $adminHash, $adminSalt]);
            }

            // 写入初始分类 (若空)
            $checkCat = $pdo->query("SELECT COUNT(*) FROM `{$p}categories`")->fetchColumn();
            if ($checkCat == 0) {
                $cats = [
                    ['cat-ai', 'AI 人工智能', 'Bot', '前沿大语言模型与AI原生生产力工具', 1],
                    ['cat-dev', '开发技术', 'Code2', '代码托管、极客开发框架与云端部署平台', 2],
                    ['cat-design', '设计灵感', 'Palette', 'UI/UX设计资产、3D渲染与创意灵感库', 3],
                    ['cat-tools', '效能工具', 'Wrench', '在线高质压缩、转换与日常实用瑞士军刀', 4],
                    ['cat-media', '独立出海', 'Sparkles', '海外流量开拓、出海SaaS与媒体分发渠道', 5],
                    ['cat-cross', '跨境支付', 'Globe', '国际支付结算、企业跨境合规与外币收单', 6],
                ];
                $catStmt = $pdo->prepare("INSERT INTO `{$p}categories` (id, name, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)");
                foreach ($cats as $c) {
                    $catStmt->execute($c);
                }
            }

            // 写入初始站点 (若空)
            $checkSites = $pdo->query("SELECT COUNT(*) FROM `{$p}sites`")->fetchColumn();
            if ($checkSites == 0) {
                $sites = [
                    [
                        'site-1', 'Google Gemini', 'https://gemini.google.com',
                        '谷歌新一代多模态旗舰大语言模型，支持超长上下文及代码智能生成。',
                        'cat-ai', 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
                        json_encode(['AI 助手', '多模态', '大模型', '谷歌'], JSON_UNESCAPED_UNICODE),
                        1, 1, 'all', 'approved', 1420
                    ],
                    [
                        'site-2', 'DeepSeek 深度求索', 'https://chat.deepseek.com',
                        '开源低成本高智商超强大模型，长推理与深度代码能力行业领先。',
                        'cat-ai', 'https://chat.deepseek.com/favicon.ico',
                        json_encode(['国产大模型', '代码推理', '开源'], JSON_UNESCAPED_UNICODE),
                        1, 1, 'all', 'approved', 1980
                    ],
                    [
                        'site-3', 'GitHub', 'https://github.com',
                        '全球最大的开发者协同与开源代码托管平台，全球程序员必备工具。',
                        'cat-dev', 'https://github.githubassets.com/favicons/favicon.svg',
                        json_encode(['开发社区', 'Git', '开源托管'], JSON_UNESCAPED_UNICODE),
                        1, 0, 'all', 'approved', 1120
                    ],
                    [
                        'site-4', 'Cursor AI 编程编辑器', 'https://www.cursor.com',
                        '基于 VSCode 深度改造的 AI 原生代码编辑器，跨文件全栈智能重构。',
                        'cat-dev', 'https://www.cursor.com/favicon.ico',
                        json_encode(['AI 编程', 'VSCode 增强', 'VIP精选'], JSON_UNESCAPED_UNICODE),
                        1, 1, 'vip', 'approved', 1670
                    ]
                ];
                $siteStmt = $pdo->prepare("INSERT INTO `{$p}sites` (
                    id, title, url, description, category_id, icon_url, tags, is_pinned, is_featured, min_vip_tier, status, click_count, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
                foreach ($sites as $s) {
                    $siteStmt->execute($s);
                }
            }

            // 写入初始广告 (若空)
            $checkAds = $pdo->query("SELECT COUNT(*) FROM `{$p}ads`")->fetchColumn();
            if ($checkAds == 0) {
                $ads = [
                    ['ad-top-1', '全球优质低延迟高防云服务器特惠专区', 'top_banner', '', 'https://cloud.google.com', '精选特约', 'BGP优质线路 / 弹性伸缩极速响应 / 99.99%高可用SLA保障，助力企业出海首选。', 1, 382, 1],
                    ['ad-card-1', '跨境出海全球多币种企业虚拟卡服务', 'grid_sponsor', '', 'https://stripe.com', '官方赞助', '支持海外营销投流扣费、SaaS订阅及海外云主机付款，即开即用汇率透明。', 1, 219, 1]
                ];
                $adStmt = $pdo->prepare("INSERT INTO `{$p}ads` (id, title, position, image_url, target_url, badge_text, description, is_active, click_count, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())");
                foreach ($ads as $a) {
                    $adStmt->execute($a);
                }
            }

            // 写入初始卡密 (若空)
            $checkCodes = $pdo->query("SELECT COUNT(*) FROM `{$p}invite_codes`")->fetchColumn();
            if ($checkCodes == 0) {
                $codeStmt = $pdo->prepare("INSERT INTO `{$p}invite_codes` (id, code, vip_days, vip_tier, vip_tier_name, status, remark, created_at) VALUES (?, ?, ?, ?, ?, 'unused', ?, NOW())");
                $codeStmt->execute(['code-1', 'VIP888-2026', 30, 'vip', 'VIP 月度会员', '初始激活卡密']);
            }

            // 5. 生成 config.php 配置文件
            $configContent = "<?php\n" .
                "// 极光VIP专属导航 - 数据库与系统配置文件\n" .
                "// 生成时间: " . date('Y-m-d H:i:s') . "\n\n" .
                "return [\n" .
                "    'installed' => true,\n" .
                "    'db' => [\n" .
                "        'type' => 'mysql',\n" .
                "        'host' => '" . addslashes($dbHost) . "',\n" .
                "        'port' => '" . addslashes($dbPort) . "',\n" .
                "        'name' => '" . addslashes($dbName) . "',\n" .
                "        'user' => '" . addslashes($dbUser) . "',\n" .
                "        'pass' => '" . addslashes($dbPass) . "',\n" .
                "        'prefix' => '" . addslashes($dbPrefix) . "',\n" .
                "        'charset' => 'utf8mb4',\n" .
                "    ]\n" .
                "];\n";

            $written = @file_put_contents($configFile, $configContent, LOCK_EX);
            if (is_dir(__DIR__ . '/data')) {
                @file_put_contents(__DIR__ . '/data/config.php', $configContent, LOCK_EX);
            }
            @file_put_contents($lockFile, "installed on " . date('c'), LOCK_EX);

            if (!$written) {
                $msg = 'MySQL 数据表创建成功，但无法自动写入根目录 config.php。请检查网站根目录写入权限（建议设置为 755 或 777），或手动创建 config.php 粘贴配置。';
                $msgType = 'error';
            } else {
                $msg = 'MySQL 5.6 数据库安装成功！所有数据表与管理员配置已完成，正在跳转至前台首页...';
                $msgType = 'success';
                header("refresh:2;url=index.php");
            }
        } catch (PDOException $e) {
            $msg = '数据库连接或建表失败: ' . htmlspecialchars($e->getMessage());
            $msgType = 'error';
        } catch (Exception $e) {
            $msg = '安装异常: ' . htmlspecialchars($e->getMessage());
            $msgType = 'error';
        }
    }
}
?>
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>系统安装向导 - MySQL 5.6+ 数据库配置</title>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #0f172a;
      color: #334155;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
      box-sizing: border-box;
    }
    .install-box {
      background: #ffffff;
      width: 100%;
      max-width: 600px;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      border: 1px solid #e2e8f0;
    }
    .install-header {
      background: linear-gradient(135deg, #1e1b4b, #312e81, #0f172a);
      color: white;
      padding: 28px;
    }
    .install-badge {
      display: inline-block;
      padding: 3px 10px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.5);
      color: #34d399;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 10px;
      letter-spacing: 0.05em;
    }
    .install-body {
      padding: 28px;
      font-size: 13px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      margin: 20px 0 12px;
      padding-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title:first-child {
      margin-top: 0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
    @media (max-width: 500px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }
    .form-group {
      margin-bottom: 14px;
    }
    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 6px;
      color: #1e293b;
      font-size: 12px;
    }
    .form-group input {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 13px;
      box-sizing: border-box;
      outline: none;
      transition: all 0.15s ease;
    }
    .form-group input:focus {
      border-color: #4f46e5;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15);
    }
    .form-group .hint {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .btn-submit {
      width: 100%;
      padding: 13px;
      background: #0f172a;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-top: 10px;
    }
    .btn-submit:hover {
      background: #1e293b;
      transform: translateY(-1px);
    }
    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 12px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .alert-success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #047857;
      padding: 12px 14px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 12px;
    }
    .alert-locked {
      background: #fffbeb;
      border: 1px solid #fde68a;
      color: #92400e;
      padding: 16px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="install-box">
    <div class="install-header">
      <div class="install-badge">MySQL 5.6+ 规范安装向导</div>
      <h2 style="margin: 0; font-size: 22px; font-weight: 800;">极光VIP导航系统安装</h2>
      <p style="margin: 6px 0 0; opacity: 0.85; font-size: 12px;">
        仅需填写您的 MySQL 数据库及网站信息，系统将自动执行建表、初始化防SQL注入设置及管理账号。
      </p>
    </div>

    <div class="install-body">
      <?php if ($msg): ?>
        <div class="<?php echo $msgType === 'success' ? 'alert-success' : 'alert-error'; ?>">
          <?php echo $msg; ?>
        </div>
      <?php endif; ?>

      <?php if ($isLocked): ?>
        <div class="alert-locked">
          <strong>系统已完成初始化安装！</strong><br>
          如需重新安装或更换数据库，请通过 FTP 或主机文件管理器删除网站根目录下的 <code>install.lock</code> 文件，然后刷新本页面。
          <div style="margin-top: 14px;">
            <a href="index.php" style="display: inline-block; padding: 8px 16px; background: #0f172a; color: white; text-decoration: none; border-radius: 6px; font-size: 12px; font-weight: 600;">进入网站首页 &rarr;</a>
          </div>
        </div>
      <?php else: ?>
        <form method="post">
          <div class="section-title">
            <span>1. MySQL 数据库连接配置 (兼容 MySQL 5.6 / 5.7 / 8.0)</span>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>数据库服务器 (Host)</label>
              <input type="text" name="db_host" value="<?php echo htmlspecialchars($_POST['db_host'] ?? 'localhost'); ?>" required />
              <div class="hint">一般填写 localhost 或 127.0.0.1</div>
            </div>
            <div class="form-group">
              <label>数据库端口 (Port)</label>
              <input type="text" name="db_port" value="<?php echo htmlspecialchars($_POST['db_port'] ?? '3306'); ?>" required />
              <div class="hint">默认端口 3306</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>数据库库名 (Database Name)</label>
              <input type="text" name="db_name" value="<?php echo htmlspecialchars($_POST['db_name'] ?? 'nav_db'); ?>" required />
              <div class="hint">若不存在将自动尝试创建</div>
            </div>
            <div class="form-group">
              <label>数据表前缀 (Table Prefix)</label>
              <input type="text" name="db_prefix" value="<?php echo htmlspecialchars($_POST['db_prefix'] ?? 'nav_'); ?>" required />
              <div class="hint">默认 nav_，英文字母与下划线</div>
            </div>
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>数据库账号 (Username)</label>
              <input type="text" name="db_user" value="<?php echo htmlspecialchars($_POST['db_user'] ?? 'root'); ?>" required />
            </div>
            <div class="form-group">
              <label>数据库密码 (Password)</label>
              <input type="password" name="db_pass" value="<?php echo htmlspecialchars($_POST['db_pass'] ?? ''); ?>" placeholder="无密码可留空" />
            </div>
          </div>

          <div class="section-title">
            <span>2. 网站基础与管理员设置</span>
          </div>

          <div class="form-group">
            <label>网站名称 (Site Name)</label>
            <input type="text" name="site_name" value="<?php echo htmlspecialchars($_POST['site_name'] ?? '极光VIP精选资源导航'); ?>" required />
          </div>

          <div class="form-group">
            <label>网站副标题 (Slogan)</label>
            <input type="text" name="site_slogan" value="<?php echo htmlspecialchars($_POST['site_slogan'] ?? '专为互联网专业人士甄选的生产力工具与技术枢纽'); ?>" />
          </div>

          <div class="form-group">
            <label>购卡/客服渠道 (Telegram/发卡网/微信)</label>
            <input type="text" name="invite_url" value="<?php echo htmlspecialchars($_POST['invite_url'] ?? 'https://t.me/aurora_vip_nav'); ?>" />
          </div>

          <div class="grid-2">
            <div class="form-group">
              <label>管理员登录用户名</label>
              <input type="text" name="admin_user" value="<?php echo htmlspecialchars($_POST['admin_user'] ?? 'admin'); ?>" required />
            </div>
            <div class="form-group">
              <label>管理员登录密码</label>
              <input type="text" name="admin_pass" value="<?php echo htmlspecialchars($_POST['admin_pass'] ?? 'admin888'); ?>" required />
              <div class="hint">初始建议使用强密码</div>
            </div>
          </div>

          <button type="submit" class="btn-submit">立即执行安装并建表</button>
        </form>
      <?php endif; ?>
    </div>
  </div>
</body>
</html>
