// printService.js
class PrintService {
  static async sendToPHPServer(orderData) {
    try {
      // 转换订单数据为打印格式
      const printData = {
        orderid: orderData.orderNumber,
        remark: orderData.remark || '',
        name: orderData.logisticsName,
        tel: orderData.logisticsMobile,
        z_number: orderData.tableCode || '',
        goods: orderData.goodsList.map(item => ({
          title: item.goodsName,
          price: item.amount,
          num: item.number
        }))
      }

      const res = await wx.request({
        url: 'localhost/标签机/printLabelMsg.php',
        method: 'POST',
        data: printData,
        header: {
          'content-type': 'application/x-www-form-urlencoded'
        }
      })

      return res.data
    } catch (error) {
      console.error('发送打印请求失败:', error)
      throw error
    }
  }
}

export default PrintService