const WXAPI = require('apifm-wxapi')

class PrintService {
  constructor() {
    this.timer = null
    this.isRunning = false
    this.lastCheckTime = null
    this.xToken = '5b02fe44-8c8c-4ea4-ba38-c8639f4af8f8'
  }

  startPolling() {
    if (this.isRunning) return
    this.isRunning = true
    this.checkOrders()
    
    this.timer = setInterval(() => {
      this.checkOrders()
    }, 30000)
  }

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.isRunning = false
  }

  checkOrders() {
    console.log('开始检查订单...')
    
    wx.request({
      url: 'https://user.api.it120.cc/user/apiExtOrder/list',
      method: 'POST',
      header: {
        'X-Token': this.xToken,
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        status: '1',
        dateAddBegin: this.lastCheckTime || ''
      },
      success: (res) => {
        console.log('订单列表响应:', res)
        if (res.data && res.data.code === 0) {
          this.lastCheckTime = new Date().toISOString()
          const orders = res.data.data.list || []
          console.log('获取到订单数:', orders.length)
          orders.forEach(order => {
            if (this.needPrint(order)) {
              this.processPrintOrder(order.id)
            }
          })
        } else {
          console.error('获取订单列表失败:', res.data ? res.data.msg : '接口异常')
        }
      },
      fail: (error) => {
        console.error('请求订单列表失败:', error)
      }
    })
  }

  needPrint(order) {
    return order.status == 1 && !order.printed
  }

  processPrintOrder(orderId) {
    wx.request({
      url: 'https://user.api.it120.cc/user/apiExtOrder/detail',
      method: 'GET',
      header: {
        'X-Token': this.xToken
      },
      data: { 
        id: orderId 
      },
      success: (detailRes) => {
        if (detailRes.data && detailRes.data.code === 0) {
          const orderDetail = detailRes.data.data
          this.doPrint(orderDetail)
        } else {
          console.error('获取订单详情失败:', detailRes.data ? detailRes.data.msg : '接口异常')
        }
      },
      fail: (error) => {
        console.error('获取订单详情失败:', error)
      }
    })
  }

  doPrint(orderDetail) {
    wx.request({
      url: 'http://localhost/printLabelMsg.php', // 根据实际打印服务器地址修改
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