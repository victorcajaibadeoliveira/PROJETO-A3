// ============================================================
// TechWearDB — Firebase Firestore + Storage
// Sincroniza o catálogo de produtos entre todos os usuários.
// Quando Firebase não está configurado, usa localStorage.
// ============================================================

var TechWearDB = (function () {
    'use strict';

    var db = null;
    var storage = null;
    var _ready = false;

    // --------------------------------------------------------
    // Inicialização
    // --------------------------------------------------------
    function init(callback) {
        try {
            var cfg = (typeof firebaseConfig !== 'undefined') ? firebaseConfig : null;
            if (!cfg || cfg.apiKey === 'COLE_AQUI') {
                console.info('[TechWearDB] Config não preenchida — usando localStorage.');
                if (callback) callback(null);
                return;
            }

            if (!firebase.apps.length) {
                firebase.initializeApp(cfg);
            }
            db = firebase.firestore();
            storage = firebase.storage();

            // Busca produtos do Firestore e salva no localStorage
            db.collection('produtos').orderBy('id').get()
                .then(function (snapshot) {
                    if (!snapshot.empty) {
                        var produtos = [];
                        snapshot.forEach(function (doc) { produtos.push(doc.data()); });
                        localStorage.setItem('tw_produtos', JSON.stringify(produtos));
                        localStorage.setItem('tw_dados_versao', 'firebase');
                    } else {
                        // Primeiro uso: envia produtos padrão para o Firestore
                        _seedProdutos();
                    }
                    _ready = true;
                    if (callback) callback(null);
                })
                .catch(function (err) {
                    console.warn('[TechWearDB] Sync falhou, usando localStorage:', err);
                    if (callback) callback(err);
                });
        } catch (e) {
            console.warn('[TechWearDB] Init falhou:', e);
            if (callback) callback(e);
        }
    }

    // --------------------------------------------------------
    // Seed: envia os produtos padrão do localStorage para o Firestore
    // --------------------------------------------------------
    function _seedProdutos() {
        if (!db) return;
        var produtos = JSON.parse(localStorage.getItem('tw_produtos') || '[]');
        if (produtos.length === 0) return;
        var batch = db.batch();
        produtos.forEach(function (p) {
            batch.set(db.collection('produtos').doc(String(p.id)), p);
        });
        batch.commit().catch(function (e) {
            console.error('[TechWearDB] Seed falhou:', e);
        });
    }

    // --------------------------------------------------------
    // Próximo ID sequencial
    // --------------------------------------------------------
    function _proximoId() {
        var produtos = JSON.parse(localStorage.getItem('tw_produtos') || '[]');
        if (produtos.length === 0) return 1;
        return Math.max.apply(null, produtos.map(function (p) { return p.id; })) + 1;
    }

    // --------------------------------------------------------
    // Upload de imagem para o Storage
    // --------------------------------------------------------
    function _uploadImagem(file, produtoId) {
        if (!storage || !file) return Promise.resolve(null);
        var ext = file.name.split('.').pop().toLowerCase();
        var path = 'produtos/' + produtoId + '_' + Date.now() + '.' + ext;
        var ref = storage.ref(path);
        return ref.put(file).then(function () {
            return ref.getDownloadURL();
        });
    }

    // --------------------------------------------------------
    // CRUD de Produtos
    // --------------------------------------------------------
    function adicionarProduto(dadosProduto, imagemFile) {
        if (!db) {
            // Fallback: localStorage apenas
            var p = TechWear.adicionarProduto(dadosProduto);
            return Promise.resolve(p);
        }
        var novoId = _proximoId();
        dadosProduto.id = novoId;

        return _uploadImagem(imagemFile, novoId).then(function (url) {
            if (url) dadosProduto.imagem = url;
            return db.collection('produtos').doc(String(novoId)).set(dadosProduto)
                .then(function () {
                    var produtos = JSON.parse(localStorage.getItem('tw_produtos') || '[]');
                    produtos.push(dadosProduto);
                    localStorage.setItem('tw_produtos', JSON.stringify(produtos));
                    return dadosProduto;
                });
        });
    }

    function editarProduto(id, dados, imagemFile) {
        if (!db) {
            TechWear.editarProduto(id, dados);
            return Promise.resolve(dados);
        }

        return _uploadImagem(imagemFile, id).then(function (url) {
            if (url) dados.imagem = url;
            return db.collection('produtos').doc(String(id)).update(dados)
                .then(function () {
                    var produtos = JSON.parse(localStorage.getItem('tw_produtos') || '[]');
                    for (var i = 0; i < produtos.length; i++) {
                        if (produtos[i].id === id) {
                            for (var k in dados) {
                                if (dados.hasOwnProperty(k)) produtos[i][k] = dados[k];
                            }
                            break;
                        }
                    }
                    localStorage.setItem('tw_produtos', JSON.stringify(produtos));
                    return dados;
                });
        });
    }

    function removerProduto(id) {
        if (!db) {
            TechWear.removerProduto(id);
            return Promise.resolve();
        }

        return db.collection('produtos').doc(String(id)).delete()
            .then(function () {
                var produtos = JSON.parse(localStorage.getItem('tw_produtos') || '[]');
                produtos = produtos.filter(function (p) { return p.id !== id; });
                localStorage.setItem('tw_produtos', JSON.stringify(produtos));
            });
    }

    return {
        init: init,
        isReady: function () { return _ready; },
        adicionarProduto: adicionarProduto,
        editarProduto: editarProduto,
        removerProduto: removerProduto
    };
})();
