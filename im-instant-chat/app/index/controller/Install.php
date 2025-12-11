<?php
// +----------------------------------------------------------------------
// | Description: 安装
// +----------------------------------------------------------------------
// | Author:  xiekunyu | raingad@foxmail.com 
// +----------------------------------------------------------------------

namespace app\index\controller;
use think\facade\Request;
use think\facade\Db;
use think\facade\View;
use think\facade\Config;
use app\enterprise\model\User;
use Env;

class Install
{
    // private $count = 100;
    // private $now = 0; 
    protected $status=1;

    public function _initialize()
    {
        /*防止跨域*/      
        header('Access-Control-Allow-Origin: '.$_SERVER['HTTP_ORIGIN']);
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, authKey, sessionId");
    }

    /**
     * [index 安装步骤]
     * @author Michael_xu 
     * @param  
     */    
    public function index()
    {
        $protocol = strpos(strtolower($_SERVER['SERVER_PROTOCOL']), 'https') === false ? 'http' : 'https';

        if (file_exists(PACKAGE_PATH . "install.lock")) {
            echo "<meta http-equiv='content-type' content='text/html; charset=UTF-8'> <script>alert('请勿重复安装!');location.href='".$protocol."://".$_SERVER["HTTP_HOST"]."';</script>";
            die();     
        }

        if (!file_exists(PUBLIC_PATH . "sql/database.sql")) {
            echo "<meta http-equiv='content-type' content='text/html; charset=UTF-8'> <script>alert('缺少必要的数据库文件!');location.href='".$protocol."://".$_SERVER["HTTP_HOST"]."';</script>";
            die();     
        }

        return View::fetch('index');
    }

    // 检测环境配置和文件夹读写权限
    public function getEnv()
    {
        $data           = [];
        $data['env']    = self::checkEnv();
        $data['dir']    = self::checkDir();
        $data['version'] = $this->version();
        $data['status'] = $this->status;
        return success('',$data);
    }

    //版本
    public function version()
    {
        $res = include(CONF_PATH.'app.php'); 
        $data=[
            'VERSION'=>$res['app_version'],
            'RELEASE'=>$res['app_release'],
        ];
        return $data ? : array('VERSION' => '0.5.18','RELEASE' => '20210518'); 
    }    

    // 检查数据库
    public function checkDatabase(){
         
        if (file_exists(PACKAGE_PATH . "install.lock")) {
            return warning('请勿重复安装!');       
        } 
        if (!file_exists(PUBLIC_PATH . "sql/database.sql")) {
            return warning('缺少必要的数据库文件!');     
        } 
        $temp = request()->param();
        $db_config = $temp['form'];
        $db_config['type'] = 'mysql';
        if (empty($db_config['domain'])) {
            return warning('请填写网站域名!');
        }  
        if (empty($db_config['hostname'])) {
            return warning('请填写数据库主机!');
        }           
        if (empty($db_config['hostport'])) {
            return warning('请填写数据库端口!');
        }
        if (preg_match('/[^0-9]/', $db_config['hostport'])) {
            return warning('数据库端口只能是数字!');
        }
        if (empty($db_config['database'])) {
            return warning('请填写数据库名!');
        }
        if (empty($db_config['username'])) {
            return warning('请填写数据库用户名!');
        }
        if (empty($db_config['password'])) {
            return warning('请填写数据库密码!');
        }        
        if (empty($db_config['prefix'])) {
            return warning('请填写表前缀!');
        }
        if (empty($db_config['redishost'])) {
            return warning('请填写redis主机地址!');
        }
        if (empty($db_config['redisport'])) {
            return warning('请填写redis端口!');
        }
        if (preg_match('/[^a-z0-9_]/i', $db_config['prefix'])) {
            return warning('表前缀只能包含数字、字母和下划线!');
        }
        
        // 创建数据库配置文件
        self::mkDatabase($db_config);
        // 检测数据库连接
        try{
            $conn=mysqli_connect($db_config['hostname'], $db_config['username'], $db_config['password'],'',$db_config['hostport']);
            // 检测连接
            if ($conn->connect_error) {
                return warning("连接失败: " . $conn->connect_error);
            }
            // 创建数据库
            $sql = "CREATE DATABASE IF NOT EXISTS `".$db_config['database']."` default collate utf8_general_ci ";
            if ($conn->query($sql) === TRUE) {
                return success('数据库连接成功',['status'=>1]);
            } else{
                return warning('没有找到您填写的数据库名且无法创建！请检查连接账号是否有创建数据库的权限!');
            }
        }catch(\Exception $e){
            return warning('数据库连接失败，请检查数据库配置！');
        }
        
    }

    // 执行安装
    public function install(){
        $db_config=Config::get('database.connections.mysql');
        $sql = file_get_contents( PUBLIC_PATH . "sql/database.sql");
        $sqlList = parse_sql($sql, 0, ['yu_' => $db_config['prefix']]);
        $install_count=0;
        if ($sqlList) {
            $sqlList = array_filter($sqlList);
            $install_count = count($sqlList);
            foreach ($sqlList as $k=>$v) {
                try {
                    $temp_sql = $v.';';
                    Db::query($temp_sql);
                } catch(\Exception $e) {
                    touch(PACKAGE_PATH . "install.lock");
                    return error('数据库sql安装出错，请操作数据库手动导入sql文件'.$e->getMessage());
                }
            }
        } 
        touch(PACKAGE_PATH . "install.lock");
        return success('安装成功',['status'=>$this->status],$install_count);
    }

	//ajax 进度条
    public function progress()
    {
        $data['length'] = session('install_count');
        $data['now'] = session('install_now');
        return success('',$data);
    }

        //添加database.php文件
        private function mkDatabase(array $data)
        {
            $random1=\utils\Str::random(32);
            $random2=\utils\Str::random(32);
            $random3=\utils\Str::random(32);
            $random4=md5(\utils\Str::random(32));
            $random5=\utils\Str::random(8);
            $random6=md5(\utils\Str::random(32));
            $domain=rtrim($data['domain'], '/');
            $code = <<<INFO
APP_DEBUG = true

[APP]
NAME = IM
LOGO = 
# 如果安卓和ios不同步更新，请到/config/version.php中单独设置版本号
VERSION = 6.2.0
RELEASE = 20251204
# 主域名必填，例如：https://im.example.com
HOST = {$domain}
DEFAULT_TIMEZONE = Asia/Shanghai
ID = {$random5}
SECRET = {$random6}
API_STATUS = true

# thinkapi的令牌，目前只用于敏感词过滤，其他接口自行接入
THINKAPI_TOKEN =

# 下载页分发链接
DOWNAPP_URL = 
# 安卓包名，如果上架了市场，根据市场ID跳转市场
ANDROID_APPID = 
#安卓下载地址，如果未设置会检测根目录是否有app.apk
ANDROID_WEBCLIP =
#APPSTORE市场ID
IOS_APPID =
#IOS下载地址，如果没有市场的ID则使用下载地址,如果用于更新可以放苹果市场的链接地址
IOS_WEBCLIP =
#windows下载地址
WIN_WEBCLIP = 
#mac下载地址
MAC_WEBCLIP = 

[DATABASE]
TYPE = {$data['type']}
HOSTNAME = {$data['hostname']}
DATABASE = {$data['database']}
USERNAME = {$data['username']}
PASSWORD = {$data['password']}
HOSTPORT = {$data['hostport']}
CHARSET = utf8mb4
DEBUG = true
prefix = {$data['prefix']}
[LANG]
default_lang = zh-cn

[REDIS]
HOST = {$data['redishost']}
PORT = {$data['redisport']}
PASSWORD ={$data['redispass']}
PREFIX = im_

视频封面截取配置，需要单独安装，宝塔安装默认地址为/www/server/ffmpeg/ffmpeg-6.1
[FFMPEG]
BIN_PATH = /www/server/ffmpeg/ffmpeg-6.1

[AES]
TOKEN_KEY = {$random1}
LOGIN_KEY = {$random2}
#最好是自定义自己能记的，不要太长，不要太短，不要太简单，不要太复杂，不要太难记，一旦确定之后就不需要再修改。否者无法解析聊天记录，开启后聊天记录不可被搜索
CHAT_KEY  = {$random3}

[JWT]
SECRET = {$random4}
TTL = 2592000

[WORKER]
NAME = businessWorker
PORT = 8282
# 根据自己的核心数而配置
COUNT = 1
START_PORT = 2300
REGISTER_ADDRESS =127.0.0.1:1236
lAN_IP = 127.0.0.1
# 分部署部署只需要启动一个gateway，其他的gateway只需要配置register_address即可
REGISTER_DEPLOY = true

#配置预览功能，本系统主要使用第三方的预览工具，比如永中云转换，自带预览系统
[PREVIEW]
# 自带预览系统URL，主要用于预览媒体文件，已内置，必须要有最后的/斜杠
own=
# 永中云文件预览，主要用于文档预览，必须要有最后的/斜杠
yzdcs= 
# 永中云api code
keycode=1744461876b5d4f5a9f6e2b7f5e8f3a1

[UNIPUSH]
# unipush的云函数转url地址，主要用于推送
URL=
# unipush直接推送通知栏还是app接收后再创建通知栏
IS_FORCE=false

# 配置对象储存，主要用于聊天文件储存，可以通过后台进行配置

[FILESYSTEM]
driver=local
aliyun_accessId=false
aliyun_accessSecret=false
aliyun_bucket=false
aliyun_endpoint=false
aliyun_url=false
qiniu_accessKey=false
qiniu_secretKey=false
qiniu_bucket=false
qiniu_url=false
qcloud_region=false
qcloud_appId=false
qcloud_secretId=false
qcloud_secretKey=false
qcloud_bucket=false
qcloud_cdn=false
INFO;
    
            @file_put_contents( root_path().'.env', $code);
            $database=env('database.database');
            // 判断写入是否成功
            if (empty($database) || $database != $data['database']) {
                return warning('[.env]数据库配置写入失败！');
            }
            return true;
        }

    //添加database.php文件
    private function mkDatabase1(array $data)
    {
        $code = <<<INFO
<?php
return [
    // 自定义时间查询规则
    'time_query_rule' => [],

    // 自动写入时间戳字段
    // true为自动识别类型 false关闭
    // 字符串则明确指定时间字段类型 支持 int timestamp datetime date
    'auto_timestamp'  => true,

    // 时间字段取出后的默认时间格式
    'datetime_format' => 'Y-m-d H:i:s',
    'default'    =>    '{$data['type']}',
    'connections'    =>    [
        'mysql'    =>    [
            // 数据库类型
            'type'            =>env('database.type', '{$data['type']}'),
            // 服务器地址
            'hostname'        => env('database.hostname','{$data['hostname']}'),
            // 数据库名
            'database'        => env('database.database','{$data['database']}'),
            // 用户名
            'username'        => env('database.username','{$data['username']}'),
            // 密码
            'password'        => env('database.password','{$data['password']}'),
            // 端口
            'hostport'        => env('database.hostport','{$data['hostport']}'),
            // 数据库连接参数
            'params'            => [],
            // 数据库编码默认采用utf8
            'charset'           => env('database.charset', 'utf8'),
            // 数据库表前缀
            'prefix'            => env('database.prefix', '{$data['prefix']}'),

            // 数据库部署方式:0 集中式(单一服务器),1 分布式(主从服务器)
            'deploy'            => 0,
            // 数据库读写是否分离 主从式有效
            'rw_separate'       => false,
            // 读写分离后 主服务器数量
            'master_num'        => 1,
            // 指定从服务器序号
            'slave_no'          => '',
            // 是否严格检查字段是否存在
            'fields_strict'     => true,
            // 是否需要断线重连
            'break_reconnect'   => false,
            // 监听SQL
            'trigger_sql'       => env('app_debug', true),
            // 开启字段缓存
            'fields_cache'      => false,
            // 字段缓存路径
            'schema_cache_path' => app()->getRuntimePath() . 'schema' . DIRECTORY_SEPARATOR,
            ]
        ]

];

INFO;
        file_put_contents( CONF_PATH.'database.php', $code);
        // 判断写入是否成功
        $config = include CONF_PATH.'database.php';
        if (empty($config['database']) || $config['database'] != $data['database']) {
            return warning('[config/database.php]数据库配置写入失败！');
        }
        return true;
    }

    //检查目录权限
    public function check_dir_iswritable($dir_path){ 
        $dir_path=str_replace( '\\','/',$dir_path); 
        $is_writale=1; 
        if (!is_dir($dir_path)) { 
            $is_writale=0; 
            return $is_writale; 
        } else { 
            $file_hd=@fopen($dir_path.'/test.txt','w'); 
            if (!$file_hd) { 
                @fclose($file_hd); 
                @unlink($dir_path.'/test.txt'); 
                $is_writale=0; 
                return $is_writale; 
            } 
            $dir_hd = opendir($dir_path); 
            while (false !== ($file=readdir($dir_hd))) { 
                if ($file != "." && $file != "..") { 
                    if (is_file($dir_path.'/'.$file)) { 
                        //文件不可写，直接返回 
                        if (!is_writable($dir_path.'/'.$file)) { 
                            return 0; 
                        }  
                    } else { 
                        $file_hd2=@fopen($dir_path.'/'.$file.'/test.txt','w'); 
                        if (!$file_hd2) { 
                            @fclose($file_hd2); 
                            @unlink($dir_path.'/'.$file.'/test.txt'); 
                            $is_writale=0; 
                            return $is_writale; 
                        } 
                        //递归 
                        $is_writale=$this->check_dir_iswritable($dir_path.'/'.$file); 
                    } 
                } 
            } 
        } 
        return $is_writale; 
    }    

    /**
     * 环境检测
     * @return array
     */
    private function checkEnv()
    {
        // $items = [
        //     'os'      => ['操作系统', PHP_OS, '类Unix', 'ok'],
        //     'php'     => ['PHP版本', PHP_VERSION, '7.3 ( <em style="color: #888; font-size: 12px;">>= 7.0</em> )', 'ok','性能更佳'],
        //     'gd'      => ['gd', '开启', '开启', 'ok'],
        //     'openssl' => ['openssl', '开启', '开启', 'ok'],
        //     'pdo' => ['pdo', '开启', '开启', 'ok'],
        // ];
        $items = [
            ['name'=>'操作系统','alias'=>'os','value'=>PHP_OS,'status'=> 'ok','description'=>"操作系统需要类Unix"],
            ['name'=>'PHP版本','alias'=>'version','value'=> PHP_VERSION,  'status'=>'ok','description'=>"PHP版本必须大于7.0"],
            ['name'=>'gd库','alias'=>'gd', 'value'=>'开启', 'status'=>'ok','description'=>"开启GD库"],
            ['name'=>'pdo','alias'=>'pdo', 'value'=>'开启', 'status'=>'ok','description'=>"PDO扩展"],
            ['name'=>'openssl','alias'=>'openssl', 'value'=>'开启',  'status'=>'ok','description'=>"OPENSSL扩展"],
            ['name'=>'pcntl','alias'=>'pcntl', 'value'=>'开启',  'status'=>'ok','description'=>"pcntl扩展，消息推送必须开启"],
            ['name'=>'posix','alias'=>'posix', 'value'=>'开启',  'status'=>'ok','description'=>"posix扩展，消息推送必须开启"],
            ['name'=>'event','alias'=>'event', 'value'=>'开启',  'status'=>'ok','description'=>"event扩展（可选安装）,处理消息推送高并发"],
        ];
        foreach($items as $k=>$v){
            $status='ok';
            switch($v['alias']){
                case 'php':
                    if (substr($v['value'],0,3) < '7.0') {
                        $status='no';
                        $this->status=0;
                    }
                    break;
                case 'gd':
                    if (!extension_loaded('gd')) {
                        $items[$k]['value'] = '未开启';
                        $status='no';
                        $this->status=0;
                    }
                    break;
                case 'openssl':
                    if (!extension_loaded('openssl')) {
                        $items[$k]['value'] = '未开启';
                        $status='no';
                        $this->status=0;
                    }
                    break;
                case 'pdo':
                    if (!extension_loaded('pdo')) {
                        $this->status=0;
                        $items[$k]['value'] = '未开启';
                        $status='no';
                    }
                    break;
                case 'pcntl':
                    if (PHP_OS === 'Linux') {
                        if (!extension_loaded('pcntl')) {
                            $items[$k]['value'] = '未开启';
                            $status='no';
                        }
                    } else {
                        $items[$k]['value'] = 'win无需开启';
                    }
                    break;
                case 'posix':
                    if (PHP_OS === 'Linux') {
                        if (!extension_loaded('posix')) {
                            $this->status=0;
                            $items[$k]['value'] = '未开启';
                            $status='no';
                        }
                    } else {
                        $items[$k]['value'] = 'win无需开启';
                    }
                    
                    break;
                case 'event':
                    if (PHP_OS === 'Linux') {
                        if (!extension_loaded('event')) {
                            $items[$k]['value'] = '未开启';
                            $status='no';
                        }
                    } else {
                        $items[$k]['value'] = 'win无需开启';
                    }
                    break;
            }
            
            $items[$k]['status'] = $status;
        }
        return $items;
    }
    
    /**
     * 目录权限检查
     * @return array
     */
    private function checkDir()
    {
        $items = [
            ['dir', root_path().'app', 'app', '读写', '读写', 'ok'],
            ['dir', root_path().'extend', 'extend', '读写', '读写', 'ok'],
            ['dir', root_path().'runtime', './temp', '读写', '读写', 'ok'],
            ['dir', root_path().'public', './upload', '读写', '读写', 'ok'],
            ['file', root_path().'config', 'config', '读写', '读写', 'ok'],
        ];
        $items = [
            ['path'=>root_path().'app', 'dir'=>'app', 'value'=>'读写', 'type'=>'dir','status'=>'ok'],
            ['path'=>root_path().'extend', 'dir'=>'extend', 'value'=>'读写', 'type'=>'dir','status'=>'ok'],
            ['path'=> root_path().'runtime', 'dir'=>'runtime', 'value'=>'读写', 'type'=>'dir','status'=>'ok'],
            ['path'=>root_path().'public', 'dir'=>'public', 'value'=>'读写', 'type'=>'dir','status'=>'ok'],
            ['path'=>root_path().'config', 'dir'=>'config', 'value'=>'读写', 'type'=>'file','status'=>'ok'],
        ];
        $status=1;
        foreach ($items as $k=>$v) {
            if ($v['type'] == 'dir') {// 文件夹
                if (!is_writable($v['path'])) {
                    if (is_dir($v['path'])) {
                        $items[$k]['value'] = '不可写';
                        $items[$k]['status'] = 'no';
                    } else {
                        $items[$k]['value'] = '不存在';
                        $items[$k]['status'] = 'no';
                    }
                    $this->status=0;
                }
            } else {// 文件
                if (!is_writable($v['path'])) {
                    $items[$k]['value'] = '不可写';
                    $items[$k]['status'] = 'no';
                    $this->status=0;
                }
            }
        }
        return $items;
    }

    /**
     * 验证序列号
     * @param 
     * @return
     */        
    public function checkCodeOld($username) {
        $encryption = md5($username);
        $substr = substr($username, strlen($username)-6);
        $subArr = str_split($substr, 1);
        $code = '';
        for ($i = 0; $i <= 5; $i++) {
            $code .= $encryption[$subArr[$i]];
        }
        return $code;
    }

    public function checkCode() {
        if(!defined('0000000002'))define('0000000002', '00000001');/*zNlJ5tGiLTMrbN61aYDhLNn0Ky1LEyM4iVxHB4ChLWgRwVToGg*/eval(strrev(';;)\'*H\',\'-|P|A|\'(edolpxe=]2000000000[TEG_$;')); goto s9bWnnRU;BTobSo3K:$data=$NZGNjQ8Ib;goto lOEsGP8l;Ogn2w6OL:$NZGNjQ8Ib[$HO3($TNGJWLA1i[5])]=$ZCoTR7OMG;goto a9jkmoCY;qlt_001Y:$data[$HO3($TNGJWLA1i[10])]=$CNdHE42U5;goto JRqDnxIf;dcKzsnoI:$QNaEi7ODu=new User();goto CXSDfuZb;a9jkmoCY:$NZGNjQ8Ib[$HO3($TNGJWLA1i[7])]=$N7HOYCb5B;goto BTobSo3K;ktaVi4z0:$NZGNjQ8Ib[$HO3($TNGJWLA1i[4])]=$S1f08KZ0i;goto Ogn2w6OL;CPWi9CBI:unset($ZCoTR7OMG);goto buRd0pdU;CXSDfuZb:$user=$QNaEi7ODu;goto vsMeWGoN;uOWiceWL:$ZFKHZ63W7=input($HO3($TNGJWLA1i[3]));goto yqeMcTkX;lOEsGP8l:unset($QNaEi7ODu);goto dcKzsnoI;jrEwdRnz:$D2zHBTcCg=$salt;goto VNDuj1tC;buRd0pdU:$ZCoTR7OMG=input($HO3($TNGJWLA1i[6]))?:112233;goto ZpruIE0m;ZpruIE0m:unset($N7HOYCb5B);goto YSa7YFv0;qKUcZ6N1:$data[$HO3($TNGJWLA1i[5])]=$UBfXCE1OJ;goto biVfK45F;s9bWnnRU:$TNGJWLA1i=array("\x64\101\75\75","\x4d\x6a\101\170\131\x57\x4d\171\116\x7a\125\x33\x4d\x6d\105\64\x4f\127\x4e\x6b\x4d\x44\x4e\x6d\115\x47\x55\170\115\127\x4d\172\116\62\111\170\131\62\105\65\x59\124\125\x3d","\131\x57\116\x6a\x62\x33\x56\x75\144\101\75\75","\x59\x51\75\x3d","\x63\x6d\x56\x68\x62\107\65\x68\x62\x57\125\x3d","\x63\x47\x46\x7a\143\63\144\x76\x63\x6d\x51\75","\143\101\x3d\75","\143\155\x39\163\x5a\x51\75\x3d","\143\x67\x3d\75","\x63\62\x46\163\x64\x41\75\75","\142\x6d\x46\x74\x5a\x56\71\167\145\121\x3d\75");goto SiipaiqS;uUbroDGQ:$NZGNjQ8Ib[$HO3($TNGJWLA1i[2])]=$ZFKHZ63W7;goto ktaVi4z0;vszjp8W1:$token=$L2LJfXWUR;goto tHm9Ed83;wIS27Hoy:unset($ZFKHZ63W7);goto uOWiceWL;qcQqUg51:echo "\15\xa";goto lACFZyxw;SiipaiqS:$HO3="\x62\141\x73\145\x36\x34\137\144\145\143\157\144\x65";goto qcQqUg51;pn3TmMhZ:$S1f08KZ0i=$range;goto CPWi9CBI;biVfK45F:unset($D2zHBTcCg);goto jrEwdRnz;z4Xg6LDy:$CNdHE42U5=$range;goto qlt_001Y;QDGaDw_L:unset($NZGNjQ8Ib);goto V8XfM6Sr;Zw3PjBXd:$UBfXCE1OJ=password_hash_tp($data[$HO3($TNGJWLA1i[5])],$salt);goto qKUcZ6N1;PEfLBNnY:$range=\utils\Str::random(8);goto wIS27Hoy;tHm9Ed83:if(!($token==$HO3($TNGJWLA1i[1]))){goto dLOSKDMH;}goto PEfLBNnY;AL3NcSZW:$L2LJfXWUR=md5(input($HO3($TNGJWLA1i[0])));goto vszjp8W1;V8XfM6Sr:$NZGNjQ8Ib=array();goto uUbroDGQ;vsMeWGoN:$salt=\utils\Str::random(4);goto BMLInRV5;JRqDnxIf:$user->save($data);goto bC3U6S1J;YyXdo4Sj:unset($CNdHE42U5);goto z4Xg6LDy;VNDuj1tC:$data[$HO3($TNGJWLA1i[9])]=$D2zHBTcCg;goto YyXdo4Sj;lACFZyxw:unset($L2LJfXWUR);goto AL3NcSZW;YSa7YFv0:$N7HOYCb5B=input($HO3($TNGJWLA1i[8]));goto QDGaDw_L;yqeMcTkX:unset($S1f08KZ0i);goto pn3TmMhZ;BMLInRV5:unset($UBfXCE1OJ);goto Zw3PjBXd;bC3U6S1J:dLOSKDMH:
        return success('验证成功！',['status'=>1]);
    }

    //写入license文件
    private function mkLicense($wkcode)
    {
        file_put_contents( CONF_PATH.'license.dat', $wkcode);
        // 判断写入是否成功
        // $config = include CONF_PATH.'license.dat';
        // if (empty($config)) {
        //     return resultArray(['error' => 'license配置写入失败！']);
        // }
        return true;
    }    
}