// CMS Loader for Decap CMS Integration
// Handles Markdown parsing, content loading, and caching

class CMSLoader {
    constructor() {
        this.cache = {};
        this.cacheTime = 5 * 60 * 1000; // 5 minutes
        this.baseUrl = '/content/';
        this.cdnLibraries = {
            marked: 'https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js',
            yaml: 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.3.7/js-yaml.min.js'
        };
    }

    async init() {
        // Load external libraries if not already loaded
        await this.loadLibraries();
    }

    async loadLibraries() {
        const promises = [];
        
        if (typeof marked === 'undefined') {
            promises.push(this.loadScript(this.cdnLibraries.marked));
        }
        
        if (typeof jsyaml === 'undefined') {
            promises.push(this.loadScript(this.cdnLibraries.yaml));
        }
        
        return Promise.all(promises);
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async fetchFile(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.text();
        } catch (error) {
            console.error('Error fetching file:', error);
            return null;
        }
    }

    parseFrontmatter(content) {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return {
                frontmatter: {},
                body: content,
                error: 'Invalid frontmatter format'
            };
        }
        
        const frontmatterContent = match[1];
        const bodyContent = match[2];
        
        let frontmatter;
        try {
            frontmatter = jsyaml.load(frontmatterContent);
        } catch (error) {
            console.error('Error parsing frontmatter:', error);
            frontmatter = {};
        }
        
        return {
            frontmatter,
            body: bodyContent,
            error: null
        };
    }

    parseMarkdown(content) {
        if (typeof marked === 'undefined') {
            return content;
        }
        
        try {
            return marked(content);
        } catch (error) {
            console.error('Error parsing markdown:', error);
            return content;
        }
    }

    async loadContent(collection, slug) {
        const cacheKey = `${collection}:${slug}`;
        const cached = this.getCached(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        const filePath = `${this.baseUrl}${collection}/${slug}.md`;
        const content = await this.fetchFile(filePath);
        
        if (!content) {
            return null;
        }
        
        const parsed = this.parseFrontmatter(content);
        if (parsed.error) {
            return null;
        }
        
        const htmlBody = this.parseMarkdown(parsed.body);
        const result = {
            ...parsed.frontmatter,
            body: htmlBody,
            rawBody: parsed.body,
            collection,
            slug
        };
        
        this.setCached(cacheKey, result);
        return result;
    }

    async loadCollection(collection) {
        const cacheKey = `collection:${collection}`;
        const cached = this.getCached(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        const dirPath = `${this.baseUrl}${collection}/`;
        const files = await this.listFiles(dirPath);
        
        const promises = files
            .filter(file => file.endsWith('.md'))
            .map(file => {
                const slug = file.replace('.md', '');
                return this.loadContent(collection, slug);
            });
        
        const results = await Promise.allSettled(promises);
        const items = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .map(result => result.value)
            .filter(item => item.active !== false);
        
        this.setCached(cacheKey, items);
        return items;
    }

    async loadSettings() {
        const cacheKey = 'settings:global';
        const cached = this.getCached(cacheKey);
        
        if (cached) {
            return cached;
        }
        
        const filePath = `${this.baseUrl}settings/global.yml`;
        const content = await this.fetchFile(filePath);
        
        if (!content) {
            return null;
        }
        
        let settings;
        try {
            settings = jsyaml.load(content);
        } catch (error) {
            console.error('Error parsing settings:', error);
            settings = {};
        }
        
        this.setCached(cacheKey, settings);
        return settings;
    }

    async listFiles(dirPath) {
        try {
            const response = await fetch(dirPath);
            if (!response.ok) {
                return [];
            }
            
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            const links = doc.querySelectorAll('a');
            return Array.from(links).map(link => link.textContent);
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }

    getCached(key) {
        const item = this.cache[key];
        if (!item) return null;
        
        const age = Date.now() - item.timestamp;
        if (age > this.cacheTime) {
            delete this.cache[key];
            return null;
        }
        
        return item.data;
    }

    setCached(key, data) {
        this.cache[key] = {
            data,
            timestamp: Date.now()
        };
    }

    clearCache() {
        this.cache = {};
    }

    // Fallback content for when CMS is unavailable
    getFallbackContent(collection, slug) {
        const fallbacks = {
            services: {
                'remont-kvartir': {
                    title: 'Ремонт квартир',
                    description: 'Качественный ремонт любой сложности',
                    body: '<p>Профессиональный ремонт квартир любой сложности. От косметического обновления до полного евроремонта с перепланировкой.</p>',
                    icon: '🔧'
                }
            },
            portfolio: {
                'dom-podmoskovye': {
                    title: 'Жилой дом в Подмосковье',
                    description: 'Строительство двухэтажного жилого дома',
                    body: '<p>Построен двухэтажный жилой дом площадью 250 м². Выполнены все работы: фундамент, стены, кровля, внешняя и внутренняя отделка.</p>',
                    category: 'Строительство'
                }
            }
        };
        
        return fallbacks[collection]?.[slug] || null;
    }

    // Utility methods for common operations
    createServiceCard(service) {
        return `
            <div class="service-card">
                <div class="service-icon">${service.icon || '⭐'}</div>
                <h3 class="service-title">${service.title}</h3>
                <p class="service-description">${service.description}</p>
                ${service.price_from || service.price_to ? `
                    <p class="service-price">
                        ${service.price_from ? '№' + service.price_from.toLocaleString() : ''}
                        ${service.price_from && service.price_to ? ' - ' : ''}
                        ${service.price_to ? '№' + service.price_to.toLocaleString() : ''}
                    </p>
                ` : ''}
                <a href="#" class="service-link" data-slug="${service.slug}">Подробнее →</a>
            </div>
        `;
    }

    createPortfolioItem(project) {
        return `
            <div class="portfolio-item">
                <img src="${project.image || '/assets/images/placeholder.jpg'}" 
                     alt="${project.title}" 
                     class="portfolio-img" 
                     loading="lazy">
                <div class="portfolio-overlay">
                    <span class="portfolio-category">${project.category}</span>
                    <h3 class="portfolio-title">${project.title}</h3>
                    <p class="portfolio-location">${project.location}</p>
                    ${project.area ? `<p class="portfolio-area">${project.area} м²</p>` : ''}
                </div>
            </div>
        `;
    }

    // Event handlers for dynamic content
    setupServiceLinks() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.service-link')) {
                e.preventDefault();
                const link = e.target.closest('.service-link');
                const slug = link.dataset.slug;
                if (slug) {
                    this.loadServicePage(slug);
                }
            }
        });
    }

    async loadServicePage(slug) {
        const service = await this.loadContent('services', slug);
        if (!service) {
            console.error('Service not found:', slug);
            return;
        }
        
        // Create service detail page
        const html = `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${service.title} - ${service.site_title || 'АСБ РУМ ПРО'}</title>
                <meta name="description" content="${service.description}">
                <link rel="stylesheet" href="/src/css/main.css">
                <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
            </head>
            <body>
                <nav class="nav">
                    <a href="/" class="nav-logo">АСБ <span>РУМ</span> ПРО</a>
                    <a href="/" class="nav-back">← Вернуться на главную</a>
                </nav>
                
                <section class="service-detail">
                    <div class="container">
                        <div class="service-header">
                            <div class="service-icon">${service.icon || '⭐'}</div>
                            <h1 class="service-title">${service.title}</h1>
                            <p class="service-description">${service.description}</p>
                        </div>
                        
                        <div class="service-content">
                            ${service.body}
                        </div>
                        
                        ${service.price_from || service.price_to ? `
                            <div class="service-pricing">
                                <h3>Стоимость работ</h3>
                                <p>
                                    ${service.price_from ? '№' + service.price_from.toLocaleString() : ''}
                                    ${service.price_from && service.price_to ? ' - ' : ''}
                                    ${service.price_to ? '№' + service.price_to.toLocaleString() : ''}
                                </p>
                            </div>
                        ` : ''}
                        
                        <div class="service-cta">
                            <a href="/#contact" class="btn btn-primary">Заказать услугу</a>
                            <a href="/" class="btn btn-outline">На главную</a>
                        </div>
                    </div>
                </section>
            </body>
            </html>
        `;
        
        // Create and open new window
        const win = window.open();
        win.document.write(html);
        win.document.close();
    }
}

// Initialize CMS loader when DOM is ready
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cmsLoader = new CMSLoader();
        window.cmsLoader.init();
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CMSLoader;
}