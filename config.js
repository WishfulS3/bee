module.exports = {
  version: "24.10.19",
  note: '商品分类支持区分门店',
  subDomain: "9kuai8coffee", // 根据教程 https://www.it120.cc/help/qr6l4m.html 查看并设置你自己的 subDomain
  merchantId: 68021, // 商户ID，可在后台工厂设置-->商户信息查看
  customerServiceType: 'QW', // 客服类型，QW为企业微信，需要在后台系统参数配置企业ID和客服URL，否则为小程序的默认客服

   // 添加打印相关配置
   printApiUrl: 'http://localhost:80', // 打印服务器地址
   printInterval: 5000, // 打印检查间隔(毫秒)
}

export default {
  printApiUrl: 'http://localhost:80/label',
  API_BASE_URL: 'http://localhost:80/label',
  POLL_INTERVAL: 5000, // 轮询间隔，单位毫秒
  xToken: '5b02fe44-8c8c-4ea4-ba38-c8639f4af8f8'

  
}
