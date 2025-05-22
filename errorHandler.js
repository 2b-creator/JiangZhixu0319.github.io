class ErrorHandler {
  static errorMap = {
    NETWORK_ERROR: {
      code: 1001,
      cause: ['网络连接失败', '跨域请求被阻止', '服务器未响应'],
      solution: '检查网络连接，确认CORS配置，重试操作'
    },
    NOT_FOUND: {
      code: 1002,
      cause: ['请求路径错误', '文件未上传', '资源被删除'],
      solution: '检查请求URL，确认资源存在性'
    },
    RESOURCE_LOAD: {
      code: 1004,
      cause: ['CDN资源不可用', '本地备用资源缺失'],
      solution: '检查CDN状态并重试，确保本地备用资源存在'
    },
    FAVICON_NOT_FOUND: {
      code: 1005,
      cause: ['网站图标未配置', '图标路径错误'],
      solution: '添加默认网站图标或检查图标路径'
    },
    DOM_ELEMENT_NOT_FOUND: {
      code: 1006,
      cause: ['DOM元素未创建', '元素ID拼写错误', '脚本加载顺序错误'],
      solution: '检查元素是否存在、ID是否正确，确保DOM加载后再执行脚本'
    },
    PARSE_ERROR: {
      code: 1003,
      cause: ['响应非JSON格式', '数据编码错误'],
      solution: '验证响应格式，检查字符编码'
    }
  };

  static formatError(errorType, metadata = {}) {
    const errorInfo = this.errorMap[errorType];
    if (!errorInfo) return { code: 9999, message: '未知错误类型' };

    return {
      ...errorInfo,
      timestamp: new Date().toISOString(),
      path: window.location.href,
      ...metadata
    };
  }

  static createErrorElement(errorData) {
    const errorCard = document.createElement('div');
    errorCard.className = 'error-card';
    errorCard.innerHTML = `
      <div class="error-header">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>错误代码 ${errorData.code}</h3>
      </div>
      <div class="error-body">
        <p>${errorData.message || '发生未知错误'}</p>
        <div class="error-details">
          <h4>可能原因：</h4>
          <ul>${errorData.cause.map(c => `<li>${c}</li>`).join('')}</ul>
          <h4>解决方案：</h4>
          <p>${errorData.solution}</p>
        </div>
        <button class="retry-btn">重试</button>
        <button class="report-btn">下载错误报告</button>
      </div>
    `;
    return errorCard;
  }
}

export default ErrorHandler;