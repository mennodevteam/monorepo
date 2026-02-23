(function () {
  window.__preloadAnimationDone = false;

  const preloadContainer = document.getElementById('pre-load-data-container');
  const backgroundColor = localStorage.getItem('appBackgroundColor');
  if (backgroundColor) {
    document.body.style.backgroundColor = backgroundColor;
    if (preloadContainer) {
      preloadContainer.style.backgroundColor = backgroundColor;
    }
  }

  fetch('https://api.menno.pro/shops/baseInfo2/' + location.hostname)
    .then((response) => response.json())
    .then((shop) => {
      if (!shop) return;

      const seoTitle = shop?.seo?.title;
      const title = shop?.title;
      const description = shop?.seo?.description || shop?.description;
      const fav = shop?.fav;
      const scripts = shop?.scripts;

      if (seoTitle || title) document.title = seoTitle || title;

      if (description) {
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
          metaDescription.setAttribute('content', description);
        } else {
          const newMetaDescription = document.createElement('meta');
          newMetaDescription.name = 'description';
          newMetaDescription.content = description;
          document.head.appendChild(newMetaDescription);
        }
      }

      if (fav) {
        const faviconLink = document.querySelector('link[rel="icon"]');
        if (faviconLink) {
          faviconLink.href = fav;
        } else {
          const newFaviconLink = document.createElement('link');
          newFaviconLink.rel = 'icon';
          newFaviconLink.href = fav;
          document.head.appendChild(newFaviconLink);
        }
      }

      const div = document.querySelector('#pre-load-data-container');
      if (div) {
        if (!document.getElementById('preload-typing-style')) {
          const style = document.createElement('style');
          style.id = 'preload-typing-style';
          style.textContent = `
            .preload-typing-cursor {
              display: inline-block;
              margin-inline-start: 2px;
              opacity: 1;
              animation: preload-cursor-blink 900ms step-end infinite;
            }
            @keyframes preload-cursor-blink {
              50% { opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }

        const preloadTitle = title || '';

        const h1 = document.createElement('h1');
        h1.style.fontSize = '24px';
        h1.style.margin = '0';
        h1.style.textAlign = 'center';

        const typedText = document.createElement('span');
        const cursor = document.createElement('span');
        cursor.className = 'preload-typing-cursor';
        cursor.textContent = '|';
        h1.append(typedText, cursor);

        const logo = document.createElement('img');
        logo.src = shop.logo || '';
        logo.alt = shop.title || preloadTitle || 'logo';
        logo.style.borderRadius = '24px';
        logo.style.width = '180px';
        logo.style.height = '180px';
        logo.style.opacity = '0';
        logo.style.transform = 'translateY(8px)';
        logo.style.transition = 'opacity 260ms ease, transform 260ms ease';
        logo.onerror = function () {
          logo.style.display = 'none';
        };

        div.replaceChildren(h1, logo);

        const showLogo = function () {
          cursor.style.display = 'none';
          logo.style.opacity = '1';
          logo.style.transform = 'translateY(0)';
          window.setTimeout(function () {
            window.__preloadAnimationDone = true;
            window.dispatchEvent(new Event('preload-animation-done'));
          }, 280);
        };

        if (!preloadTitle) {
          showLogo();
        } else {
          let index = 0;
          const typingTimer = window.setInterval(function () {
            index += 1;
            typedText.textContent = preloadTitle.slice(0, index);

            if (index >= preloadTitle.length) {
              window.clearInterval(typingTimer);
              window.setTimeout(showLogo, 220);
            }
          }, 40);
        }
      }

      if (scripts) {
        for (const script of scripts) {
          try {
            if (script.active !== false) {
              if (script.head) {
                const scriptContent = decodeURIComponent(script.head);
                const scriptTagRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
                const hasScriptTags = scriptTagRegex.test(scriptContent);

                if (hasScriptTags) {
                  document.head.insertAdjacentHTML('beforeend', scriptContent);
                } else {
                  const scriptElement = document.createElement('script');
                  scriptElement.innerHTML = scriptContent;
                  document.head.appendChild(scriptElement);
                }
              }
              if (script.body) {
                const scriptContent = decodeURIComponent(script.body);
                const scriptTagRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
                const hasScriptTags = scriptTagRegex.test(scriptContent);

                if (hasScriptTags) {
                  document.body.insertAdjacentHTML('beforeend', scriptContent);
                } else {
                  const scriptElement = document.createElement('script');
                  scriptElement.innerHTML = scriptContent;
                  document.body.appendChild(scriptElement);
                }
              }
            }
          } catch (error) {
            console.error(error);
          }
        }
      }
    })
    .catch(() => {
      window.__preloadAnimationDone = true;
      window.dispatchEvent(new Event('preload-animation-done'));
      const div = document.querySelector('#pre-load-data-container');
      if (div) {
        div.remove();
      }
    });
})();
