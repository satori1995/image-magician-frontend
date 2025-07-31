import axios from 'axios'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
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
        case 401:
          errorMessage = '未授权访问'
          break
        case 403:
          errorMessage = '禁止访问'
          break
        case 404:
          errorMessage = '资源不存在'
          break
        case 500:
          errorMessage = '服务器内部错误'
          break
        default:
          errorMessage = `请求失败 (${status})`
      }
    } else if (error.request) {
      errorMessage = '网络连接失败'
    }

    return Promise.reject(new Error(errorMessage))
  }
)

// API 接口方法
export const searchImages = async (params) => {
  try {
    const response = await apiClient.post('/search_images', params)
    return response.data
  } catch (error) {
    console.error('搜索图片失败:', error)
    throw error
  }
}

export const getProxiedImage = async (imageUrl) => {
  try {
    console.log('API: 获取代理图片:', imageUrl)
    
    const response = await apiClient.post('/get_image', {
      image_url: imageUrl
    }, {
      responseType: 'blob',
      timeout: 30000
    })
    
    console.log('API: 代理图片获取成功:', {
      status: response.status,
      size: response.data.size,
      type: response.data.type
    })
    
    return response.data
  } catch (error) {
    console.error('API: 代理图片获取失败:', error)
    throw error
  }
}

export const animateImage = async (formData) => {
  try {
    console.log('API: 开始发送动漫化请求...')
    
    // 检查 formData 内容
    console.log('API: FormData 检查:')
    for (let pair of formData.entries()) {
      console.log(`API: ${pair[0]}:`, pair[1])
    }
    
    const response = await apiClient.post('/animate_image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000, // 增加超时时间到120秒
      responseType: 'blob', // 设置响应类型为 blob，以处理二进制数据
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log(`API: 上传进度: ${percentCompleted}%`)
      }
    })
    
    console.log('API: 收到响应:', {
      status: response.status,
      statusText: response.statusText,
      dataType: typeof response.data,
      dataSize: response.data instanceof Blob ? response.data.size : 'unknown'
    })
    
    // 如果响应是 Blob，直接返回
    if (response.data instanceof Blob) {
      console.log('API: 返回 Blob 数据，大小:', response.data.size)
      return response.data
    }
    
    return response.data
  } catch (error) {
    console.error('API: 图像动漫化失败:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText
    })
    
    // 检查是否是网络连接错误（后端服务未运行）
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error') || 
        (error.response && error.response.status === 0)) {
      console.log('API: 检测到网络错误，尝试使用模拟响应...')
      
      // 使用模拟动漫化处理（开发模式下）
      if (process.env.NODE_ENV === 'development') {
        return await simulateAnimeProcessing(formData)
      }
      
      throw new Error('无法连接到服务器，请确保后端服务正在运行')
    }
    
    // 如果有响应错误，尝试提取更详细的错误信息
    if (error.response && error.response.data) {
      const errorData = error.response.data
      if (errorData.message) {
        throw new Error(errorData.message)
      } else if (errorData.error) {
        throw new Error(errorData.error)
      } else if (typeof errorData === 'string') {
        throw new Error(errorData)
      }
    }
    
    throw error
  }
}

// 模拟动漫化处理（用于开发测试）
const simulateAnimeProcessing = async (formData) => {
  console.log('模拟动漫化处理开始...')
  
  // 获取上传的文件
  const file = formData.get('image')
  if (!file) {
    throw new Error('没有找到上传的图片文件')
  }
  
  // 模拟处理时间
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // 读取原图并创建一个简单的处理效果
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        // 创建 canvas 进行简单的图像处理
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = img.width
        canvas.height = img.height
        
        // 绘制原图
        ctx.drawImage(img, 0, 0)
        
        // 应用简单的滤镜效果（提高对比度和饱和度）
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data
        
        for (let i = 0; i < data.length; i += 4) {
          // 增强对比度
          data[i] = Math.min(255, data[i] * 1.2)     // Red
          data[i + 1] = Math.min(255, data[i + 1] * 1.2) // Green
          data[i + 2] = Math.min(255, data[i + 2] * 1.2) // Blue
        }
        
        ctx.putImageData(imageData, 0, 0)
        
        // 转换为 blob URL
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          console.log('模拟动漫化处理完成:', url)
          
          resolve({
            code: 200,
            message: '动漫化处理成功（模拟）',
            data: {
              anime_url: url
            }
          })
        }, 'image/jpeg', 0.9)
      }
      
      img.onerror = () => {
        reject(new Error('图片加载失败'))
      }
      
      img.src = e.target.result
    }
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'))
    }
    
    reader.readAsDataURL(file)
  })
}

export default apiClient
