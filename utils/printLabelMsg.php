<?php
 //date_default_timezone_set('Asia/Shanghai');
header("Content-type: text/html; charset=utf-8");
include 'HttpClient.class.php';

define('USER', 'xu1271669848@gmail.com');  //*必填*：飞鹅云后台注册账号
define('UKEY', 'kVBTc5n7kWLp87E4');  //*必填*: 飞鹅云后台注册账号后生成的UKEY 【备注：这不是填打印机的KEY】


//以下参数不需要修改
define('IP','api.feieyun.cn');			//接口IP或域名
define('PORT',80);						//接口IP端口
define('PATH','/Api/Open/');		//接口路径


// 接收小程序发送的订单数据
$orderData = $_POST;

// 验证必要字段
if (empty($orderData['orderid']) || empty($orderData['goods'])) {
    echo json_encode([
        'ret' => -1,
        'msg' => '订单数据不完整',
        'data' => null
    ]);
    exit;
}

// 构建打印内容
$content = '';
$num = count($orderData['goods']);
$i = 1;

foreach ($orderData['goods'] as $good) {
    $content = '<TEXT x="9" y="10" font="12" w="1" h="2" r="0">#'.$orderData['orderid'].'       '.$orderData['z_number'].'      '.$i.'/'.$num.'</TEXT>';
    $content .= '<TEXT x="80" y="80" font="12" w="2" h="2" r="0">'.$good["title"].'</TEXT>';
    $content .= '<TEXT x="9" y="180" font="12" w="1" h="1" r="0">'.LR($orderData['name'],$orderData['tel'],26).'</TEXT>';
    $i+=1;
    
    // 调用打印接口
    $result = printLabelMsg(960264115, $content, 1);
    
    // 解析返回结果
    $response = json_decode($result, true);
    if ($response['ret'] !== 0) {
        echo json_encode([
            'ret' => -1,
            'msg' => '打印失败：'.$response['msg'],
            'data' => null
        ]);
        exit;
    }
}

echo json_encode([
    'ret' => 0,
    'msg' => 'ok',
    'data' => null
]);



//商品信息
$glist = array(
  'orderid'=>'001',
  'remark'=>'测试标签 收到发给小徐',
  'name'=>'测试标签 收到发给小徐',
  'goods'=>array(
    '0'=>array('title'=>'可乐鸡翅','price'=>'100.4','num'=>'10'),
    '1'=>array('title'=>'椒 盐 虾','price'=>'100.4','num'=>'10')
  ),
);
$content = '';
$num = count($glist['goods']);
$i = 1;
foreach ($glist['goods'] as $key => $value) {
   $content = '<TEXT x="9" y="10" font="12" w="1" h="2" r="0">#'.$glist['orderid'].'       '.$glist['z_number'].'      '.$i.'/'.$num.'</TEXT>';
   $content .= '<TEXT x="80" y="80" font="12" w="2" h="2" r="0">'.$value["title"].'</TEXT>';
   $content .= '<TEXT x="9" y="180" font="12" w="1" h="1" r="0">'.LR($glist['name'],$glist['tel'],26).'</TEXT>';//40mm宽度标签纸一行占用26个字符，50mm宽度标签纸请改成32个字符
   $i+=1;
   //printLabelMsg(960264115,$content,1);//打开注释调用标签打印接口打印
}

// printLabelMsg(960264115,'<TEXT x="9" y="10" font="12" w="1" h="2" r="0">#001       五号桌      1/3</TEXT><TEXT x="80" y="80" font="12" w="2" h="2" r="0">可乐鸡翅</TEXT><TEXT x="9" y="180" font="12" w="1" h="1" r="0">张三先生       13800138000</TEXT>',1);//40mm宽度标签纸打印例子，打开注释调用标签打印接口打印
// printLabelMsg(960264115,'<TEXT x="9" y="10" font="12" w="1" h="2" r="0">#001          五号桌         1/3</TEXT><TEXT x="100" y="80" font="12" w="2" h="2" r="0">可乐鸡翅</TEXT><TEXT x="9" y="180" font="12" w="1" h="1" r="0">张三先生             13800138000</TEXT>',1);//50mm宽度标签纸打印例子，打开注释调用标签打印接口打印



/**
 * [统计字符串字节数补空格，实现左右排版对齐]
 * @param  [string] $str_left    [左边字符串]
 * @param  [string] $str_right   [右边字符串]
 * @param  [int]    $length      [输入当前纸张规格一行所支持的最大字母数量]
 *                               58mm的机器,一行打印16个汉字,32个字母;76mm的机器,一行打印22个汉字,33个字母,80mm的机器,一行打印24个汉字,48个字母
 *                               标签机宽度50mm，一行32个字母，宽度40mm，一行26个字母
 * @return [string]              [返回处理结果字符串]
 */
function LR($str_left,$str_right,$length){
    if( empty($str_left) || empty($str_right) || empty($length) ) return '请输入正确的参数';
    $kw = '';
    $str_left_lenght = strlen(iconv("UTF-8", "GBK//IGNORE", $str_left));
    $str_right_lenght = strlen(iconv("UTF-8", "GBK//IGNORE", $str_right));
    $k = $length - ($str_left_lenght+$str_right_lenght);
    for($q=0;$q<$k;$q++){
        $kw .= ' ';
    }
    return $str_left.$kw.$str_right;
}


/**
 * [printLabelMsg 标签机打印订单接口]
 * @param  [string] $printer_sn [打印机编号]
 * @param  [string] $orderInfo  [标签内容]
 * @param  [string] $times      [打印联数]
 * @return [string]
 */
function getChineseTimestamp() {
  $UTC_8 = new DateTimeZone('Asia/Shanghai');
  $date = new DateTime('now', $UTC_8);
  return $date->getTimestamp();
}

function printLabelMsg($printer_sn,$orderInfo,$times){
	//$time = time();			    //请求时间

 

// 使用这个时间戳生成签名
$time = time();

	$content = array(
		'user'=>USER,
		'stime'=>$time,
		'sig'=>signature($time),
		'apiname'=>'Open_printLabelMsg',

		'sn'=>$printer_sn,
		'content'=>$orderInfo,
	    'times'=>$times//打印次数
	);
	$client = new HttpClient(IP,PORT);
	if(!$client->post(PATH,$content)){
		echo 'error';
	}
	else{
		//服务器返回的JSON字符串，建议要当做日志记录起来
		echo $client->getContent();
	}
}


//生成签名
function signature($time){
  
	return sha1(USER.UKEY.$time);//公共参数，请求公钥
}



