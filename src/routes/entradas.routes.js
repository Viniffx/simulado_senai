const express = require('express');
const pool = require('../database');

const router = express.Router();


// REGISTRAR ENTRADA
router.post('/', async (req, res) => {

    const {
        id_produto,
        quantidade,
        data_entrada
    } = req.body;

    if (!id_produto || !quantidade || !data_entrada) {
        return res.status(400).json({
            erro: 'Produto, quantidade e data de entrada são obrigatórios'
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

        // Verifica se o produto existe
        const [produtos] = await conexao.query(
            'SELECT * FROM produtos WHERE id_produto = ?',
            [id_produto]
        );

        if (produtos.length === 0) {
            await conexao.rollback();

            return res.status(404).json({
                erro: 'Produto não encontrado'
            });
        }

        // Registra a entrada
        await conexao.query(`
            INSERT INTO entradas
                (id_produto, quantidade, data_entrada)
            VALUES (?, ?, ?)
        `, [
            id_produto,
            quantidade,
            data_entrada
        ]);

        // Atualiza o estoque atual
        await conexao.query(`
            UPDATE produtos
            SET quantidade = quantidade + ?
            WHERE id_produto = ?
        `, [
            quantidade,
            id_produto
        ]);

        await conexao.commit();

        console.log(
            `Entrada registrada: produto ${id_produto}, quantidade ${quantidade}`
        );

        res.status(201).json({
            mensagem: 'Entrada registrada com sucesso'
        });

    } catch (erro) {

        await conexao.rollback();

        console.error(erro);

        res.status(500).json({
            erro: 'Erro ao registrar entrada'
        });

    } finally {
        conexao.release();
    }
});

module.exports = router;