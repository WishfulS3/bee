const WXAPI = require('apifm-wxapi')
const CONFIG = require('../config.js')  // 添加这行，引入配置文件


class PrintService {
  constructor() {
    this.timer = null
    this.isRunning = false
    this.lastCheckTime = null
    this.xToken = '5b02fe44-8c8c-4ea4-ba38-c8639f4af8f8' // X-Token

  }

  startPolling() {
    if (this.isRunning) return
    
    this.isRunning = true
    console.log('开始轮询打印服务')
    
    // 先检查一次订单
    this.checkOrders()
    
    // 设置定时器
    this.timer = setInterval(() => {
      this.checkOrders()
    }, 30000)
  }

  stopPolling() {
    console.log('停止轮询打印服务')
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.isRunning = false
  }

  checkOrders() {
    console.log('开始检查订单...')
    
    // 使用 WXAPI 进行请求
    WXAPI.request({
      url: '/user/apiExtOrder/list',
      method: 'POST',
      header: {
        'X-Token': this.xToken
      },
      data: {
        status: '1',
        dateAddBegin: this.lastCheckTime || ''
      }
    }).then(res => {
      console.log('订单列表响应:', res)
      if (res.code === 0) {
        this.lastCheckTime = new Date().toISOString()
        const orders = res.data.list || []
        console.log('获取到订单数:', orders.length)
        orders.forEach(order => {
          if (this.needPrint(order)) {
            this.processPrintOrder(order.id)
          }
        })
      } else {
        console.error('获取订单列表失败:', res.msg)
      }
    }).catch(error => {
      console.error('请求订单列表失败:', error)
    })
  }



  needPrint(order) {
    return order.status == 1 && !order.printed
  }

  processPrintOrder(orderId) {
    WXAPI.request({
      url: '/user/apiExtOrder/detail',
      method: 'GET',
      header: {
        'X-Token': this.xToken
      },
      data: { id: orderId }
    }).then(detailRes => {
      if (detailRes.code === 0) {
        const orderDetail = detailRes.data
        this.doPrint(orderDetail)
      } else {
        console.error('获取订单详情失败:', detailRes.msg)
      }
    }).catch(error => {
      console.error('获取订单详情失败:', error)
    })
  }

  doPrint(orderDetail) {
    // 打印接口可能需要用不同的域名
    wx.request({
      url: `${CONFIG.printApiUrl}/printLabelMsg.php`,
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        orderid: orderDetail.orderNumber,
        name: orderDetail.logisticsName,
        tel: orderDetail.logisticsMobile,
        remark: orderDetail.remark || '',
        goods: orderDetail.goodsList.map(item => ({
          title: item.goodsName,
          price: item.amount,
          num: item.number
        }))
      },
      success: (printRes) => {
        if (printRes.data && printRes.data.ret === 0) {
          console.log('订单打印成功:', orderDetail.orderNumber)
        } else {
          console.error('订单打印失败:', printRes.data ? printRes.data.msg : '打印接口异常')
        }
      },
      fail: (error) => {
        console.error('调用打印接口失败:', error)
      }
    })
  }
}

module.exports = new PrintService()