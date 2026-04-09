/**
 * WearIA — Busca Visual Inteligente
 * Integra com backend FastAPI (YOLO + CLIP + Cor HEX)
 */
(function () {
    'use strict';

    var API_BASE = 'http://localhost:8000/api';

    // DOM
    var uploadZone = document.getElementById('uploadZone');
    var imageInput = document.getElementById('imageInput');
    var uploadPlaceholder = document.getElementById('uploadPlaceholder');
    var uploadPreview = document.getElementById('uploadPreview');
    var previewImg = document.getElementById('previewImg');
    var removeImg = document.getElementById('removeImg');
    var searchBtn = document.getElementById('searchBtn');
    var detectionCard = document.getElementById('detectionCard');
    var colorSwatch = document.getElementById('colorSwatch');
    var colorHex = document.getElementById('colorHex');
    var detectedCategory = document.getElementById('detectedCategory');
    var loadingSection = document.getElementById('loadingSection');
    var resultsSection = document.getElementById('resultsSection');
    var resultsGrid = document.getElementById('resultsGrid');
    var resultsCount = document.getElementById('resultsCount');
    var emptyState = document.getElementById('emptyState');
    var noResultsState = document.getElementById('noResultsState');
    var notFoundModal = document.getElementById('notFoundModal');
    var notFoundSwatch = document.getElementById('notFoundSwatch');
    var notFoundHex = document.getElementById('notFoundHex');
    var notFoundClose = document.getElementById('notFoundClose');
    var howItWorksModal = document.getElementById('howItWorksModal');
    var howItWorksClose = document.getElementById('howItWorksClose');
    var helpBtn = document.getElementById('helpBtn');
    var filtroEsporte = document.getElementById('filtroEsporte');
    var filtroCategoria = document.getElementById('filtroCategoria');
    var othersSection = document.getElementById('othersSection');
    var othersRow = document.getElementById('othersRow');
    var othersCatLabel = document.getElementById('othersCatLabel');
    var othersVerMais = document.getElementById('othersVerMais');

    // Threshold mínimo de similaridade (0–1). Abaixo disso = sem resultado.
    var SIMILARITY_THRESHOLD = 0.60;

    if (notFoundClose) {
        notFoundClose.addEventListener('click', function () {
            notFoundModal.style.display = 'none';
        });
    }

    // Abre o modal "Como funciona?" ao entrar na página
    if (howItWorksModal) {
        howItWorksModal.style.display = 'flex';
    }
    if (howItWorksClose) {
        howItWorksClose.addEventListener('click', function () {
            howItWorksModal.style.display = 'none';
        });
    }
    if (helpBtn) {
        helpBtn.addEventListener('click', function () {
            howItWorksModal.style.display = 'flex';
        });
    }

    // Modal
    var productModal = document.getElementById('productModal');
    var modalClose = document.getElementById('modalClose');
    var modalImg = document.getElementById('modalImg');
    var modalName = document.getElementById('modalName');
    var modalDesc = document.getElementById('modalDesc');
    var modalPrice = document.getElementById('modalPrice');
    var modalColor = document.getElementById('modalColor');
    var modalSizes = document.getElementById('modalSizes');
    var modalScoreValue = document.getElementById('modalScoreValue');
    var addToCartBtn = document.getElementById('addToCartBtn');
    var qtyMinus = document.getElementById('qtyMinus');
    var qtyPlus = document.getElementById('qtyPlus');
    var qtyValue = document.getElementById('qtyValue');

    var selectedFile = null;
    var currentQty = 1;
    var currentModalProduct = null;
    var currentModalSize = null;

    // ========================================
    // Upload de imagem
    // ========================================
    uploadZone.addEventListener('click', function () {
        imageInput.click();
    });

    imageInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (file) handleFile(file);
    });

    // Drag & Drop
    uploadZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', function () {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', function (e) {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        var file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFile(file);
    });

    removeImg.addEventListener('click', function (e) {
        e.stopPropagation();
        clearImage();
    });

    function handleFile(file) {
        if (file.size > 10 * 1024 * 1024) {
            showToast('Imagem muito grande. Máximo 10MB.');
            return;
        }
        selectedFile = file;
        var reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            uploadPlaceholder.style.display = 'none';
            uploadPreview.style.display = 'flex';
            searchBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    function clearImage() {
        selectedFile = null;
        imageInput.value = '';
        previewImg.src = '';
        uploadPlaceholder.style.display = '';
        uploadPreview.style.display = 'none';
        searchBtn.disabled = true;
        detectionCard.style.display = 'none';
        resultsSection.style.display = 'none';
        noResultsState.style.display = 'none';
        othersSection.style.display = 'none';
        emptyState.style.display = '';
    }

    // ========================================
    // Busca por imagem
    // ========================================
    searchBtn.addEventListener('click', function () {
        if (!selectedFile) return;
        performSearch();
    });

    function performSearch() {
        // Mostrar loading
        emptyState.style.display = 'none';
        resultsSection.style.display = 'none';
        othersSection.style.display = 'none';
        detectionCard.style.display = 'none';
        noResultsState.style.display = 'none';
        loadingSection.style.display = '';
        searchBtn.disabled = true;

        // Primeiro sincronizar catálogo, depois buscar
        syncCatalog().then(function () {
            return uploadAndSearch();
        }).catch(function (err) {
            // Se o backend não estiver disponível, usar busca local (fallback)
            console.warn('Backend indisponível, usando busca local:', err);
            performLocalSearch();
        }).finally(function () {
            loadingSection.style.display = 'none';
            searchBtn.disabled = false;
        });
    }

    function syncCatalog() {
        var produtos = window.TechWear ? window.TechWear.getProdutos() : [];
        return fetch(API_BASE + '/index-products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produtos)
        }).then(function (r) { return r.json(); });
    }

    function uploadAndSearch() {
        var formData = new FormData();
        formData.append('file', selectedFile);

        return fetch(API_BASE + '/search-by-image', {
            method: 'POST',
            body: formData
        })
        .then(function (res) {
            if (!res.ok) throw new Error('Erro ' + res.status);
            return res.json();
        })
        .then(function (data) {
            showDetection(data.detected_hex, data.detected_category);
            showResults(data.products);
        });
    }

    // ========================================
    // Busca local (fallback quando backend está offline)
    // ========================================

    // Mapa de cores do catálogo (fallback para produtos sem hex_color)
    var colorMap = {
        'preto': '#1a1a1a',
        'branco': '#f5f5f5',
        'cinza': '#808080',
        'azul marinho': '#1b2a4a',
        'verde militar': '#4b5320',
        'vermelho': '#c0392b',
        'azul': '#2980b9',
        'rosa': '#e91e8c',
        'amarelo': '#f1c40f',
        'laranja': '#e67e22',
        'bege': '#d4c5a9',
        'marrom': '#6b4226'
    };

    /**
     * Extrai a cor de fundo analisando as bordas da imagem.
     */
    function extractBackgroundColor(imageData, w, h) {
        var rSum = 0, gSum = 0, bSum = 0, count = 0;
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                // Pegar apenas pixels das bordas (5px de margem)
                if (x < 5 || x >= w - 5 || y < 5 || y >= h - 5) {
                    var idx = (y * w + x) * 4;
                    rSum += imageData[idx];
                    gSum += imageData[idx + 1];
                    bSum += imageData[idx + 2];
                    count++;
                }
            }
        }
        return [
            Math.round(rSum / count),
            Math.round(gSum / count),
            Math.round(bSum / count)
        ];
    }

    /**
     * KMeans simplificado em JS para encontrar clusters de cor.
     */
    function kmeansColors(pixels, k, maxIter) {
        k = k || 4;
        maxIter = maxIter || 15;

        // Inicializar centroids com pixels aleatórios espalhados
        var centroids = [];
        var step = Math.max(1, Math.floor(pixels.length / k));
        for (var i = 0; i < k; i++) {
            centroids.push(pixels[Math.min(i * step, pixels.length - 1)].slice());
        }

        var assignments = new Array(pixels.length);

        for (var iter = 0; iter < maxIter; iter++) {
            // Assign pixels to nearest centroid
            for (var p = 0; p < pixels.length; p++) {
                var minDist = Infinity;
                var best = 0;
                for (var c = 0; c < k; c++) {
                    var d = Math.pow(pixels[p][0] - centroids[c][0], 2) +
                            Math.pow(pixels[p][1] - centroids[c][1], 2) +
                            Math.pow(pixels[p][2] - centroids[c][2], 2);
                    if (d < minDist) { minDist = d; best = c; }
                }
                assignments[p] = best;
            }
            // Recalculate centroids
            var sums = [], counts = [];
            for (var c2 = 0; c2 < k; c2++) { sums.push([0, 0, 0]); counts.push(0); }
            for (var p2 = 0; p2 < pixels.length; p2++) {
                var a = assignments[p2];
                sums[a][0] += pixels[p2][0];
                sums[a][1] += pixels[p2][1];
                sums[a][2] += pixels[p2][2];
                counts[a]++;
            }
            for (var c3 = 0; c3 < k; c3++) {
                if (counts[c3] > 0) {
                    centroids[c3] = [
                        Math.round(sums[c3][0] / counts[c3]),
                        Math.round(sums[c3][1] / counts[c3]),
                        Math.round(sums[c3][2] / counts[c3])
                    ];
                }
            }
        }

        // Retornar centroids com contagens
        var result = [];
        var finalCounts = new Array(k).fill(0);
        for (var p3 = 0; p3 < assignments.length; p3++) finalCounts[assignments[p3]]++;
        for (var c4 = 0; c4 < k; c4++) {
            result.push({ color: centroids[c4], count: finalCounts[c4] });
        }
        return result;
    }

    /**
     * Distância euclidiana entre duas cores RGB
     */
    function colorDist(a, b) {
        return Math.sqrt(
            Math.pow(a[0] - b[0], 2) +
            Math.pow(a[1] - b[1], 2) +
            Math.pow(a[2] - b[2], 2)
        );
    }

    function performLocalSearch() {
        var produtos = window.TechWear ? window.TechWear.getProdutos() : [];

        // Aplicar filtros de esporte e categoria
        var esporteVal = filtroEsporte.value;
        var categoriaVal = filtroCategoria.value;
        if (esporteVal) {
            produtos = produtos.filter(function (p) { return p.esporte === esporteVal; });
        }
        if (categoriaVal) {
            produtos = produtos.filter(function (p) { return p.categoria === categoriaVal; });
        }

        if (!produtos.length) {
            noResultsState.style.display = '';
            return;
        }

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        var img = new window.Image();
        img.onload = function () {
            var W = img.naturalWidth;
            var H = img.naturalHeight;

            // === PASSO 1: Crop central (simular detecção da peça) ===
            // Focar na região central onde a roupa provavelmente está
            var cropX = Math.round(W * 0.20);
            var cropY = Math.round(H * 0.15);
            var cropW = Math.round(W * 0.60);
            var cropH = Math.round(H * 0.55);

            // === PASSO 2: Desenhar imagem completa para detectar fundo ===
            canvas.width = W;
            canvas.height = H;
            ctx.drawImage(img, 0, 0);
            var fullData = ctx.getImageData(0, 0, W, H).data;
            var bgColor = extractBackgroundColor(fullData, W, H);

            // === PASSO 3: Extrair pixels do crop central ===
            var cropData = ctx.getImageData(cropX, cropY, cropW, cropH).data;

            // Coletar pixels que NÃO são similares ao fundo (threshold: 60)
            var clothingPixels = [];
            var bgThreshold = 60;
            for (var i = 0; i < cropData.length; i += 4) {
                var px = [cropData[i], cropData[i + 1], cropData[i + 2]];
                if (colorDist(px, bgColor) > bgThreshold) {
                    clothingPixels.push(px);
                }
            }

            // Se quase tudo foi filtrado, usar todos os pixels do crop
            if (clothingPixels.length < 100) {
                clothingPixels = [];
                for (var j = 0; j < cropData.length; j += 4) {
                    clothingPixels.push([cropData[j], cropData[j + 1], cropData[j + 2]]);
                }
            }

            // Amostrar para performance (max ~2000 pixels)
            if (clothingPixels.length > 2000) {
                var sampled = [];
                var sampleStep = Math.floor(clothingPixels.length / 2000);
                for (var s = 0; s < clothingPixels.length; s += sampleStep) {
                    sampled.push(clothingPixels[s]);
                }
                clothingPixels = sampled;
            }

            // === PASSO 4: KMeans para encontrar cor dominante da roupa ===
            var clusters = kmeansColors(clothingPixels, 4, 15);

            // Ordenar por contagem (maior cluster)
            clusters.sort(function (a, b) { return b.count - a.count; });

            // Pegar o cluster dominante que não é fundo
            var dominantColor = clusters[0].color;
            for (var ci = 0; ci < clusters.length; ci++) {
                if (colorDist(clusters[ci].color, bgColor) > bgThreshold) {
                    dominantColor = clusters[ci].color;
                    break;
                }
            }

            var r = dominantColor[0], g = dominantColor[1], b = dominantColor[2];
            var detectedRGB = [r, g, b];
            var hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);

            // Mostrar filtros aplicados na detecção
            var filterText = [];
            if (esporteVal) filterText.push(esporteVal.charAt(0).toUpperCase() + esporteVal.slice(1));
            if (categoriaVal) filterText.push(categoriaVal.charAt(0).toUpperCase() + categoriaVal.slice(1));
            showDetection(hex, filterText.length ? filterText.join(' · ') : 'Todos');

            // === PASSO 5: Comparar com hex_color cadastrado no produto ===
            var maxDist = 441.67;

            var scored = produtos.map(function (p) {
                // Usar hex_color cadastrado pelo admin, com fallback para mapa de nomes
                var prodHex = p.hex_color || colorMap[p.cor.toLowerCase()] || '#808080';
                if (typeof prodHex !== 'string') prodHex = '#808080';
                var pc = hexToRgb(prodHex);

                var dist = colorDist(detectedRGB, pc);
                var score = 1 - (dist / maxDist);

                return {
                    id: p.id,
                    name: p.nome,
                    hex_color: prodHex,
                    category: p.categoria,
                    price: p.preco,
                    image_url: p.imagem || '',
                    score: Math.round(score * 10000) / 10000
                };
            });

            scored.sort(function (a, b2) { return b2.score - a.score; });

            // Verificar se o melhor resultado é suficientemente parecido
            var bestScore = scored.length > 0 ? scored[0].score : 0;
            if (bestScore < SIMILARITY_THRESHOLD) {
                // Mostrar modal de 'não encontramos nada parecido'
                notFoundSwatch.style.backgroundColor = hex;
                notFoundHex.textContent = hex;
                notFoundModal.style.display = 'flex';
                return;
            }

            showResults(scored.slice(0, 3));
            showOtherProducts(scored.slice(0, 3));
        };
        img.src = previewImg.src;
    }

    /**
     * Converte HEX (#rrggbb) para array [R, G, B].
     */
    function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        return [
            parseInt(hex.substring(0, 2), 16) || 0,
            parseInt(hex.substring(2, 4), 16) || 0,
            parseInt(hex.substring(4, 6), 16) || 0
        ];
    }

    // ========================================
    // Exibição de resultados
    // ========================================
    function showDetection(hex, category) {
        colorSwatch.style.backgroundColor = hex;
        colorHex.textContent = hex;
        detectedCategory.textContent = category;
        detectionCard.style.display = '';
    }

    function showResults(products) {
        resultsGrid.innerHTML = '';
        if (!products || !products.length) {
            resultsCount.textContent = '0 resultados';
            resultsSection.style.display = 'none';
            noResultsState.style.display = '';
            return;
        }

        resultsCount.textContent = products.length + ' resultado' + (products.length > 1 ? 's' : '');
        emptyState.style.display = 'none';
        resultsSection.style.display = '';

        products.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'result-card';
            card.setAttribute('data-id', p.id);

            var scorePercent = Math.round(p.score * 100);

            var imageHtml;
            if (p.image_url && p.image_url.length > 50) {
                imageHtml = '<img src="' + sanitize(p.image_url) + '" alt="' + sanitize(p.name) + '">';
            } else {
                imageHtml = '<span class="material-symbols-outlined no-image">checkroom</span>';
            }

            card.innerHTML =
                '<div class="result-card-image">' + imageHtml + '</div>' +
                '<div class="result-score-badge">' +
                    '<span class="material-symbols-outlined">trending_up</span>' +
                    scorePercent + '%' +
                '</div>' +
                '<div class="result-card-body">' +
                    '<div class="result-card-name">' + sanitize(p.name) + '</div>' +
                    '<div class="result-card-meta">' +
                        '<span class="result-card-price">' + formatPrice(p.price) + '</span>' +
                        '<div class="result-card-color" style="background-color:' + sanitize(p.hex_color) + '"></div>' +
                    '</div>' +
                '</div>';

            card.addEventListener('click', function () {
                openProductModal(p);
            });

            resultsGrid.appendChild(card);
        });
    }

    /**
     * Mostra fileira de outros produtos da mesma categoria, excluindo os já exibidos.
     */
    function showOtherProducts(topResults) {
        othersRow.innerHTML = '';
        othersSection.style.display = 'none';

        var categoriaVal = filtroCategoria.value;
        var esporteVal = filtroEsporte.value;
        if (!categoriaVal) return;

        var topIds = {};
        topResults.forEach(function (p) { topIds[p.id] = true; });

        var allProdutos = window.TechWear ? window.TechWear.getProdutos() : [];
        // Filtra apenas por categoria (sem esporte) para ter mais variedade na fileira
        var others = allProdutos.filter(function (p) {
            if (topIds[p.id]) return false;
            if (p.categoria !== categoriaVal) return false;
            return true;
        });

        if (!others.length) return;

        var catLabel = categoriaVal.charAt(0).toUpperCase() + categoriaVal.slice(1);
        othersCatLabel.textContent = catLabel;

        // Link "Ver mais" → markets filtrado apenas por categoria
        othersVerMais.href = 'markets.html?categoria=' + encodeURIComponent(categoriaVal);

        others.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'others-card';
            card.setAttribute('data-id', p.id);

            var imageHtml;
            if (p.imagem && p.imagem.length > 50) {
                imageHtml = '<img src="' + sanitize(p.imagem) + '" alt="' + sanitize(p.nome) + '">';
            } else {
                imageHtml = '<span class="material-symbols-outlined no-image">checkroom</span>';
            }

            card.innerHTML =
                '<div class="others-card-image">' + imageHtml + '</div>' +
                '<div class="others-card-body">' +
                    '<div class="others-card-name">' + sanitize(p.nome) + '</div>' +
                    '<div class="others-card-price">' + formatPrice(p.preco) + '</div>' +
                '</div>';

            card.addEventListener('click', function () {
                openProductModal({
                    id: p.id,
                    name: p.nome,
                    hex_color: p.hex_color || '#808080',
                    category: p.categoria,
                    price: p.preco,
                    image_url: p.imagem || '',
                    score: 0
                });
            });

            othersRow.appendChild(card);
        });

        othersSection.style.display = '';
    }

    // ========================================
    // Modal
    // ========================================
    function openProductModal(searchResult) {
        var produto = window.TechWear ? window.TechWear.getProdutoPorId(searchResult.id) : null;
        if (!produto) return;

        currentModalProduct = produto;
        currentModalSize = null;
        currentQty = 1;
        qtyValue.textContent = '1';

        if (produto.imagem && produto.imagem.length > 50) {
            modalImg.src = produto.imagem;
            modalImg.style.display = '';
        } else {
            modalImg.src = '';
            modalImg.style.display = 'none';
        }

        modalName.textContent = produto.nome;
        modalDesc.textContent = produto.descricao;
        modalPrice.textContent = formatPrice(produto.preco);
        modalColor.textContent = produto.cor;
        modalScoreValue.textContent = Math.round(searchResult.score * 100) + '%';

        // Tamanhos
        modalSizes.innerHTML = '';
        if (produto.tamanhos) {
            produto.tamanhos.forEach(function (t) {
                var btn = document.createElement('button');
                btn.className = 'size-btn';
                btn.textContent = t;
                btn.addEventListener('click', function () {
                    var btns = modalSizes.querySelectorAll('.size-btn');
                    for (var i = 0; i < btns.length; i++) btns[i].classList.remove('active');
                    btn.classList.add('active');
                    currentModalSize = t;
                });
                modalSizes.appendChild(btn);
            });
        }

        productModal.style.display = 'flex';
    }

    if (modalClose) {
        modalClose.addEventListener('click', function () {
            productModal.style.display = 'none';
        });
    }

    if (productModal) {
        productModal.addEventListener('click', function (e) {
            if (e.target === productModal) productModal.style.display = 'none';
        });
    }

    if (qtyMinus) {
        qtyMinus.addEventListener('click', function () {
            if (currentQty > 1) { currentQty--; qtyValue.textContent = currentQty; }
        });
    }

    if (qtyPlus) {
        qtyPlus.addEventListener('click', function () {
            currentQty++;
            qtyValue.textContent = currentQty;
        });
    }

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', function () {
            if (!currentModalProduct) return;
            if (!currentModalSize) {
                showToast('Selecione um tamanho.');
                return;
            }
            if (window.TechWear) {
                window.TechWear.adicionarAoCarrinho(currentModalProduct.id, currentModalSize, currentQty);
            }
            showToast('Adicionado ao carrinho!');
            productModal.style.display = 'none';
        });
    }

    // ========================================
    // Utilitários
    // ========================================
    function formatPrice(value) {
        return 'R$ ' + Number(value).toFixed(2).replace('.', ',');
    }

    function sanitize(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function showToast(msg) {
        var t = document.createElement('div');
        t.className = 'toast-notification';
        t.textContent = msg;
        t.style.cssText = 'position:fixed;bottom:30px;right:30px;background:var(--accent-copper);color:#1c1c1e;padding:14px 24px;border-radius:10px;font-weight:600;z-index:10000;opacity:0;transform:translateY(20px);transition:all .3s;font-size:15px;';
        document.body.appendChild(t);
        setTimeout(function () { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; }, 10);
        setTimeout(function () {
            t.style.opacity = '0'; t.style.transform = 'translateY(20px)';
            setTimeout(function () { t.remove(); }, 300);
        }, 2500);
    }
})();
