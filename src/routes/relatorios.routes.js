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


module.exports = router;