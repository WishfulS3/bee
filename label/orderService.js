// orderService.js
class OrderService {
  // 获取订单详情
  static async getOrderDetail(orderId) {
    try {
      const res = await wx.request({
        url: 'localhost/user/apiExtOrder/detail',
        method: 'GET',
        data: {
          id: orderId
        },
        header: {
          'X-Token': wx.getStorageSync('token')
        }
      })
      return res.data
    } catch (error) {
      console.error('获取订单详情失败:', error)
      throw error
    }
  }
}

export default OrderService