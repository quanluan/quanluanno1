<?php
/**
 * 极光VIP专属导航 - PHP 7.4+ 全动态后端 API 引擎
 * 数据库支持: MySQL 5.6+ (全量 PDO 参数化预处理，彻底防范 SQL 注入)
 */

error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', '0');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-HTTP-Method-Override, X-Auth-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 检查数据库配置文件 (根目录或 data 目录)
$configFile = file_exists(__DIR__ . '/config.php') ? __DIR__ . '/config.php' : __DIR__ . '/data/config.php';
$hasMySql = false;
$pdo = null;
$p = 'nav_';
$dbErr = '';

if (file_exists($configFile)) {
    $cfg = @include($configFile);
    if (is_array($cfg) && !empty($cfg['db'])) {
        $db = $cfg['db'];
        $p = $db['prefix'] ?? 'nav_';
        try {
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
            $hasMySql = true;
        } catch (Exception $e) {
            $hasMySql = false;
            $dbErr = $e->getMessage();
        }
    }
}

// 密码散列与令牌
function hashPassword($password, $salt) {
    return hash_pbkdf2("sha256", $password, $salt, 1000, 128);
}

function generateSalt() {
    return bin2hex(random_bytes(12));
}

function generateToken() {
    return bin2hex(random_bytes(32));
}

// 获取请求体
$rawInput = file_get_contents('php://input');
$body = json_decode($rawInput, true);
if (!is_array($body)) {
    $body = [];
}

// 提取当前请求方式 (突破部分主机对 PUT/DELETE 拦截)
$method = strtoupper($_SERVER['REQUEST_METHOD']);
if (isset($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'])) {
    $method = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE']);
} elseif (isset($_GET['_method'])) {
    $method = strtoupper($_GET['_method']);
} elseif (isset($body['_method'])) {
    $method = strtoupper($body['_method']);
}

// 提取请求路由
$route = '';
if (isset($_GET['route']) && !empty($_GET['route'])) {
    $route = '/' . ltrim($_GET['route'], '/');
} elseif (isset($_SERVER['PATH_INFO']) && !empty($_SERVER['PATH_INFO'])) {
    $route = '/' . ltrim($_SERVER['PATH_INFO'], '/');
} else {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    if (strpos($uri, '/api') !== false) {
        $route = substr($uri, strpos($uri, '/api') + 4);
    } elseif (strpos($uri, 'api.php') !== false) {
        $route = substr($uri, strpos($uri, 'api.php') + 7);
    }
}
$route = '/' . trim($route, '/');
if ($route === '/') $route = '';

// 未安装或连接失败处理
if (!$hasMySql) {
    if ($route === '/system/settings' && $method === 'GET') {
        echo json_encode([
            'installed' => false,
            'siteName' => '极光VIP精选资源导航',
            'siteSlogan' => '系统等待初始化安装配置',
            'requireInstall' => true,
            'error' => $dbErr ?: '未检测到数据库配置，请先访问 install.php 完成安装'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    http_response_code(500);
    echo json_encode([
        'error' => 'MySQL 数据库未连接或尚未安装。' . ($dbErr ? " 错误: {$dbErr}" : ' 请访问 install.php 进行配置。'),
        'requireInstall' => true
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 多渠道提取并校验 Token (防 Apache/Nginx FastCGI 剥离 Authorization 头部)
$token = '';
if (!empty($_SERVER['HTTP_AUTHORIZATION']) && preg_match('/Bearer\s+(.*)$/i', $_SERVER['HTTP_AUTHORIZATION'], $m)) {
    $token = trim($m[1]);
} elseif (!empty($_COOKIE['aurora_nav_token'])) {
    $token = trim($_COOKIE['aurora_nav_token']);
} elseif (!empty($_COOKIE['token'])) {
    $token = trim($_COOKIE['token']);
} elseif (!empty($_SERVER['HTTP_X_AUTH_TOKEN'])) {
    $token = trim($_SERVER['HTTP_X_AUTH_TOKEN']);
} elseif (!empty($_GET['token'])) {
    $token = trim($_GET['token']);
} elseif (!empty($_POST['token'])) {
    $token = trim($_POST['token']);
} elseif (!empty($body['token'])) {
    $token = trim($body['token']);
} elseif (function_exists('apache_request_headers')) {
    $hdrs = apache_request_headers();
    $auth = $hdrs['Authorization'] ?? $hdrs['authorization'] ?? $hdrs['X-Auth-Token'] ?? $hdrs['x-auth-token'] ?? '';
    if (preg_match('/Bearer\s+(.*)$/i', $auth, $m)) {
        $token = trim($m[1]);
    } elseif ($auth) {
        $token = trim($auth);
    }
}

// 查询当前会话用户
$currentUser = null;
if ($token) {
    $stmtUser = $pdo->prepare("SELECT u.* FROM `{$p}sessions` s INNER JOIN `{$p}users` u ON s.user_id = u.id WHERE s.token = ? AND u.status = 'active' LIMIT 1");
    $stmtUser->execute([$token]);
    $currentUser = $stmtUser->fetch();
}

function formatUser($user) {
    if (!$user) return null;
    $now = time() * 1000;
    $isExpired = false;
    if (!empty($user['vip_expire_at']) && $user['vip_expire_at'] < $now) {
        $isExpired = true;
    }
    return [
        'id' => $user['id'],
        'username' => $user['username'],
        'nickname' => $user['nickname'] ?? $user['username'],
        'role' => $user['role'],
        'avatar' => $user['avatar'] ?? null,
        'vipTier' => $user['vip_tier'] ?? 'free',
        'vipTierName' => $user['vip_tier_name'] ?? '普通会员',
        'vipExpireAt' => $user['vip_expire_at'] ? intval($user['vip_expire_at']) : null,
        'isExpired' => $isExpired,
        'isLifetime' => empty($user['vip_expire_at']),
        'createdAt' => $user['created_at'] ?? date('c'),
        'status' => $user['status'] ?? 'active'
    ];
}

$isAdmin = ($currentUser && $currentUser['role'] === 'admin');
$isVip = false;
if ($isAdmin) {
    $isVip = true;
} elseif ($currentUser) {
    if (empty($currentUser['vip_expire_at']) || $currentUser['vip_expire_at'] > (time() * 1000)) {
        $isVip = true;
    }
}

// ---------------- 业务接口分发 (全量 PDO 预处理安全查询) ----------------

// 1. 获取全局系统配置 (GET /system/settings)
if ($route === '/system/settings' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM `{$p}settings` LIMIT 1");
    $s = $stmt->fetch() ?: [];
    echo json_encode([
        'installed' => true,
        'siteName' => $s['site_name'] ?? '极光VIP精选资源导航',
        'siteSlogan' => $s['site_slogan'] ?? '专为互联网专业人士甄选的生产力工具与技术枢纽',
        'siteNotice' => $s['site_notice'] ?? '',
        'showNotice' => !empty($s['show_notice']),
        'invitePurchaseUrl' => $s['invite_purchase_url'] ?? 'https://t.me/aurora_vip_nav',
        'invitePurchaseButtonText' => $s['invite_purchase_button_text'] ?? '开通VIP卡密',
        'forceLoginToViewUrl' => !empty($s['force_login_to_view_url']),
        'allowPublicSubmission' => !empty($s['allow_public_submission']),
        'autoApproveSubmission' => !empty($s['auto_approve_submission']),
        'defaultVipDays' => intval($s['default_vip_days'] ?? 30),
        'contactEmail' => $s['contact_email'] ?? 'admin@auroranav.com',
        'telegramGroup' => $s['telegram_group'] ?? '@aurora_vip_nav',
        'backgroundImageUrl' => $s['background_image_url'] ?? '',
        'logoUrl' => $s['logo_url'] ?? ''
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. 当前登录状态检查 (GET /auth/me)
if ($route === '/auth/me' && $method === 'GET') {
    if ($currentUser) {
        echo json_encode([
            'authenticated' => true,
            'user' => formatUser($currentUser)
        ], JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode(['authenticated' => false], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// 3. 会员登录 (POST /auth/login)
if ($route === '/auth/login' && $method === 'POST') {
    $username = strtolower(trim($body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');

    $stmt = $pdo->prepare("SELECT * FROM `{$p}users` WHERE LOWER(username) = ? LIMIT 1");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => '用户名或密码不正确'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    if ($user['status'] === 'banned') {
        http_response_code(403);
        echo json_encode(['error' => '此账号已被封禁，请联系客服'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $hash = hashPassword($password, $user['salt']);
    if ($hash !== $user['password_hash']) {
        http_response_code(401);
        echo json_encode(['error' => '用户名或密码不正确'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $newToken = generateToken();
    $stmtSession = $pdo->prepare("INSERT INTO `{$p}sessions` (`token`, `user_id`, `created_at`) VALUES (?, ?, ?)");
    $stmtSession->execute([$newToken, $user['id'], time() * 1000]);

    echo json_encode([
        'success' => true,
        'token' => $newToken,
        'user' => formatUser($user),
        'message' => '登录成功'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 4. 会员注册 (POST /auth/register - 校验并核销卡密)
if ($route === '/auth/register' && $method === 'POST') {
    $username = trim($body['username'] ?? '');
    $password = (string)($body['password'] ?? '');
    $nickname = trim($body['nickname'] ?? $username);
    $inviteCode = strtoupper(trim($body['inviteCode'] ?? ''));

    if (empty($username) || empty($password) || empty($inviteCode)) {
        http_response_code(400);
        echo json_encode(['error' => '请填写完整用户名、密码及卡密激活码'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(['error' => '密码长度不能少于 6 位'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 查验卡密
    $stmtCode = $pdo->prepare("SELECT * FROM `{$p}invite_codes` WHERE code = ? LIMIT 1");
    $stmtCode->execute([$inviteCode]);
    $codeRecord = $stmtCode->fetch();

    if (!$codeRecord) {
        http_response_code(400);
        echo json_encode(['error' => '无效的卡密激活码，请核实后重试'], JSON_UNESCAPED_UNICODE);
        exit;
    }
    if ($codeRecord['status'] !== 'unused') {
        http_response_code(400);
        echo json_encode(['error' => '该卡密已被使用，请获取新卡密'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 查验用户名重名
    $stmtCheck = $pdo->prepare("SELECT id FROM `{$p}users` WHERE LOWER(username) = ? LIMIT 1");
    $stmtCheck->execute([strtolower($username)]);
    if ($stmtCheck->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => '该用户名已被占用，请更换其他名称'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $now = time() * 1000;
    $vipDays = intval($codeRecord['vip_days']);
    $expireAt = ($vipDays >= 9999) ? null : ($now + $vipDays * 86400 * 1000);
    $salt = generateSalt();
    $hash = hashPassword($password, $salt);
    $newUserId = 'usr-' . substr(uniqid(), 5);

    $pdo->beginTransaction();
    try {
        $stmtInsertUser = $pdo->prepare("INSERT INTO `{$p}users` (
            id, username, nickname, password_hash, salt, role, vip_tier, vip_tier_name, vip_expire_at, invite_code_used, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'user', ?, ?, ?, ?, 'active', NOW())");
        $stmtInsertUser->execute([
            $newUserId, $username, $nickname, $hash, $salt,
            $codeRecord['vip_tier'], $codeRecord['vip_tier_name'], $expireAt, $codeRecord['code']
        ]);

        $stmtUseCode = $pdo->prepare("UPDATE `{$p}invite_codes` SET status = 'used', used_by_user_id = ?, used_by_username = ?, used_at = NOW() WHERE id = ?");
        $stmtUseCode->execute([$newUserId, $username, $codeRecord['id']]);

        $newToken = generateToken();
        $stmtSession = $pdo->prepare("INSERT INTO `{$p}sessions` (`token`, `user_id`, `created_at`) VALUES (?, ?, ?)");
        $stmtSession->execute([$newToken, $newUserId, $now]);

        $pdo->commit();

        $stmtGet = $pdo->prepare("SELECT * FROM `{$p}users` WHERE id = ?");
        $stmtGet->execute([$newUserId]);

        echo json_encode([
            'success' => true,
            'token' => $newToken,
            'user' => formatUser($stmtGet->fetch()),
            'message' => '注册成功，已激活 ' . $codeRecord['vip_tier_name']
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(['error' => '注册失败: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 5. 退出登录 (POST /auth/logout)
if ($route === '/auth/logout' && $method === 'POST') {
    if ($token) {
        $stmt = $pdo->prepare("DELETE FROM `{$p}sessions` WHERE token = ?");
        $stmt->execute([$token]);
    }
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

// 6. 分类列表 (GET /categories)
if (($route === '/categories' || $route === '/admin/categories') && $method === 'GET') {
    $stmt = $pdo->query("SELECT id, name, icon, description, sort_order AS sortOrder FROM `{$p}categories` ORDER BY sort_order ASC");
    echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
    exit;
}

// 7. 新增分类 (POST /admin/categories)
if ($route === '/admin/categories' && $method === 'POST') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $name = trim($body['name'] ?? '');
    if (!$name) {
        http_response_code(400);
        echo json_encode(['error' => '分类名称不能为空']);
        exit;
    }
    $id = 'cat-' . uniqid();
    $icon = trim($body['icon'] ?? 'Folder');
    $desc = trim($body['description'] ?? '');
    $sortOrder = intval($body['sortOrder'] ?? ($body['sort_order'] ?? 1));

    $stmt = $pdo->prepare("INSERT INTO `{$p}categories` (id, name, icon, description, sort_order) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$id, $name, $icon, $desc, $sortOrder]);

    echo json_encode([
        'success' => true,
        'category' => ['id' => $id, 'name' => $name, 'icon' => $icon, 'description' => $desc, 'sortOrder' => $sortOrder]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 8. 修改分类 (PUT /admin/categories/:id)
if (strpos($route, '/admin/categories/') === 0 && $method === 'PUT') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $id = substr($route, strlen('/admin/categories/'));
    $fields = [];
    $params = [];
    if (isset($body['name'])) { $fields[] = 'name = ?'; $params[] = trim($body['name']); }
    if (isset($body['icon'])) { $fields[] = 'icon = ?'; $params[] = trim($body['icon']); }
    if (isset($body['description'])) { $fields[] = 'description = ?'; $params[] = trim($body['description']); }
    if (isset($body['sortOrder'])) { $fields[] = 'sort_order = ?'; $params[] = intval($body['sortOrder']); }
    elseif (isset($body['sort_order'])) { $fields[] = 'sort_order = ?'; $params[] = intval($body['sort_order']); }

    if (!empty($fields)) {
        $params[] = $id;
        $stmt = $pdo->prepare("UPDATE `{$p}categories` SET " . implode(', ', $fields) . " WHERE id = ?");
        $stmt->execute($params);
    }
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

// 9. 删除分类 (DELETE /admin/categories/:id)
if (strpos($route, '/admin/categories/') === 0 && $method === 'DELETE') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $id = substr($route, strlen('/admin/categories/'));
    $stmt = $pdo->prepare("DELETE FROM `{$p}categories` WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

// 10. 站点目录列表 (GET /sites)
if ($route === '/sites' && $method === 'GET') {
    $stmtSettings = $pdo->query("SELECT force_login_to_view_url FROM `{$p}settings` LIMIT 1");
    $set = $stmtSettings->fetch();
    $forceLogin = !empty($set['force_login_to_view_url']);

    if ($isAdmin) {
        $stmt = $pdo->query("SELECT * FROM `{$p}sites` ORDER BY is_pinned DESC, id DESC");
    } else {
        $stmt = $pdo->query("SELECT * FROM `{$p}sites` WHERE status = 'approved' ORDER BY is_pinned DESC, id DESC");
    }
    $rows = $stmt->fetchAll();
    $res = [];

    foreach ($rows as $r) {
        $minVip = $r['min_vip_tier'] ?? 'all';
        $isLocked = false;
        $lockReason = null;

        if ($forceLogin && !$currentUser) {
            $isLocked = true;
            $lockReason = 'require_login';
        } elseif ($minVip !== 'all' && !$isVip) {
            $isLocked = true;
            $lockReason = 'require_vip';
        }

        $tags = json_decode($r['tags'] ?? '[]', true);
        if (!is_array($tags)) {
            $tags = array_filter(array_map('trim', explode(',', $r['tags'] ?? '')));
        }

        $res[] = [
            'id' => $r['id'],
            'title' => $r['title'],
            'url' => $isLocked ? null : $r['url'],
            'description' => $r['description'] ?? '',
            'categoryId' => $r['category_id'],
            'iconUrl' => $r['icon_url'] ?? '',
            'tags' => $tags,
            'isPinned' => !empty($r['is_pinned']),
            'isFeatured' => !empty($r['is_featured']),
            'minVipTier' => $r['min_vip_tier'] ?? 'all',
            'status' => $r['status'],
            'clickCount' => intval($r['click_count'] ?? 0),
            'createdAt' => $r['created_at'],
            'isLocked' => $isLocked,
            'lockReason' => $lockReason
        ];
    }
    echo json_encode($res, JSON_UNESCAPED_UNICODE);
    exit;
}

// 11. 站点点击直达统计与鉴权 (POST /sites/click/:id)
if (strpos($route, '/sites/click/') === 0 && $method === 'POST') {
    $id = substr($route, strlen('/sites/click/'));
    $stmt = $pdo->prepare("SELECT * FROM `{$p}sites` WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $site = $stmt->fetch();

    if (!$site) {
        http_response_code(404);
        echo json_encode(['error' => '目标收录站点不存在'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmtSettings = $pdo->query("SELECT force_login_to_view_url FROM `{$p}settings` LIMIT 1");
    $set = $stmtSettings->fetch();
    $forceLogin = !empty($set['force_login_to_view_url']);

    if ($forceLogin && !$currentUser) {
        http_response_code(403);
        echo json_encode(['error' => '请先登录以访问此收录站点', 'requireLogin' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $minVip = $site['min_vip_tier'] ?? 'all';
    if ($minVip !== 'all' && !$isVip) {
        http_response_code(403);
        echo json_encode(['error' => '该站点为VIP会员专属，请开通对应权限', 'requireVip' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmtUpdate = $pdo->prepare("UPDATE `{$p}sites` SET click_count = click_count + 1 WHERE id = ?");
    $stmtUpdate->execute([$id]);

    echo json_encode(['success' => true, 'url' => $site['url'], 'title' => $site['title']], JSON_UNESCAPED_UNICODE);
    exit;
}

// 12. 前台提交收录 (POST /sites/submit)
if ($route === '/sites/submit' && $method === 'POST') {
    $title = trim($body['title'] ?? '');
    $url = trim($body['url'] ?? '');
    $desc = trim($body['description'] ?? '');
    $catId = trim($body['categoryId'] ?? '');

    if (empty($title) || empty($url) || empty($catId)) {
        http_response_code(400);
        echo json_encode(['error' => '请填写完整网站名称、链接及分类'], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmtSettings = $pdo->query("SELECT auto_approve_submission FROM `{$p}settings` LIMIT 1");
    $set = $stmtSettings->fetch();
    $autoApprove = !empty($set['auto_approve_submission']) || $isAdmin;

    $id = 'site-' . uniqid();
    $tagsJson = json_encode(is_array($body['tags'] ?? null) ? $body['tags'] : [], JSON_UNESCAPED_UNICODE);
    $status = $autoApprove ? 'approved' : 'pending';

    $stmtInsert = $pdo->prepare("INSERT INTO `{$p}sites` (
        id, title, url, description, category_id, icon_url, tags, is_pinned, is_featured, min_vip_tier, status, submitter_id, submitter_name, click_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 'all', ?, ?, ?, 0, NOW())");
    $stmtInsert->execute([
        $id, $title, $url, $desc, $catId, trim($body['iconUrl'] ?? ''),
        $tagsJson, $status, $currentUser ? $currentUser['id'] : null,
        $currentUser ? ($currentUser['nickname'] ?: $currentUser['username']) : '访客提交'
    ]);

    echo json_encode([
        'success' => true,
        'message' => $autoApprove ? '收录成功，已同步展示' : '提交成功，已进入管理员审核队列',
        'site' => [
            'id' => $id, 'title' => $title, 'url' => $url, 'description' => $desc, 'categoryId' => $catId, 'status' => $status
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 13. 广告列表 (GET /ads)
if ($route === '/ads' && $method === 'GET') {
    $stmt = $pdo->query("SELECT id, title, position, image_url AS imageUrl, target_url AS targetUrl, badge_text AS badgeText, description, is_active AS isActive, click_count AS clickCount, sort_order AS sortOrder, created_at AS createdAt FROM `{$p}ads` WHERE is_active = 1 ORDER BY sort_order ASC");
    echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
    exit;
}

// 14. 广告点击统计 (POST /ads/click/:id)
if (strpos($route, '/ads/click/') === 0 && $method === 'POST') {
    $id = substr($route, strlen('/ads/click/'));
    $stmt = $pdo->prepare("UPDATE `{$p}ads` SET click_count = click_count + 1 WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
    exit;
}

// 15. 管理员统计数据 (GET /admin/stats)
if ($route === '/admin/stats' && $method === 'GET') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }

    $totalUsers = $pdo->query("SELECT COUNT(*) FROM `{$p}users`")->fetchColumn();
    $now = time() * 1000;
    $stmtVips = $pdo->prepare("SELECT COUNT(*) FROM `{$p}users` WHERE role = 'admin' OR vip_expire_at IS NULL OR vip_expire_at > ?");
    $stmtVips->execute([$now]);
    $activeVipUsers = $stmtVips->fetchColumn();

    $totalSites = $pdo->query("SELECT COUNT(*) FROM `{$p}sites`")->fetchColumn();
    $pendingSites = $pdo->query("SELECT COUNT(*) FROM `{$p}sites` WHERE status = 'pending'")->fetchColumn();
    $totalCodes = $pdo->query("SELECT COUNT(*) FROM `{$p}invite_codes`")->fetchColumn();
    $unusedCodes = $pdo->query("SELECT COUNT(*) FROM `{$p}invite_codes` WHERE status = 'unused'")->fetchColumn();
    $totalAds = $pdo->query("SELECT COUNT(*) FROM `{$p}ads`")->fetchColumn();
    $totalClicks = $pdo->query("SELECT COALESCE(SUM(click_count), 0) FROM `{$p}sites`")->fetchColumn();

    echo json_encode([
        'totalUsers' => intval($totalUsers),
        'activeVipUsers' => intval($activeVipUsers),
        'totalSites' => intval($totalSites),
        'pendingSites' => intval($pendingSites),
        'totalCodes' => intval($totalCodes),
        'unusedCodes' => intval($unusedCodes),
        'totalAds' => intval($totalAds),
        'totalClicks' => intval($totalClicks),
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 16. 管理员收录 CRUD
if ($route === '/admin/sites' && $method === 'GET') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $stmt = $pdo->query("SELECT * FROM `{$p}sites` ORDER BY is_pinned DESC, id DESC");
    $rows = $stmt->fetchAll();
    $sites = [];
    foreach ($rows as $r) {
        $tags = json_decode($r['tags'] ?? '[]', true);
        if (!is_array($tags)) {
            $tags = array_filter(array_map('trim', explode(',', $r['tags'] ?? '')));
        }
        $sites[] = [
            'id' => $r['id'],
            'title' => $r['title'],
            'url' => $r['url'],
            'description' => $r['description'] ?? '',
            'categoryId' => $r['category_id'],
            'iconUrl' => $r['icon_url'] ?? '',
            'tags' => $tags,
            'isPinned' => !empty($r['is_pinned']),
            'isFeatured' => !empty($r['is_featured']),
            'minVipTier' => $r['min_vip_tier'] ?? 'all',
            'status' => $r['status'],
            'clickCount' => intval($r['click_count'] ?? 0),
            'createdAt' => $r['created_at'],
        ];
    }
    echo json_encode($sites, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($route === '/admin/sites' && $method === 'POST') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $id = 'site-' . uniqid();
    $tagsJson = json_encode(is_array($body['tags'] ?? null) ? $body['tags'] : [], JSON_UNESCAPED_UNICODE);
    $stmt = $pdo->prepare("INSERT INTO `{$p}sites` (
        id, title, url, description, category_id, icon_url, tags, is_pinned, is_featured, min_vip_tier, status, submitter_id, submitter_name, click_count, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())");
    $stmt->execute([
        $id,
        trim($body['title'] ?? ''),
        trim($body['url'] ?? ''),
        trim($body['description'] ?? ''),
        trim($body['categoryId'] ?? ''),
        trim($body['iconUrl'] ?? ''),
        $tagsJson,
        !empty($body['isPinned']) ? 1 : 0,
        !empty($body['isFeatured']) ? 1 : 0,
        $body['minVipTier'] ?? 'all',
        $body['status'] ?? 'approved',
        $currentUser['id'],
        $currentUser['nickname'] ?: $currentUser['username']
    ]);
    echo json_encode(['success' => true, 'id' => $id, 'site' => array_merge($body, ['id' => $id])], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strpos($route, '/admin/sites/') === 0) {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $id = substr($route, strlen('/admin/sites/'));
    if ($method === 'PUT') {
        $fields = [];
        $params = [];
        if (isset($body['title'])) { $fields[] = 'title = ?'; $params[] = trim($body['title']); }
        if (isset($body['url'])) { $fields[] = 'url = ?'; $params[] = trim($body['url']); }
        if (isset($body['description'])) { $fields[] = 'description = ?'; $params[] = trim($body['description']); }
        if (isset($body['categoryId'])) { $fields[] = 'category_id = ?'; $params[] = trim($body['categoryId']); }
        if (isset($body['iconUrl'])) { $fields[] = 'icon_url = ?'; $params[] = trim($body['iconUrl']); }
        if (isset($body['tags'])) {
            $fields[] = 'tags = ?';
            $params[] = json_encode(is_array($body['tags']) ? $body['tags'] : [], JSON_UNESCAPED_UNICODE);
        }
        if (isset($body['isPinned'])) { $fields[] = 'is_pinned = ?'; $params[] = !empty($body['isPinned']) ? 1 : 0; }
        if (isset($body['isFeatured'])) { $fields[] = 'is_featured = ?'; $params[] = !empty($body['isFeatured']) ? 1 : 0; }
        if (isset($body['minVipTier'])) { $fields[] = 'min_vip_tier = ?'; $params[] = $body['minVipTier']; }
        if (isset($body['status'])) { $fields[] = 'status = ?'; $params[] = $body['status']; }

        if (!empty($fields)) {
            $params[] = $id;
            $stmt = $pdo->prepare("UPDATE `{$p}sites` SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($params);
        }
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        exit;
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM `{$p}sites` WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 17. 管理员卡密管理 (GET /admin/invite-codes, POST /generate, PUT, DELETE)
if ($route === '/admin/invite-codes' && $method === 'GET') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $stmt = $pdo->query("SELECT id, code, vip_days AS vipDays, vip_tier AS vipTier, vip_tier_name AS vipTierName, status, used_by_user_id AS usedByUserId, used_by_username AS usedByUsername, used_at AS usedAt, remark, created_at AS createdAt FROM `{$p}invite_codes` ORDER BY id DESC");
    echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($route === '/admin/invite-codes/generate' && $method === 'POST') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $count = max(1, min(100, intval($body['count'] ?? 1)));
    $prefix = strtoupper(trim($body['prefix'] ?? 'VIP'));
    $vipDays = intval($body['vipDays'] ?? 30);
    $vipTier = ($body['vipTier'] ?? 'vip');
    $vipTierName = ($vipDays >= 9999) ? 'SVIP 终身至尊' : "VIP 会员 ({$vipDays}天)";
    $remark = trim($body['remark'] ?? '后台生成');

    $generated = [];
    $stmt = $pdo->prepare("INSERT INTO `{$p}invite_codes` (id, code, vip_days, vip_tier, vip_tier_name, status, remark, created_at) VALUES (?, ?, ?, ?, ?, 'unused', ?, NOW())");

    for ($i = 0; $i < $count; $i++) {
        $randStr = strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
        $randNum = rand(1000, 9999);
        $codeStr = "{$prefix}-{$randStr}-{$randNum}";
        $id = 'inv-' . uniqid() . '-' . $i;

        $stmt->execute([$id, $codeStr, $vipDays, $vipTier, $vipTierName, $remark]);
        $generated[] = [
            'id' => $id,
            'code' => $codeStr,
            'vipDays' => $vipDays,
            'vipTier' => $vipTier,
            'vipTierName' => $vipTierName,
            'status' => 'unused',
            'remark' => $remark,
            'createdAt' => date('c')
        ];
    }
    echo json_encode(['success' => true, 'count' => count($generated), 'codes' => $generated], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strpos($route, '/admin/invite-codes/') === 0) {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $id = substr($route, strlen('/admin/invite-codes/'));
    if ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM `{$p}invite_codes` WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        exit;
    } elseif ($method === 'PUT') {
        $fields = [];
        $params = [];
        if (isset($body['status'])) { $fields[] = 'status = ?'; $params[] = $body['status']; }
        if (isset($body['remark'])) { $fields[] = 'remark = ?'; $params[] = trim($body['remark']); }
        if (!empty($fields)) {
            $params[] = $id;
            $stmt = $pdo->prepare("UPDATE `{$p}invite_codes` SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($params);
        }
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 18. 用户管理 (GET, PUT, DELETE)
if ($route === '/admin/users' && $method === 'GET') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $stmt = $pdo->query("SELECT * FROM `{$p}users` ORDER BY created_at DESC");
    $users = array_map('formatUser', $stmt->fetchAll());
    echo json_encode($users, JSON_UNESCAPED_UNICODE);
    exit;
}

if (strpos($route, '/admin/users/') === 0) {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $id = substr($route, strlen('/admin/users/'));

    if ($method === 'PUT') {
        $stmtUser = $pdo->prepare("SELECT * FROM `{$p}users` WHERE id = ? LIMIT 1");
        $stmtUser->execute([$id]);
        $targetUser = $stmtUser->fetch();
        if (!$targetUser) {
            http_response_code(404);
            echo json_encode(['error' => '用户不存在'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $fields = [];
        $params = [];

        if (!empty($body['setLifetime'])) {
            $fields[] = 'vip_expire_at = NULL';
        } elseif (!empty($body['vipDaysToAdd'])) {
            $cur = (!empty($targetUser['vip_expire_at']) && $targetUser['vip_expire_at'] > (time() * 1000))
                ? $targetUser['vip_expire_at'] : (time() * 1000);
            $newExpire = $cur + intval($body['vipDaysToAdd']) * 86400 * 1000;
            $fields[] = 'vip_expire_at = ?';
            $params[] = $newExpire;
        }

        if (isset($body['vipTier'])) {
            $fields[] = 'vip_tier = ?';
            $params[] = $body['vipTier'];
        }
        if (isset($body['vipTierName'])) {
            $fields[] = 'vip_tier_name = ?';
            $params[] = $body['vipTierName'];
        }
        if (isset($body['role'])) {
            $fields[] = 'role = ?';
            $params[] = $body['role'];
        }
        if (isset($body['status'])) {
            $fields[] = 'status = ?';
            $params[] = $body['status'];
        }

        if (!empty($fields)) {
            $params[] = $id;
            $sql = "UPDATE `{$p}users` SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        $stmtGet = $pdo->prepare("SELECT * FROM `{$p}users` WHERE id = ?");
        $stmtGet->execute([$id]);
        echo json_encode(['success' => true, 'user' => formatUser($stmtGet->fetch())], JSON_UNESCAPED_UNICODE);
        exit;
    } elseif ($method === 'DELETE') {
        if ($id === $currentUser['id']) {
            http_response_code(400);
            echo json_encode(['error' => '不可删除当前登录的管理员账号'], JSON_UNESCAPED_UNICODE);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM `{$p}users` WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 19. 广告管理 CRUD
if ($route === '/admin/ads' && $method === 'GET') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $stmt = $pdo->query("SELECT id, title, position, image_url AS imageUrl, target_url AS targetUrl, badge_text AS badgeText, description, is_active AS isActive, click_count AS clickCount, sort_order AS sortOrder, created_at AS createdAt FROM `{$p}ads` ORDER BY sort_order ASC, id DESC");
    echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
    exit;
}

if ($route === '/admin/ads' && $method === 'POST') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $id = 'ad-' . uniqid();
    $stmt = $pdo->prepare("INSERT INTO `{$p}ads` (id, title, position, image_url, target_url, badge_text, description, is_active, click_count, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, NOW())");
    $stmt->execute([
        $id,
        trim($body['title'] ?? ''),
        $body['position'] ?? 'grid_sponsor',
        trim($body['imageUrl'] ?? ''),
        trim($body['targetUrl'] ?? ''),
        trim($body['badgeText'] ?? '精选特约'),
        trim($body['description'] ?? ''),
        !empty($body['isActive']) ? 1 : 0,
        intval($body['sortOrder'] ?? 1)
    ]);
    echo json_encode(['success' => true, 'id' => $id, 'ad' => array_merge($body, ['id' => $id])], JSON_UNESCAPED_UNICODE);
    exit;
}

if (strpos($route, '/admin/ads/') === 0) {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    $id = substr($route, strlen('/admin/ads/'));
    if ($method === 'PUT') {
        $fields = [];
        $params = [];
        if (isset($body['title'])) { $fields[] = 'title = ?'; $params[] = trim($body['title']); }
        if (isset($body['position'])) { $fields[] = 'position = ?'; $params[] = trim($body['position']); }
        if (isset($body['imageUrl'])) { $fields[] = 'image_url = ?'; $params[] = trim($body['imageUrl']); }
        if (isset($body['targetUrl'])) { $fields[] = 'target_url = ?'; $params[] = trim($body['targetUrl']); }
        if (isset($body['badgeText'])) { $fields[] = 'badge_text = ?'; $params[] = trim($body['badgeText']); }
        if (isset($body['description'])) { $fields[] = 'description = ?'; $params[] = trim($body['description']); }
        if (isset($body['isActive'])) { $fields[] = 'is_active = ?'; $params[] = !empty($body['isActive']) ? 1 : 0; }
        if (isset($body['sortOrder'])) { $fields[] = 'sort_order = ?'; $params[] = intval($body['sortOrder']); }

        if (!empty($fields)) {
            $params[] = $id;
            $stmt = $pdo->prepare("UPDATE `{$p}ads` SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($params);
        }
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        exit;
    } elseif ($method === 'DELETE') {
        $stmt = $pdo->prepare("DELETE FROM `{$p}ads` WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 20. 全局系统配置管理 (GET, PUT - 包含 logoUrl)
if ($route === '/admin/settings') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT * FROM `{$p}settings` LIMIT 1");
        $s = $stmt->fetch() ?: [];
        echo json_encode([
            'siteName' => $s['site_name'] ?? '',
            'siteSlogan' => $s['site_slogan'] ?? '',
            'siteNotice' => $s['site_notice'] ?? '',
            'showNotice' => !empty($s['show_notice']),
            'invitePurchaseUrl' => $s['invite_purchase_url'] ?? '',
            'invitePurchaseButtonText' => $s['invite_purchase_button_text'] ?? '开通VIP卡密',
            'forceLoginToViewUrl' => !empty($s['force_login_to_view_url']),
            'allowPublicSubmission' => !empty($s['allow_public_submission']),
            'autoApproveSubmission' => !empty($s['auto_approve_submission']),
            'defaultVipDays' => intval($s['default_vip_days'] ?? 30),
            'contactEmail' => $s['contact_email'] ?? '',
            'telegramGroup' => $s['telegram_group'] ?? '',
            'backgroundImageUrl' => $s['background_image_url'] ?? '',
            'logoUrl' => $s['logo_url'] ?? ''
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } elseif ($method === 'PUT') {
        $fields = [];
        $params = [];
        if (isset($body['siteName'])) { $fields[] = 'site_name = ?'; $params[] = trim($body['siteName']); }
        if (isset($body['siteSlogan'])) { $fields[] = 'site_slogan = ?'; $params[] = trim($body['siteSlogan']); }
        if (isset($body['siteNotice'])) { $fields[] = 'site_notice = ?'; $params[] = trim($body['siteNotice']); }
        if (isset($body['showNotice'])) { $fields[] = 'show_notice = ?'; $params[] = !empty($body['showNotice']) ? 1 : 0; }
        if (isset($body['invitePurchaseUrl'])) { $fields[] = 'invite_purchase_url = ?'; $params[] = trim($body['invitePurchaseUrl']); }
        if (isset($body['invitePurchaseButtonText'])) { $fields[] = 'invite_purchase_button_text = ?'; $params[] = trim($body['invitePurchaseButtonText']); }
        if (isset($body['forceLoginToViewUrl'])) { $fields[] = 'force_login_to_view_url = ?'; $params[] = !empty($body['forceLoginToViewUrl']) ? 1 : 0; }
        if (isset($body['allowPublicSubmission'])) { $fields[] = 'allow_public_submission = ?'; $params[] = !empty($body['allowPublicSubmission']) ? 1 : 0; }
        if (isset($body['autoApproveSubmission'])) { $fields[] = 'auto_approve_submission = ?'; $params[] = !empty($body['autoApproveSubmission']) ? 1 : 0; }
        if (isset($body['contactEmail'])) { $fields[] = 'contact_email = ?'; $params[] = trim($body['contactEmail']); }
        if (isset($body['telegramGroup'])) { $fields[] = 'telegram_group = ?'; $params[] = trim($body['telegramGroup']); }
        if (isset($body['backgroundImageUrl'])) { $fields[] = 'background_image_url = ?'; $params[] = trim($body['backgroundImageUrl']); }
        if (isset($body['logoUrl'])) { $fields[] = 'logo_url = ?'; $params[] = trim($body['logoUrl']); }

        if (!empty($fields)) {
            $fields[] = 'updated_at = NOW()';
            $sql = "UPDATE `{$p}settings` SET " . implode(', ', $fields) . " WHERE id = 1";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }

        echo json_encode(['success' => true, 'settings' => $body], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 21. 重置初始演示数据 (POST /admin/reset)
if ($route === '/admin/reset' && $method === 'POST') {
    if (!$isAdmin) { http_response_code(403); echo json_encode(['error' => '无管理员权限']); exit; }
    // 重置分类与基础数据
    $pdo->exec("DELETE FROM `{$p}sites` WHERE 1=1");
    $pdo->exec("DELETE FROM `{$p}categories` WHERE 1=1");
    $pdo->exec("DELETE FROM `{$p}ads` WHERE 1=1");
    $pdo->exec("DELETE FROM `{$p}invite_codes` WHERE 1=1");

    // 重新灌入初始化数据
    $pdo->exec("INSERT INTO `{$p}categories` (id, name, icon, description, sort_order) VALUES
        ('cat-ai', 'AI 人工智能', 'Bot', '前沿大语言模型与AI原生生产力工具', 1),
        ('cat-dev', '开发技术', 'Code2', '代码托管、极客开发框架与云端部署平台', 2),
        ('cat-design', '设计灵感', 'Palette', 'UI/UX设计资产、3D渲染与创意灵感库', 3),
        ('cat-tools', '效能工具', 'Wrench', '在线高质压缩、转换与日常实用瑞士军刀', 4),
        ('cat-media', '独立出海', 'Sparkles', '海外流量开拓、出海SaaS与媒体分发渠道', 5),
        ('cat-cross', '跨境支付', 'Globe', '国际支付结算、企业跨境合规与外币收单', 6)");

    $pdo->exec("INSERT INTO `{$p}invite_codes` (id, code, vip_days, vip_tier, vip_tier_name, status, remark, created_at) VALUES
        ('code-1', 'VIP888-2026', 30, 'vip', 'VIP 月度会员', 'unused', '初始激活卡密', NOW())");

    echo json_encode(['success' => true, 'message' => '数据表已完成重新初始化'], JSON_UNESCAPED_UNICODE);
    exit;
}

http_response_code(404);
echo json_encode([
    'error' => 'API endpoint not found',
    'route' => $route,
    'method' => $method
], JSON_UNESCAPED_UNICODE);
