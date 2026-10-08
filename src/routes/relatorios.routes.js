const express = require('express');
const pool = require('../database');

const router = express.Router();


// ============================================================
// VALOR TOTAL POR CATEGORIA
// ============================================================

router.get('/categorias', async (req, res) => {

    try {

        const [resultado] = await pool.query(`
            SELECT
                categoria,
                SUM(quantidade * valor_unitario) AS valor_total
            FROM produtos
            GROUP BY categoria
            ORDER BY categoria
        `);

        res.json(resultado);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao gerar relatório por categoria'
        });
    }
});

// RELATÓRIO DE MOVIMENTAÇÕES POR PERÍODO
router.get('/movimentacoes', async (req, res) => {
    const { dataInicial, dataFinal } = req.query;

    if (!dataInicial || !dataFinal) {
        return res.status(400).json({
            erro: 'Informe dataInicial e dataFinal'
        });
    }

    if (dataInicial > dataFinal) {
        return res.status(400).json({
            erro: 'A data inicial não pode ser maior que a data final'
        });
    }

    try {
        const [resultado] = await pool.query(`
            SELECT
                p.nome AS produto,
                p.unidade_medida,
                COALESCE(e.total_entradas, 0) AS total_entradas,
                COALESCE(s.total_saidas, 0) AS total_saidas,
                COALESCE(e.total_entradas, 0) -
                COALESCE(s.total_saidas, 0) AS saldo_periodo,
                COALESCE(e.valor_entradas, 0) AS valor_total_financeiro_entradas,
                COALESCE(s.valor_saidas, 0) AS valor_total_financeiro_saidas

            FROM produtos p

            LEFT JOIN (
                SELECT
                    e.id_produto,
                    SUM(e.quantidade) AS total_entradas,
                    SUM(e.quantidade * p2.valor_unitario) AS valor_entradas
                FROM entradas e
                INNER JOIN produtos p2
                    ON p2.id_produto = e.id_produto
                WHERE e.data_entrada BETWEEN ? AND ?
                GROUP BY e.id_produto
            ) e
                ON e.id_produto = p.id_produto

            LEFT JOIN (
                SELECT
                    s.id_produto,
                    SUM(s.quantidade) AS total_saidas,
                    SUM(s.quantidade * p3.valor_unitario) AS valor_saidas
                FROM saidas s
                INNER JOIN produtos p3
                    ON p3.id_produto = s.id_produto
                WHERE s.data_saida BETWEEN ? AND ?
                GROUP BY s.id_produto
            ) s
                ON s.id_produto = p.id_produto

            WHERE e.id_produto IS NOT NULL
               OR s.id_produto IS NOT NULL

            ORDER BY p.nome
        `, [
            dataInicial,
            dataFinal,
            dataInicial,
            dataFinal
        ]);

        res.json(resultado);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao gerar relatório de movimentações',
            detalhe: erro.message
        });
    }
});

// RELATÓRIO DE PRODUTOS COM MAIOR VOLUME DE SAÍDAS
router.get('/maiores-saidas', async (req, res) => {
    const { dataInicial, dataFinal } = req.query;

    if (!dataInicial || !dataFinal) {
        return res.status(400).json({
            erro: 'Informe dataInicial e dataFinal'
        });
    }

    if (dataInicial > dataFinal) {
        return res.status(400).json({
            erro: 'A data inicial não pode ser maior que a data final'
        });
    }

    try {
        const [resultado] = await pool.query(`
            SELECT
                p.nome AS produto,
                SUM(s.quantidade) AS total_saida_quantidade,
                SUM(s.quantidade * p.valor_unitario) AS valor_total_financeiro_saidas
            FROM saidas s
            INNER JOIN produtos p
                ON p.id_produto = s.id_produto
            WHERE s.data_saida BETWEEN ? AND ?
            GROUP BY
                p.id_produto,
                p.nome
            ORDER BY total_saida_quantidade DESC
        `, [
            dataInicial,
            dataFinal
        ]);

        res.json(resultado);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao gerar relatório de maiores saídas',
            detalhe: erro.message
        });
    }
});

// RELATÓRIO DE PRODUTOS NOS LIMITES DE ESTOQUE
router.get('/limites-estoque', async (req, res) => {
    try {
        const [resultado] = await pool.query(`
            SELECT
                id_produto,
                nome AS produto,
                categoria,
                unidade_medida,
                quantidade AS estoque_atual,
                0 AS limite_minimo,
                100 AS limite_maximo,
                ROUND((quantidade / 100) * 100, 2) AS percentual_nivel_estoque,
                CASE
                    WHEN quantidade <= 0 THEN 'mínimo'
                    ELSE 'máximo'
                END AS limite_atingido
            FROM produtos
            WHERE quantidade <= 0
               OR quantidade >= 100
            ORDER BY quantidade, nome
        `);

        if (resultado.length === 0) {
            return res.json({
                mensagem: 'não existem produtos em limite de estoque no momento'
            });
        }

        res.json(resultado);

    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao gerar relatório de limites de estoque',
            detalhe: erro.message
        });
    }
});

module.exports = router;