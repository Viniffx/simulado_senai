const express = require('express');
const pool = require('../database');

const router = express.Router();


// REGISTRAR SAÍDA
router.post('/', async (req, res) => {

    const {
        id_produto,
        quantidade,
        data_saida
    } = req.body;

    if (!id_produto || !quantidade || !data_saida) {
        return res.status(400).json({
            erro: 'Produto, quantidade e data de saída são obrigatórios'
        });
    }

    if (!Number.isInteger(Number(quantidade)) || Number(quantidade) <= 0) {
        return res.status(400).json({
            erro: 'A quantidade deve ser um número inteiro maior que zero'
        });
    }

    const conexao = await pool.getConnection();

    try {

        await conexao.beginTransaction();

        const [produtos] = await conexao.query(`
            SELECT *
            FROM produtos
            WHERE id_produto = ?
            FOR UPDATE
        `, [id_produto]);

        if (produtos.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                erro: 'Produto não encontrado'
            });
        }

        const produto = produtos[0];

        // NÃO PERMITIR ESTOQUE NEGATIVO
        if (produto.quantidade < Number(quantidade)) {

            await conexao.rollback();

            return res.status(400).json({
                erro: 'Estoque insuficiente',
                estoque_atual: produto.quantidade
            });
        }

        // Registra saída
        await conexao.query(`
            INSERT INTO saidas
                (id_produto, quantidade, data_saida)
            VALUES (?, ?, ?)
        `, [
            id_produto,
            quantidade,
            data_saida
        ]);

        // SUBTRAI DO ESTOQUE
        await conexao.query(`
            UPDATE produtos
            SET quantidade = quantidade - ?
            WHERE id_produto = ?
        `, [
            quantidade,
            id_produto
        ]);

        await conexao.commit();

        console.log(
            `Saída registrada: produto ${id_produto}, quantidade ${quantidade}`
        );

        res.status(201).json({
            mensagem: 'Saída registrada com sucesso'
        });

    } catch (erro) {

        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao registrar saída'
        });

    } finally {
        conexao.release();
    }
});


// LISTAR SAÍDAS EM ORDEM DECRESCENTE DE DATA
router.get('/', async (req, res) => {

    try {

        const [saidas] = await pool.query(`
            SELECT
                s.id_saida,
                p.nome AS produto,
                s.quantidade,
                s.data_saida
            FROM saidas s
            INNER JOIN produtos p
                ON p.id_produto = s.id_produto
            ORDER BY s.data_saida DESC
        `);

        res.json(saidas);

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao listar saídas'
        });
    }
});


module.exports = router;