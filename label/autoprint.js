// autoprint.js
class AutoPrintService {
  constructor() {
    this.timer = null;
    this.isRunning = false;
    this.lastCheckTime = null;
  }

  // 开始轮询检查
  startPolling() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.checkOrders();
    
    // 设置5秒轮询
    this.timer = setInterval(() => {
      this.checkOrders();
    }, 5000);
  }

  // 停止轮询
  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  // 检查订单列表
  async checkOrders() {
    try {
      // 获取订单列表
      const listRes = await wx.request({
        url: 'http://localhost:80/user/apiExtOrder/list',
        method: 'POST',
        data: {
          status: '1', // 已支付待发货状态
          dateAddBegin: this.lastCheckTime || '', // 上次检查时间后的新订单
          showExtJson: true // 显示扩展属性
        }
      });

      if (listRes.data.code !== 0) {
        console.error('获取订单列表失败:', listRes.data.msg);
        return;
      }

      const orders = listRes.data.data.list || [];
      
      // 更新最后检查时间
      this.lastCheckTime = new Date().toISOString();

      // 处理需要打印的订单
      for (const order of orders) {
        if (this.needPrint(order)) {
          await this.processPrintOrder(order.id);
        }
      }

    } catch (error) {
      console.error('检查订单出错:', error);
    }
  }

  // 判断订单是否需要打印
  needPrint(order) {
    // 这里根据你的业务逻辑判断订单是否需要打印
    // 比如可以根据订单的某个标记、类型等
    return !order.isPrinted; // 示例：未打印的订单需要打印
  }

  // 处理打印订单
  async processPrintOrder(orderId) {
    try {
      // 获取订单详情
      const detailRes = await wx.request({
        url: 'http://localhost:80/user/apiExtOrder/detail',
        method: 'GET',
        data: { id: orderId }
      });

      if (detailRes.data.code !== 0) {
        console.error('获取订单详情失败:', detailRes.data.msg);
        return;
      }

      const orderDetail = detailRes.data.data;

      // 调用打印接口
      const printRes = await wx.request({
        url: 'http://localhost:80/标签机/printLabelMsg.php',
        method: 'POST',
        data: {
          orderid: orderDetail.orderNumber,
          name: orderDetail.logisticsName,
          tel: orderDetail.logisticsMobile,
          z_number: orderDetail.tableCode || '',
          goods: orderDetail.goodsList.map(item => ({
            title: item.goodsName,
            price: item.amount,
            num: item.number
          }))
        }
      });

      if (printRes.data.ret === 0) {
        console.log('订单打印成功:', orderId);
        // 这里可以调用接口更新订单的打印状态
      } else {
        console.error('订单打印失败:', printRes.data.msg);
      }

    } catch (error) {
      console.error('处理打印订单出错:', error);
    }
  }
}

// 使用示例
const autoPrint = new AutoPrintService();

// 在小程序启动时开始轮询
wx.onAppShow(() => {
  autoPrint.startPolling();
});

// 在小程序进入后台时停止轮询
wx.onAppHide(() => {
  autoPrint.stopPolling();
});

export default AutoPrintService;