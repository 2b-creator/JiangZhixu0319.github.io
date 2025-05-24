// 获取文章列表并显示
async function loadArticlesList() {
    const abortController = new AbortController();
    try {
        const response = await Promise.race([
            fetch('./articles-list.json', { signal: abortController.signal }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), 5000))
        ]);
        if (!response.ok) throw ErrorHandler.formatError('NOT_FOUND', { message: '文章列表加载失败', requestedUrl: response.url });
        const files = await response.json();
        globalArticles = files;
        setupPagination();
        updateArticlesDisplay();

        const articlesList = document.getElementById('articles-list');
        if (!articlesList) {
            throw ErrorHandler.formatError('DOM_ELEMENT_NOT_FOUND', {
                elementId: 'articles-list',
                context: '文章列表容器'
            });
        }

        // 已移除直接循环渲染全部文章的代码，仅通过updateArticlesDisplay函数控制显示
    } catch (error) {
        console.error(error);
        document.querySelector('.loading-indicator').style.display = 'none';
        const fallbackContainer = document.getElementById('articles-list') || document.body;
        fallbackContainer.appendChild(ErrorHandler.createErrorElement({
            ...ErrorHandler.formatError('NETWORK_ERROR'),
            path: new URL('articles-list.json', window.location.href).href
        }));
    }

    
}

// 加载单个文章
// 在文章列表加载完成后隐藏大纲
if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
  document.getElementById('toc-sidebar').style.display = 'none';
}

// 在文章加载时显示大纲
function loadArticle(filename) {
  document.body.classList.remove('home');
  document.getElementById('toc-sidebar').style.display = 'block';
  // 滚动到页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
    fetch(`./articles/${filename}`)
        .then(response => {
            if (!response.ok) throw new Error('无法加载文章');
            return response.text();
        })
        .then(markdown => {
            if (typeof marked !== 'undefined' && marked.parse) {
                const renderer = {
  heading(text, level) {
    const escapedText = text.toLowerCase().replace(/[^\w\u4e00-\u9fa5]+/g, '-');
    toc.push({ level, text, id: escapedText });
    return `<h${level} id="${escapedText}">${text}</h${level}>`;
  }
};

let toc = [];
marked.use({ renderer });
const contentHtml = marked.parse(markdown);
document.getElementById('content').innerHTML = contentHtml;

// 使用 KaTeX 渲染数学公式
renderMathInElement(document.getElementById('content'), {
    delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\[', right: '\\]', display: true},
        {left: '\\(', right: '\\)', display: false}
    ],
    throwOnError: false
});

// 生成目录
const tocContainer = document.getElementById('toc-sidebar');
tocContainer.innerHTML = toc.map(item => 
  `<a class="toc-item level-${item.level}" href="#${item.id}">${item.text}</a>`
).join('');
            } else {
                const errorMsg = ErrorHandler.createErrorElement(ErrorHandler.formatError('LIBRARY_LOAD', {
                    message: 'Markdown解析库加载失败',
                    library: 'marked',
                    fallbackContent: markdown
                }));
                document.getElementById('content').innerHTML = errorMsg.outerHTML + `<pre class="raw-markdown">${markdown}</pre>`;
            }
            hljs.highlightAll();

    // 为所有pre元素添加复制按钮
    document.querySelectorAll('pre').forEach(pre => {
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/></svg><span>复制代码</span>`;
      
      btn.onclick = () => {
        const code = pre.querySelector('code')?.innerText || pre.innerText;
        navigator.clipboard.writeText(code)
          .then(() => {
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 7L9 19l-5.5-5.5 1.41-1.41L9 16.17 19.59 5.59 21 7z"/></svg><span>已复制！</span>`;
            setTimeout(() => {
              btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/></svg><span>复制代码</span>`;
            }, 2000);
          })
          .catch(err => console.error('复制失败:', err));
      };
      pre.appendChild(btn);
    });
            document.getElementById('articles-list').style.display = 'none';
            document.getElementById('pagination-container').style.display = 'none';
            document.getElementById('content').style.display = 'block';
        })
        .catch(error => {
            console.error(error);
            const errorDetail = ErrorHandler.formatError('RESOURCE_LOAD', {
                message: '文章加载失败',
                resourceType: 'Markdown文件',
                resourcePath: `./articles/${filename}`,
                cdnSources: [
                    'https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js',
                    'https://unpkg.com/marked@11.1.1/lib/marked.js'
                ]
            });
            document.getElementById('content').innerHTML = ErrorHandler.createErrorElement(errorDetail).outerHTML;
        });
    document.getElementById('content').style.display = 'block';
    document.getElementById('pagination-container').style.display = 'none';
    hljs.highlightAll();

    // 为所有pre元素添加复制按钮
    document.querySelectorAll('pre').forEach(pre => {
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/></svg>`;
      
      btn.onclick = () => {
        const code = pre.querySelector('code')?.innerText || pre.innerText;
        navigator.clipboard.writeText(code)
          .then(() => {
            btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M21 7L9 19l-5.5-5.5 1.41-1.41L9 16.17 19.59 5.59 21 7z"/></svg>`;
            setTimeout(() => {
              btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12V1z"/></svg>`;
            }, 2000);
          })
          .catch(err => console.error('复制失败:', err));
      };
      pre.appendChild(btn);
    });
}

// 返回主页函数
function backToHome() {
  document.body.classList.add('home');
  document.getElementById('content').style.display = 'none';
  document.getElementById('articles-list').style.display = 'block';
  document.getElementById('pagination-container').style.display = 'block';
  document.getElementById('toc-sidebar').style.display = 'none';
  // 滚动到页面顶部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 初始化加载文章列表
// 在成功加载后隐藏loading
const loadingIndicator = document.querySelector('.loading-indicator');
if (loadingIndicator) loadingIndicator.style.display = 'none';

// 初始化加载加入DOM就绪检查
document.addEventListener('DOMContentLoaded', () => {
    // 首页状态判断
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
      document.body.classList.add('home');
    }

    const loadingIndicator = document.querySelector('.loading-indicator');
    const articlesListContainer = document.getElementById('articles-list-container');

    const timeoutId = setTimeout(() => {
        loadingIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 加载超时，请检查网络连接';
    }, 5000);

    loadArticlesList()
        .finally(() => {
            clearTimeout(timeoutId);
            loadingIndicator.style.display = 'none';
            articlesListContainer.style.display = 'block';
            document.getElementById('articles-list').style.display = 'block';
        });
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