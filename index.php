<?php
/**
 * 极光VIP专属导航 - PHP 7.4+ 入口引擎 (支持 MySQL 5.6+ 虚拟主机)
 */

if (!ob_start("ob_gzhandler")) ob_start();

$configFile = __DIR__ . '/config.php';
$lockFile = __DIR__ . '/install.lock';

// 若尚未安装或缺少数据库配置文件，自动引导至安装向导
if (!file_exists($configFile) && !file_exists($lockFile)) {
    header('Location: install.php');
    exit;
}

$siteName = '极光VIP精选资源导航';
$siteSlogan = '专为互联网专业人士甄选的生产力工具与技术枢纽';
$siteNotice = '';
$showNotice = true;
$bgUrl = '';
$logoUrl = '';

if (file_exists($configFile)) {
    $config = @include($configFile);
    if (is_array($config) && !empty($config['db'])) {
        $db = $config['db'];
        try {
            $p = $db['prefix'] ?? 'nav_';
            $pdo = new PDO(
                "mysql:host={$db['host']};port={$db['port']};dbname={$db['name']};charset={$db['charset']}",
                $db['user'],
                $db['pass'],
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
            $stmt = $pdo->query("SELECT * FROM `{$p}settings` LIMIT 1");
            $row = $stmt->fetch();
            if ($row) {
                $siteName = htmlspecialchars($row['site_name'] ?? $siteName);
                $siteSlogan = htmlspecialchars($row['site_slogan'] ?? $siteSlogan);
                $siteNotice = htmlspecialchars($row['site_notice'] ?? '');
                $showNotice = !empty($row['show_notice']);
                $bgUrl = htmlspecialchars($row['background_image_url'] ?? '');
                $logoUrl = htmlspecialchars($row['logo_url'] ?? '');
            }
        } catch (Exception $e) {
            // 若数据库连接异常，降级检查本地 json
        }
    }
}

// 自动匹配已编译的前端 CSS 和 JS 资源
$cssFiles = glob(__DIR__ . '/assets/*.css');
if (empty($cssFiles)) {
    $cssFiles = glob(__DIR__ . '/dist/assets/*.css');
}
$jsFiles = glob(__DIR__ . '/assets/*.js');
if (empty($jsFiles)) {
    $jsFiles = glob(__DIR__ . '/dist/assets/*.js');
}

$cssPath = !empty($cssFiles) ? './assets/' . basename($cssFiles[0]) : './assets/app.css';
$jsPath = !empty($jsFiles) ? './assets/' . basename($jsFiles[0]) : './assets/app.js';
?>
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><?php echo $siteName; ?> - <?php echo $siteSlogan; ?></title>
    <meta name="description" content="<?php echo $siteSlogan; ?>" />
    <meta property="og:title" content="<?php echo $siteName; ?>" />
    <meta property="og:description" content="<?php echo $siteSlogan; ?>" />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'/></svg>" />
    
    <!-- 动态载入前端编译样式 -->
    <?php if (file_exists(__DIR__ . '/' . ltrim($cssPath, './'))): ?>
      <link rel="stylesheet" crossorigin href="<?php echo $cssPath; ?>" />
    <?php else: ?>
      <link rel="stylesheet" crossorigin href="./assets/app.css" />
    <?php endif; ?>

    <!-- PHP 7.4 虚拟主机接口桥接 -->
    <script>
      window.__PHP_HOST_ACTIVE__ = true;
      window.__PHP_API_BASE__ = 'api.php?route=';
    </script>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background-color: #f8fafc;
        color: #1e293b;
      }
      .app-loader-wrap {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }
      .app-loader-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e2e8f0;
        border-top-color: #4f46e5;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      .app-loader-text {
        font-size: 13px;
        color: #64748b;
        font-weight: 500;
        letter-spacing: 0.025em;
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="app-loader-wrap">
        <div class="app-loader-spinner"></div>
        <div class="app-loader-text">系统加载中...</div>
      </div>
    </div>
    <!-- 载入前端编译模块 -->
    <?php if (file_exists(__DIR__ . '/' . ltrim($jsPath, './'))): ?>
      <script type="module" crossorigin src="<?php echo $jsPath; ?>"></script>
    <?php else: ?>
      <script type="module" crossorigin src="./assets/app.js"></script>
    <?php endif; ?>
  </body>
</html>
