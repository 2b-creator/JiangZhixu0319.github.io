// 性能优化与动画增强
const performanceOptimizations = {
  // 资源加载状态
  resourcesLoaded: false,
  // Intersection Observer 实例
  observer: null,
  // 防抖计时器
  debounceTimer: null
};

// 初始化 Intersection Observer
function initIntersectionObserver() {
  performanceOptimizations.observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        if (element.classList.contains('lazy-load')) {
          element.classList.add('visible');
          performanceOptimizations.observer.unobserve(element);
        }
      }
    });
  }, {
    rootMargin: '50px',
    threshold: 0.1
  });
}

// 获取文章列表并显示
async function loadArticlesList() {
  const abortController = new AbortController();
  const contentElement = document.getElementById('content');
  const articlesListContainer = document.getElementById('articles-list-container');
  const paginationContainer = document.getElementById('pagination-container');
  const loadingIndicator = document.querySelector('.loading-indicator');
  
  try {    
    // 显示加载动画
    loadingIndicator.style.display = 'block';
    loadingIndicator.classList.add('active');
    
    // 确保文章列表容器存在
    const articlesList = document.getElementById('articles-list');
    if (!articlesList) {
        throw ErrorHandler.formatError('DOM_ELEMENT_NOT_FOUND', {
            elementId: 'articles-list',
            context: '文章列表容器'
        });
    }

    // 初始化容器状态
    contentElement.style.display = 'none';
    articlesListContainer.style.display = 'block';
    paginationContainer.style.display = 'block';
    articlesList.innerHTML = '';

    // 带超时的请求
    const response = await Promise.race([
      fetch('./articles-list.json', { 
        signal: abortController.signal,
        headers: {
          'Cache-Control': 'max-age=3600'
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('请求超时')), 5000)
      )
    ]);

    if (!response.ok) throw ErrorHandler.formatError('NOT_FOUND', { 
      message: '文章列表加载失败', 
      requestedUrl: response.url 
    });

    const files = await response.json();
    if (!Array.isArray(files) || files.length === 0) {
      throw ErrorHandler.formatError('NOT_FOUND', {
        message: '未找到任何文章',
        requestedUrl: response.url
      });
    }

    globalArticles = files;

    // 初始化 Intersection Observer
    if (!performanceOptimizations.observer) {
      initIntersectionObserver();
    }

    setupPagination();
    updateArticlesDisplay();
    
    // 添加页面过渡动画
    document.body.classList.add('page-loaded');

    return files;
  } catch (error) {
    console.error('加载文章列表失败:', error);
    
    // 显示错误信息
    const errorElement = ErrorHandler.createErrorElement(
      error.code ? error : ErrorHandler.formatError('NETWORK_ERROR', {
        path: new URL('articles-list.json', window.location.href).href,
        error: error.message
      })
    );

    if (articlesListContainer) {
      const articlesList = document.getElementById('articles-list');
      if (articlesList) {
        articlesList.innerHTML = '';
        articlesList.appendChild(errorElement);
      } else {
        articlesListContainer.appendChild(errorElement);
      }
    }

    throw error;
  }
}

// 加载单个文章
// 在文章列表加载完成后隐藏大纲
if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
  document.getElementById('toc-sidebar').style.display = 'none';
}

// 在文章加载时显示大纲
// 初始化目录切换按钮
function setupTocToggle() {
    const tocToggle = document.querySelector('.toc-toggle');
    const tocSidebar = document.getElementById('toc-sidebar');
    const content = document.getElementById('content');
    
    // 从localStorage获取目录状态
    const isTocCollapsed = localStorage.getItem('tocCollapsed') === 'true';
    
    if (isTocCollapsed) {
        tocSidebar.classList.remove('visible');
        content.classList.remove('with-toc');
        tocToggle.classList.add('collapsed');
    }
    
    tocToggle.addEventListener('click', () => {
        const isVisible = tocSidebar.classList.contains('visible');
        if (isVisible) {
            tocSidebar.classList.remove('visible');
            content.classList.remove('with-toc');
            tocToggle.classList.add('collapsed');
            localStorage.setItem('tocCollapsed', 'true');
        } else {
            tocSidebar.classList.add('visible');
            content.classList.add('with-toc');
            tocToggle.classList.remove('collapsed');
            localStorage.setItem('tocCollapsed', 'false');
        }
    });
}

async function loadArticle(filename) {
  try {
    // 添加过渡动画
    document.body.classList.remove('home');
    const content = document.getElementById('content');
    const articlesList = document.getElementById('articles-list-container');
    const tocSidebar = document.getElementById('toc-sidebar');
    const tocToggle = document.querySelector('.toc-toggle');
    
    // 重置容器状态
    content.style.display = 'block';
    content.style.visibility = 'visible';
    content.classList.add('with-toc');
    articlesList.style.display = 'none';
    tocToggle.classList.add('show');
    
    // 确保大纲栏可见
    tocSidebar.classList.add('visible');

    // 滚动到页面顶部和动画效果
    window.scrollTo({ top: 0, behavior: 'smooth' });
    content.style.opacity = '0';
    content.style.transform = 'translateY(20px)';
  
  // 加载并渲染文章内容
    const response = await fetch(`./articles/${filename}`, {
      headers: {
        'Cache-Control': 'max-age=3600'
      }
    });

    if (!response.ok) throw new Error('无法加载文章');
    const markdown = await response.text();

    // 优化 Markdown 渲染
    if (typeof marked !== 'undefined' && marked.parse) {
      const renderer = {
        heading(text, level) {
          const escapedText = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
          toc.push({ level, text, id: escapedText });
          return `<h${level} id="${escapedText}" class="animate-in">${text}</h${level}>`;
        },
        paragraph(text) {
          return `<p class="animate-in">${text}</p>`;
        },
        code(code, language) {
          return `<pre class="animate-in"><code class="hljs ${language}">${code}</code></pre>`;
        }
      };

      let toc = [];
      marked.use({ renderer });
      
      // 渲染内容
      content.innerHTML = marked.parse(markdown);
      
      // 延迟显示内容以确保动画效果
      setTimeout(() => {
        content.style.opacity = '1';
        content.style.transform = 'translateY(0)';
      }, 100);

      // 优化数学公式渲染
      renderMathInElement(content, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\[', right: '\\]', display: true},
          {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false,
        output: 'html'
      });      // 生成优化的目录
      const tocContainer = document.getElementById('toc-sidebar');
      // 确保大纲容器状态
      if (!tocContainer) {
        console.error('目录容器不存在');
        return;
      }

      // 清空并重新生成目录
      tocContainer.innerHTML = '';
      const tocContent = generateTOC(toc);
      tocContainer.innerHTML = tocContent;
      
      // 确保大纲可见性
      tocContainer.style.display = 'block';
      tocContainer.style.visibility = 'visible';
      tocContainer.style.opacity = '1';
      
      // 添加过渡动画
      requestAnimationFrame(() => {
        const tocItems = tocContainer.querySelectorAll('.toc-item');
        tocItems.forEach((item, index) => {
          item.style.transitionDelay = `${index * 50}ms`;
          item.style.opacity = '1';
          item.style.transform = 'translateX(0)';
        });
      });
      
      // 添加目录滚动监听
      setupTOCScroll();
    }

    // 代码高亮优化
    hljs.highlightAll();
    
    // 添加代码块复制按钮
    setupCodeCopyButtons();
    
    // 懒加载图片
    setupImageLazyLoading();

  } catch (error) {
    console.error(error);
    document.getElementById('content').innerHTML = ErrorHandler.createErrorElement(ErrorHandler.formatError('ARTICLE_LOAD_ERROR', {
      filename,
      error: error.message
    })).outerHTML;
  }
}

// 生成优化的目录
function generateTOC(toc) {
  if (!toc || toc.length === 0) {
    return '<div class="toc-empty">暂无目录</div>';
  }
  return toc.map((item, index) => `
    <a class="toc-item level-${item.level}" 
       href="#${item.id}" 
       style="opacity: 1; transform: none;">
      ${item.text}
    </a>
  `).join('');
}

// 设置目录滚动监听
function setupTOCScroll() {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const tocLinks = document.querySelectorAll('.toc-item');

  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        tocLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + entry.target.id) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { threshold: 0.5 });

  headings.forEach(heading => headingObserver.observe(heading));
}

// 设置代码块复制按钮
function setupCodeCopyButtons() {
  document.querySelectorAll('pre').forEach(pre => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn animate-in';
    btn.innerHTML = `
      <svg viewBox="0 0 24 24">
        <path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/>
      </svg>
      <span>复制代码</span>
    `;
    
    btn.onclick = async () => {
      try {
        const code = pre.querySelector('code').innerText;
        await navigator.clipboard.writeText(code);
        
        btn.classList.add('success');
        btn.querySelector('span').textContent = '已复制';
        
        setTimeout(() => {
          btn.classList.remove('success');
          btn.querySelector('span').textContent = '复制代码';
        }, 2000);
      } catch (err) {
        console.error('复制失败:', err);
        btn.classList.add('error');
        btn.querySelector('span').textContent = '复制失败';
        
        setTimeout(() => {
          btn.classList.remove('error');
          btn.querySelector('span').textContent = '复制代码';
        }, 2000);
      }
    };
    
    pre.appendChild(btn);
  });
}

// 设置图片懒加载
function setupImageLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  images.forEach(img => {
    img.classList.add('lazy-load');
    performanceOptimizations.observer.observe(img);
    
    img.onload = () => {
      img.classList.add('loaded');
    };
  });
}

// 返回主页函数
function backToHome() {
  document.body.classList.add('home');
  // 隐藏文章内容和大纲
  const content = document.getElementById('content');
  const tocSidebar = document.getElementById('toc-sidebar');
  const tocToggle = document.querySelector('.toc-toggle');
  
  content.style.display = 'none';
  content.style.visibility = 'hidden';
  content.classList.remove('with-toc');
  tocSidebar.classList.remove('visible');
  tocToggle.classList.remove('show');
  
  // 显示文章列表
  document.getElementById('articles-list').style.display = 'block';
  document.getElementById('pagination-container').style.display = 'block';
  
  // 滚动到页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// DOM就绪检查和初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 首页状态判断
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        document.body.classList.add('home');
    }
    
    // 初始化目录切换功能
    setupTocToggle();

    const loadingIndicator = document.querySelector('.loading-indicator');
    const articlesListContainer = document.getElementById('articles-list-container');
    
    try {
        // 设置加载超时
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('加载超时')), 5000);
        });

        // 竞争加载文章列表
        await Promise.race([loadArticlesList(), timeoutPromise]);
        
        // 成功加载后的处理
        if (globalArticles.length > 0) {
            loadingIndicator.style.display = 'none';
            articlesListContainer.style.display = 'block';
            document.getElementById('articles-list').style.display = 'block';
        } else {
            throw new Error('未找到文章');
        }
    } catch (error) {
        console.error('初始化失败:', error);
        loadingIndicator.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${error.message || '加载失败'}，请检查网络连接`;
    }
});

// 分页功能实现
const ITEMS_PER_PAGE = 8;
let currentPage = 1;

let globalArticles = [];

function setupPagination() {
    const pageCount = Math.ceil(globalArticles.length / ITEMS_PER_PAGE);
    const paginationContainer = document.getElementById('pagination-container');
    paginationContainer.innerHTML = '';
    paginationContainer.style.display = pageCount > 1 ? 'flex' : 'none';

    for (let i = 1; i <= pageCount; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = `page-btn ${i === currentPage ? 'active' : ''}`;
        pageButton.textContent = i;
        pageButton.style.margin = '0 5px';
        pageButton.style.padding = '5px 10px';
        pageButton.addEventListener('click', () => {
            currentPage = i;
            updateArticlesDisplay();
            document.querySelectorAll('.page-btn').forEach(btn =>
                btn.classList.remove('active')
            );
            pageButton.classList.add('active');
        });
        paginationContainer.appendChild(pageButton);
    }
}

function updateArticlesDisplay() {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const articlesToShow = globalArticles.slice(startIndex, endIndex);
    
    // 缓存当前分页数据
    localStorage.setItem('cachedPageData', JSON.stringify({
        page: currentPage,
        data: articlesToShow
    }));
    
    const articlesList = document.getElementById('articles-list');
    articlesList.innerHTML = '';
    
    articlesToShow.forEach(file => {
        const img = document.createElement('img');
        img.className = 'lazy';
        img.dataset.src = file.cover || './default-cover.jpg';
        img.alt = file.title;
        
        // 使用Intersection Observer实现懒加载
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.src = entry.target.dataset.src;
                    observer.unobserve(entry.target);
                }
            });
        });
        observer.observe(img);
        try {
            // 直接从JSON数据获取文章信息
            const { title, date, tags, excerpt } = file;

            const articleDiv = document.createElement('div');
            articleDiv.className = 'article-card';
            articleDiv.innerHTML = `
                <div class="article-header">
                    <h3 class="article-title">${title}</h3>
                    <div class="article-meta">
                        <span>📅 ${date}</span>
                        ${tags.map(t => `<span>🏷️ ${t}</span>`).join('')}
                    </div>
                </div>
                <p class="article-excerpt">${excerpt}</p>
                `;
            articlesList.appendChild(articleDiv);
            articleDiv.dataset.filename = file.filename;
            articleDiv.addEventListener('click', (event) => {
        // 检查是否有文本被选中
        const selection = window.getSelection();
        if (selection.toString().trim() === '') {
            // 没有选中文本时才加载文章
            loadArticle(file.filename);
        }
    });
        } catch (error) {
            console.error(error);
            document.querySelector('.loading-indicator').style.display = 'none';
        }
    });
}