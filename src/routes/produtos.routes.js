const express = require('express');
const pool = require('../database');

const router = express.Router();

// LISTAR TODOS OS PRODUTOS
router.get('/', async (req, res) => {
    try {
        console.log('GET /produtos chamado');

        const [produtos] = await pool.query(`
            SELECT
                id_produto,
                nome,
                categoria,
                unidade_medida,
                quantidade,
                valor_unitario
            FROM produtos
            ORDER BY nome
        `);

        console.log('Produtos encontrados:', produtos);

        res.json(produtos);

    } catch (erro) {
        console.error('ERRO REAL:', erro);

        res.status(500).json({
            erro: 'Erro ao listar produtos',
            detalhe: erro.message
        });
    }
});

// CADASTRAR PRODUTO
router.post('/', async (req, res) => {
    const {
        nome,
        categoria,
        unidade_medida,
        quantidade,
        valor_unitario
    } = req.body;

    if (!categoria || categoria.trim() === '') {
        return res.status(400).json({
            erro: 'A categoria é obrigatória'
        });
    }

    if (
        quantidade === undefined ||
        quantidade === null ||
        !Number.isInteger(Number(quantidade)) ||
        Number(quantidade) < 0
    ) {
        return res.status(400).json({
            erro: 'A quantidade deve ser um número inteiro maior ou igual a zero'
        });
    }

    if (
        valor_unitario === undefined ||
        valor_unitario === null ||
        isNaN(Number(valor_unitario)) ||
        Number(valor_unitario) < 0
    ) {
        return res.status(400).json({
            erro: 'O valor unitário deve ser um número maior ou igual a zero'
        });
    }

    if (!nome || !unidade_medida) {
        return res.status(400).json({
            erro: 'Nome e unidade de medida são obrigatórios'
        });
    }

    try {
        const [resultado] = await pool.query(`
            INSERT INTO produtos
                (nome, categoria, unidade_medida, quantidade, valor_unitario)
            VALUES (?, ?, ?, ?, ?)
        `, [
            nome,
            categoria,
            unidade_medida,
            quantidade,
            valor_unitario
        ]);

        res.status(201).json({
            mensagem: 'Produto cadastrado com sucesso',
            id_produto: resultado.insertId
        });

    } catch (erro) {
        console.error('ERRO AO CADASTRAR:', erro);

        res.status(500).json({
            erro: 'Erro ao cadastrar produto',
            detalhe: erro.message
        });
    }
});

module.exports = router;