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
function loadArticle(filename) {
    fetch(`./articles/${filename}`)
        .then(response => {
            if (!response.ok) throw new Error('无法加载文章');
            return response.text();
        })
        .then(markdown => {
            if (typeof marked !== 'undefined' && marked.parse) {
                document.getElementById('content').innerHTML = marked.parse(markdown);
            } else {
                const errorMsg = ErrorHandler.createErrorElement(ErrorHandler.formatError('LIBRARY_LOAD', {
                    message: 'Markdown解析库加载失败',
                    library: 'marked',
                    fallbackContent: markdown
                }));
                document.getElementById('content').innerHTML = errorMsg.outerHTML + `<pre class="raw-markdown">${markdown}</pre>`;
            }
            hljs.highlightAll();
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
}

// 初始化加载文章列表
// 在成功加载后隐藏loading
const loadingIndicator = document.querySelector('.loading-indicator');
if (loadingIndicator) loadingIndicator.style.display = 'none';

// 初始化加载加入DOM就绪检查
document.addEventListener('DOMContentLoaded', () => {
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
    const paginatedArticles = globalArticles.slice(startIndex, endIndex);

    const articlesList = document.getElementById('articles-list');
    articlesList.innerHTML = '';

    paginatedArticles.forEach(file => {
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
            articleDiv.addEventListener('click', () => loadArticle(file.filename));
        } catch (error) {
            console.error(error);
            document.querySelector('.loading-indicator').style.display = 'none';
        }
    });
}