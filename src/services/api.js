import axios from 'axios'

// 创建 axios 实例
const apiClient = axios.create({
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'multipart/form-data'
  }
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('发送请求:', config.url)
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('收到响应:', response.config.url, response.status)
    return response
  },
  (error) => {
    console.error('响应错误:', error.message)

    // 统一错误处理
    let errorMessage = '请求失败'

    if (error.code === 'ECONNABORTED') {
      errorMessage = '请求超时，请检查网络连接'
    } else if (error.response) {
      const status = error.response.status
      switch (status) {
        case 400:
          errorMessage = '请求参数错误'
          break
        case 413:
          errorMessage = '文件过大'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        case 503:
          errorMessage = '服务暂时不可用'
          break
        default:
          errorMessage = `请求失败 (${status})`
      }
    } else if (error.request) {
      errorMessage = '网络连接失败，请检查服务器是否启动'
    }

    return Promise.reject(new Error(errorMessage))
  }
)

/**
 * 通用的图像处理请求
 * @param {string} url - API 端点
 * @param {File|Blob} imageFile - 图像文件
 * @param {Object} options - 额外选项
 * @param {Object} queryParams - 查询参数
 * @returns {Promise<Blob>} 处理后的图像 Blob
 */
export const processImage = async (url, imageFile, options = {}, queryParams = {}) => {
  const formData = new FormData()
  formData.append('image', imageFile)

  // 添加额外参数到FormData
  Object.keys(options).forEach(key => {
    formData.append(key, options[key])
  })

  // 构建查询参数
  const urlSearchParams = new URLSearchParams(queryParams)
  const finalUrl = Object.keys(queryParams).length > 0 
    ? `${url}?${urlSearchParams.toString()}`
    : url

  const response = await apiClient.post(finalUrl, formData, {
    responseType: 'blob'
  })

  return response.data
}

/**
 * 获取服务器状态
 * @param {string} baseUrl - 服务器基础URL
 * @returns {Promise<boolean>} 服务器是否可用
 */
export const checkServerStatus = async (baseUrl) => {
  try {
    await axios.get(`${baseUrl}/health`, { timeout: 5000 })
    return true
  } catch (error) {
    console.warn('服务器不可用:', error.message)
    return false
  }
}

/**
 * 获取背景替换图片
 * @param {string} prompt - 提示词
 * @param {string|number} cursor - 游标，用于分页
 * @returns {Promise<Object>} 返回图片列表和新的游标
 */
export const getBackgroundImages = async (prompt = '', cursor = null) => {
  const requestData = { prompt }
  
  if (cursor !== null) {
    requestData.cursor = cursor
  }

  const response = await apiClient.post('/api/show_bg', requestData, {
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 检查响应状态
  if (response.data.code !== 200) {
    throw new Error(`API返回错误: ${response.data.code}`)
  }

  return response.data.data
}

/**
 * 执行背景替换
 * @param {File|Blob} imageFile - 原图片文件
 * @param {Object} backgroundImage - 背景图片信息
 * @returns {Promise<Blob>} 返回替换后的图片
 */
export const replaceBackground = async (imageFile, backgroundImage) => {
  const formData = new FormData()
  
  // 添加原始图片文件
  formData.append('image', imageFile)
  
  // 添加背景图片信息的三个单独字段
  formData.append('id', backgroundImage.id)
  formData.append('width', backgroundImage.width)
  formData.append('height', backgroundImage.height)

  const response = await apiClient.post('/api/replace_bg', formData, {
    responseType: 'blob',
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })

  return response.data
}

export default apiClient


