const express = require('express');
const path = require('node:path');
const { createCanvas, loadImage, registerFont } = require('canvas');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

// Register fonts
registerFont(path.join(__dirname, '..', 'assets', 'fonts', 'arial.ttf'), { family: 'Arial' });
registerFont(path.join(__dirname, '..', 'assets', 'fonts', 'Rubik-Bold.ttf'), { family: 'Rubik-Bold' });

// Initialize express app
const app = express();

// Security and optimization middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for image API
}));
app.use(compression()); // Compress responses
app.use(cors()); // Enable CORS for all routes

// Import route loader
const loadRoutes = require('./utils/routeLoader');

// Home page route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Página Inicial</title>
    </head>
    <body>
      <h1>Bem-vindo à API Nano</h1>
      <p>Este é um exemplo simples de página inicial.</p>
    </body>
    </html>
  `);
});

// API documentation route
app.get('/api', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Nano</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f9;
          margin: 0;
          padding: 0;
          color: #333;
        }
        h1 {
          background-color: #4CAF50;
          color: white;
          padding: 15px;
          text-align: center;
        }
        h2 {
          color: #4CAF50;
        }
        h3 {
          color: #555;
        }
        p, ul {
          font-size: 16px;
          line-height: 1.6;
          margin: 10px 20px;
        }
        code {
          background-color: #f2f2f2;
          padding: 2px 6px;
          font-family: monospace;
        }
        ul {
          list-style-type: none;
          padding: 0;
        }
        ul li {
          margin: 5px 0;
        }
        .route-section {
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
          margin: 20px;
          padding: 15px;
        }
        .example {
          background-color: #eef9f1;
          border-left: 4px solid #4CAF50;
          padding: 10px;
          margin-bottom: 20px;
        }
        .note {
          background-color: #fff3cd;
          border-left: 4px solid #ffeb3b;
          padding: 10px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <h1>API Nano</h1>
      <p>Bem-vindo à API Nano! Abaixo estão as rotas e parâmetros disponíveis:</p>

      <!-- Rota Perfil -->
      <div class="route-section">
        <h2>Rota: <code>/api/perfil</code></h2>
        <p>Esta rota gera uma imagem de perfil personalizada com base nos parâmetros fornecidos.</p>
        <h3>Parâmetros disponíveis:</h3>
        <ul>
          <li><strong>id</strong>: (opcional) O ID do usuário. Se não fornecido, será usado o ID padrão '1159667835761594449'.</li>
          <li><strong>coins</strong>: (opcional) O valor de coins do usuário, que será abreviado (por exemplo, 2000 vira 2k). Se não fornecido, o valor será 0.</li>
          <li><strong>reps</strong>: (opcional) O valor de reputações (reps) do usuário, que também será abreviado. Se não fornecido, o valor será 0.</li>
          <li><strong>status</strong>: (opcional) O status do usuário, como 'Solteiro(a)', 'Casado(a)', etc. O valor padrão é 'Solteiro(a)'.</li>
          <li><strong>aboutMe</strong>: (opcional) Texto sobre o usuário. O valor padrão é 'Sou um entusiasta\nem tecnologia.'</li>
          <li><strong>banner</strong>: (opcional) Url para imagem do banner sugiro uso do website: https/i.ibb.co/</li>
          <li><strong>json</strong>: (opcional) Se definido como 'true', a resposta será no formato JSON, contendo as informações do usuário. Caso contrário, será gerada uma imagem de perfil em formato PNG.</li>
        </ul>
        <div class="example">
          <p><strong>Exemplo de uso:</strong></p>
          <ul>
            <li><code>/api/perfil?id=123456789&coins=1000&reps=50&status=Casado(a)&aboutMe=Adoro programar</code> - Gera uma imagem de perfil com as informações fornecidas.</li>
            <li><code>/api/perfil?json=true&id=123456789</code> - Retorna as informações do perfil em formato JSON.</li>
          </ul>
        </div>
      </div>

      <!-- Rota Rank -->
      <div class="route-section">
        <h2>Rota: <code>/api/rank</code></h2>
        <p>Esta rota gera um ranking dos 10 principais usuários com base nas suas moedas.</p>
        <h3>Parâmetros disponíveis:</h3>
        <ul>
          <li><strong>data</strong>: (obrigatório) A lista de usuários e suas moedas, fornecida como uma string no formato <code>id:moedas,id2:moedas2,...</code>.</li>
          <li><strong>timestamp</strong>: (opcional) Um timestamp em milissegundos que não servirá para nada em especial.</li>
        </ul>
        <div class="note">
          <p><strong>Nota:</strong> Se o parâmetro <code>data</code> não for fornecido, a rota retornará um erro 400.</p>
        </div>
        <div class="example">
          <p><strong>Exemplo de uso:</strong></p>
          <ul>
            <li><code>/api/rank?data=123456789:1000,987654321:1500&timestamp=1714158300000</code> - Gera o ranking dos usuários com base nos dados fornecidos e exibe a data correspondente ao timestamp.</li>
          </ul>
        </div>
      </div>

    </body>
    </html>
  `);
});

// Load all routes from routes directory
loadRoutes(app);

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).send('Route not found');
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API is running on http://localhost:${PORT}`));

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    console.log('HTTP server closed');
  });
});