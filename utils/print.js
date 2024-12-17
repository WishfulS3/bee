// utils/print.js
const WXAPI = require('apifm-wxapi')

class PrintService {
  constructor() {
    this.timer = null
    this.isRunning = false
    this.lastCheckTime = null
    this.xToken = ''
    this.tokenExpireTime = 0
  }

  // 获取新的 token
  refreshToken(callback) {
    wx.request({
      url: 'https://user.api.it120.cc/login/mobile/v2',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: {
        mobile: '15988020219',
        pwd: 'Wishful1688!'
      },
      success: (res) => {
        if (res.data && res.data.code === 0) {
          this.xToken = res.data.data.token
          this.tokenExpireTime = Date.now() + 24 * 60 * 60 * 1000
          console.log('token 刷新成功:', this.xToken)
          callback && callback(true)
        } else {
          console.error('获取 token 失败:', res.data ? res.data.msg : '接口异常')
          callback && callback(false)
        }
      },
      fail: (error) => {
        console.error('刷新 token 出错:', error)
        callback && callback(false)
      }
    })
  }

  // 检查并确保 token 有效
  ensureValidToken(callback) {
    if (!this.xToken || Date.now() >= this.tokenExpireTime) {
      this.refreshToken(callback)
    } else {
      callback && callback(true)
    }
  }

  startPolling() {
    if (this.isRunning) return
    
    this.ensureValidToken((tokenValid) => {
      if (!tokenValid) {
        console.error('无法获取有效的 token')
        return
      }

      this.isRunning = true
      this.checkOrders()
      
      this.timer = setInterval(() => {
        this.checkOrders()
      }, 50000)
    })
  }

  checkOrders() {
    this.ensureValidToken((tokenValid) => {
      if (!tokenValid) {
        console.error('token 无效，跳过本次检查')
        return
      }

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
          if (res.data && res.data.code === 0) {
            this.lastCheckTime = new Date().toISOString()
            const orders = res.data.data.result || []
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
    })
  }

  needPrint(order) {
    return order.isPay && !order.printed
  }

  processPrintOrder(orderId) {
    wx.request({
      url: 'https://user.api.it120.cc/user/apiExtOrder/detail',
      method: 'GET',
      header: {
        'X-Token': this.xToken
      },
      data: { id: orderId },
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
    // 打印订单详情，方便调试
    console.log('订单详情数据:', orderDetail)
    
    const printData = {
      orderid: orderDetail.orderNumber,
      remark: orderDetail.remark || '',
      name: orderDetail.shopName,
      tel: orderDetail.tel || '',
      z_number: orderDetail.qudanhao || '',
      goods: []  // 先创建空数组
    }

    // 检查商品列表数据
    if (orderDetail.goodsList && Array.isArray(orderDetail.goodsList)) {
      printData.goods = orderDetail.goodsList.map(item => ({
        title: item.goodsName,
        price: item.amount,
        num: item.number
      }))
    } else {
      // 如果没有商品列表，使用订单总额创建一个商品
      printData.goods = [{
        title: '商品',
        price: orderDetail.amountReal || 0,
        num: orderDetail.goodsNumber || 1
      }]
    }   // 打印发送的数据，方便调试
    console.log('发送到打印机的数据:', printData)

    wx.request({
      url: 'http://localhost/print/printLabelMsg.php',
      method: 'POST',
      header: {
        'content-type': 'application/x-www-form-urlencoded'
      },
      data: printData,
      success: (printRes) => {
        console.log('打印接口返回:', printRes.data)  // 添加这行，查看完整返回
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

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.isRunning = false
  }
}

module.exports = new PrintService()