(function() {
    'use strict';

    // ========================================
    // Dados dos Produtos
    // ========================================
    var PRODUTOS_PADRAO = [
        {
            id: 1,
            nome: 'Jaqueta Tech Runner',
            descricao: 'Jaqueta esportiva com tecido impermeável e respirável, ideal para corrida.',
            preco: 349.90,
            categoria: 'jaquetas',
            tamanhos: ['P', 'M', 'G', 'GG'],
            cor: 'Preto',
            imagem: '',
            estoque: 15,
            esporte: 'corrida'
        },
        {
            id: 2,
            nome: 'Calça Jogger Sport',
            descricao: 'Calça jogger com tecnologia dry-fit para máximo conforto durante treinos.',
            preco: 189.90,
            categoria: 'calcas',
            tamanhos: ['P', 'M', 'G', 'GG'],
            cor: 'Cinza',
            imagem: '',
            estoque: 22,
            esporte: 'academia'
        },
        {
            id: 3,
            nome: 'Camiseta Performance UV',
            descricao: 'Camiseta com proteção UV50+ e secagem rápida para atividades ao ar livre.',
            preco: 99.90,
            categoria: 'camisetas',
            tamanhos: ['P', 'M', 'G', 'GG', 'XG'],
            cor: 'Branco',
            imagem: '',
            estoque: 40,
            esporte: 'corrida'
        },
        {
            id: 4,
            nome: 'Moletom Urban Fit',
            descricao: 'Moletom com capuz, bolso canguru e tecido térmico para dias frios.',
            preco: 259.90,
            categoria: 'moletons',
            tamanhos: ['M', 'G', 'GG'],
            cor: 'Preto',
            imagem: '',
            estoque: 18,
            esporte: 'corrida'
        },
        {
            id: 5,
            nome: 'Shorts Training Pro',
            descricao: 'Shorts leve com bolsos laterais e elástico ajustável. Perfeito para academia.',
            preco: 119.90,
            categoria: 'shorts',
            tamanhos: ['P', 'M', 'G', 'GG'],
            cor: 'Azul Marinho',
            imagem: '',
            estoque: 30,
            esporte: 'academia'
        },
        {
            id: 6,
            nome: 'Regata Dry Motion',
            descricao: 'Regata esportiva com tecido ultra leve e ventilação estratégica.',
            preco: 79.90,
            categoria: 'camisetas',
            tamanhos: ['P', 'M', 'G'],
            cor: 'Cinza',
            imagem: '',
            estoque: 25,
            esporte: 'academia'
        },
        {
            id: 7,
            nome: 'Jaqueta Windbreaker',
            descricao: 'Corta-vento leve e compacto, ideal para corridas matinais.',
            preco: 279.90,
            categoria: 'jaquetas',
            tamanhos: ['P', 'M', 'G', 'GG'],
            cor: 'Verde Militar',
            imagem: '',
            estoque: 12,
            esporte: 'corrida'
        },
        {
            id: 8,
            nome: 'Calça Legging Flex',
            descricao: 'Legging de compressão com cintura alta e tecido antibacteriano.',
            preco: 149.90,
            categoria: 'calcas',
            tamanhos: ['P', 'M', 'G'],
            cor: 'Preto',
            imagem: '',
            estoque: 35,
            esporte: 'academia'
        }
    ];

    // ========================================
    // Gerenciamento de Produtos (localStorage)
    // ========================================
    function getProdutos() {
        var saved = localStorage.getItem('tw_produtos');
        if (saved) return JSON.parse(saved);
        localStorage.setItem('tw_produtos', JSON.stringify(PRODUTOS_PADRAO));
        return PRODUTOS_PADRAO;
    }

    function salvarProdutos(produtos) {
        localStorage.setItem('tw_produtos', JSON.stringify(produtos));
    }

    function getProdutoPorId(id) {
        var produtos = getProdutos();
        for (var i = 0; i < produtos.length; i++) {
            if (produtos[i].id === id) return produtos[i];
        }
        return null;
    }

    function adicionarProduto(produto) {
        var produtos = getProdutos();
        produto.id = produtos.length > 0 ? Math.max.apply(null, produtos.map(function(p) { return p.id; })) + 1 : 1;
        produtos.push(produto);
        salvarProdutos(produtos);
        return produto;
    }

    function editarProduto(id, dados) {
        var produtos = getProdutos();
        for (var i = 0; i < produtos.length; i++) {
            if (produtos[i].id === id) {
                for (var key in dados) {
                    if (dados.hasOwnProperty(key)) produtos[i][key] = dados[key];
                }
                salvarProdutos(produtos);
                return produtos[i];
            }
        }
        return null;
    }

    function removerProduto(id) {
        var produtos = getProdutos();
        produtos = produtos.filter(function(p) { return p.id !== id; });
        salvarProdutos(produtos);
    }

    // ========================================
    // Carrinho de Compras
    // ========================================
    function getCarrinho() {
        var saved = localStorage.getItem('tw_carrinho');
        return saved ? JSON.parse(saved) : [];
    }

    function salvarCarrinho(carrinho) {
        localStorage.setItem('tw_carrinho', JSON.stringify(carrinho));
        atualizarBadgeCarrinho();
    }

    function adicionarAoCarrinho(produtoId, tamanho, quantidade) {
        quantidade = quantidade || 1;
        var carrinho = getCarrinho();
        var existente = null;
        for (var i = 0; i < carrinho.length; i++) {
            if (carrinho[i].produtoId === produtoId && carrinho[i].tamanho === tamanho) {
                existente = carrinho[i];
                break;
            }
        }
        if (existente) {
            existente.quantidade += quantidade;
        } else {
            carrinho.push({ produtoId: produtoId, tamanho: tamanho, quantidade: quantidade });
        }
        salvarCarrinho(carrinho);
    }

    function removerDoCarrinho(produtoId, tamanho) {
        var carrinho = getCarrinho();
        carrinho = carrinho.filter(function(item) {
            return !(item.produtoId === produtoId && item.tamanho === tamanho);
        });
        salvarCarrinho(carrinho);
    }

    function alterarQuantidade(produtoId, tamanho, novaQtd) {
        if (novaQtd < 1) return removerDoCarrinho(produtoId, tamanho);
        var carrinho = getCarrinho();
        for (var i = 0; i < carrinho.length; i++) {
            if (carrinho[i].produtoId === produtoId && carrinho[i].tamanho === tamanho) {
                carrinho[i].quantidade = novaQtd;
                break;
            }
        }
        salvarCarrinho(carrinho);
    }

    function limparCarrinho() {
        localStorage.removeItem('tw_carrinho');
        atualizarBadgeCarrinho();
    }

    function getTotalCarrinho() {
        var carrinho = getCarrinho();
        var total = 0;
        for (var i = 0; i < carrinho.length; i++) {
            var produto = getProdutoPorId(carrinho[i].produtoId);
            if (produto) total += produto.preco * carrinho[i].quantidade;
        }
        return total;
    }

    function getQtdCarrinho() {
        var carrinho = getCarrinho();
        var qtd = 0;
        for (var i = 0; i < carrinho.length; i++) qtd += carrinho[i].quantidade;
        return qtd;
    }

    function atualizarBadgeCarrinho() {
        var badges = document.querySelectorAll('.cart-badge');
        var qtd = getQtdCarrinho();
        badges.forEach(function(badge) {
            badge.textContent = qtd;
            badge.style.display = qtd > 0 ? 'flex' : 'none';
        });
    }

    // ========================================
    // Usuários e Autenticação
    // ========================================
    function getUsuarios() {
        var saved = localStorage.getItem('tw_usuarios');
        return saved ? JSON.parse(saved) : [];
    }

    function registrarUsuario(nome, email, senha) {
        var usuarios = getUsuarios();
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].email === email) return { erro: 'E-mail já cadastrado' };
        }
        var novoUsuario = {
            id: Date.now(),
            nome: nome,
            email: email,
            senha: btoa(senha), // encoding simples para protótipo
            criadoEm: new Date().toISOString()
        };
        usuarios.push(novoUsuario);
        localStorage.setItem('tw_usuarios', JSON.stringify(usuarios));
        return { sucesso: true, usuario: novoUsuario };
    }

    function loginUsuario(email, senha) {
        var usuarios = getUsuarios();
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].email === email && usuarios[i].senha === btoa(senha)) {
                var sessao = { id: usuarios[i].id, nome: usuarios[i].nome, email: usuarios[i].email };
                localStorage.setItem('tw_sessao', JSON.stringify(sessao));
                return { sucesso: true, usuario: sessao };
            }
        }
        return { erro: 'E-mail ou senha incorretos' };
    }

    function getUsuarioLogado() {
        var saved = localStorage.getItem('tw_sessao');
        return saved ? JSON.parse(saved) : null;
    }

    function logout() {
        localStorage.removeItem('tw_sessao');
        window.location.href = 'login.html';
    }

    // ========================================
    // Pedidos
    // ========================================
    function getPedidos() {
        var saved = localStorage.getItem('tw_pedidos');
        return saved ? JSON.parse(saved) : [];
    }

    function criarPedido(endereco) {
        var carrinho = getCarrinho();
        if (carrinho.length === 0) return { erro: 'Carrinho vazio' };
        var usuario = getUsuarioLogado();
        var itens = [];
        for (var i = 0; i < carrinho.length; i++) {
            var produto = getProdutoPorId(carrinho[i].produtoId);
            if (produto) {
                itens.push({
                    produtoId: produto.id,
                    nome: produto.nome,
                    preco: produto.preco,
                    tamanho: carrinho[i].tamanho,
                    quantidade: carrinho[i].quantidade,
                    subtotal: produto.preco * carrinho[i].quantidade
                });
            }
        }
        var pedido = {
            id: Date.now(),
            usuarioId: usuario ? usuario.id : null,
            itens: itens,
            total: getTotalCarrinho(),
            endereco: endereco,
            status: 'Confirmado',
            data: new Date().toISOString()
        };
        var pedidos = getPedidos();
        pedidos.unshift(pedido);
        localStorage.setItem('tw_pedidos', JSON.stringify(pedidos));
        limparCarrinho();
        return { sucesso: true, pedido: pedido };
    }

    // ========================================
    // Formatar moeda
    // ========================================
    function formatarPreco(valor) {
        return 'R$ ' + valor.toFixed(2).replace('.', ',');
    }

    // ========================================
    // Expor API global
    // ========================================
    window.TechWear = {
        getProdutos: getProdutos,
        getProdutoPorId: getProdutoPorId,
        adicionarProduto: adicionarProduto,
        editarProduto: editarProduto,
        removerProduto: removerProduto,
        getCarrinho: getCarrinho,
        adicionarAoCarrinho: adicionarAoCarrinho,
        removerDoCarrinho: removerDoCarrinho,
        alterarQuantidade: alterarQuantidade,
        limparCarrinho: limparCarrinho,
        getTotalCarrinho: getTotalCarrinho,
        getQtdCarrinho: getQtdCarrinho,
        atualizarBadgeCarrinho: atualizarBadgeCarrinho,
        registrarUsuario: registrarUsuario,
        loginUsuario: loginUsuario,
        getUsuarioLogado: getUsuarioLogado,
        logout: logout,
        getPedidos: getPedidos,
        criarPedido: criarPedido,
        formatarPreco: formatarPreco
    };

    // Atualizar badge ao carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', atualizarBadgeCarrinho);
    } else {
        atualizarBadgeCarrinho();
    }
})();
