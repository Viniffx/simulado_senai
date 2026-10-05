const express = require('express');
require('dotenv').config();

const produtosRoutes = require('./routes/produtos.routes');
const entradasRoutes = require('./routes/entradas.routes');
const saidasRoutes = require('./routes/saidas.routes');
const relatoriosRoutes = require('./routes/relatorios.routes');

const app = express();

app.use(express.json());

app.set('json spaces', 4);

app.use('/produtos', produtosRoutes);
app.use('/entradas', entradasRoutes);
app.use('/saidas', saidasRoutes);
app.use('/relatorios', relatoriosRoutes);

app.get('/', (req, res) => {
    res.json({
        mensagem: 'API do Estoque de Limpeza funcionando!'
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});