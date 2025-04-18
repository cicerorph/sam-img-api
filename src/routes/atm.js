const { createCanvas, loadImage } = require('canvas');
const { getUserInfo, abbreviate } = require('../helpers/disav');
const { drawAvatar } = require('../utils/imageUtils');

module.exports = function(app) {
  app.get('/api/atm', async (req, res) => {
    const { user, coins, bank } = req.query;

    if (!user || !coins || !bank) {
      return res.status(400).send('Os parâmetros "user", "coins" e "bank" são obrigatórios.');
    }

    const CONFIGS = {
      canvasWidth: 800,
      canvasHeight: 300,
      overlayWidth: 800,
      overlayHeight: 300,
      avatar: {
        x: 120,
        yOffset: -30,
        size: 150,
      },
      username: {
        x: 280,
        y: 110,
      },
      coins: {
        x: 320,
        y: 207,
      },
      bank: {
        x: 540,
        y: 207,
      },
    };

    try {
      const canvas = createCanvas(CONFIGS.canvasWidth, CONFIGS.canvasHeight);
      const ctx = canvas.getContext('2d');

      const mainBackground = await loadImage('https://i.ibb.co/5MhfrGj/366a7a6e8463.jpg');
      const baseOverlay = await loadImage('https://i.ibb.co/g9YXM9Z/74ad9f478758.png');

      ctx.drawImage(mainBackground, 0, 0, canvas.width, canvas.height);

      const overlayX = (canvas.width - CONFIGS.overlayWidth) / 2;
      const overlayY = (canvas.height - CONFIGS.overlayHeight) / 2;
      ctx.drawImage(baseOverlay, overlayX, overlayY, CONFIGS.overlayWidth, CONFIGS.overlayHeight);

      const userInfo = await getUserInfo(user);
      if (!userInfo) {
        return res.status(404).send('Usuário não encontrado.');
      }

      const avatarX = overlayX + CONFIGS.avatar.x;
      const avatarY = overlayY + (CONFIGS.overlayHeight - CONFIGS.avatar.size) / 2 + CONFIGS.avatar.yOffset;
      await drawAvatar(ctx, userInfo.avatar, avatarX, avatarY, CONFIGS.avatar.size);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 50px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(userInfo.username, overlayX + CONFIGS.username.x, overlayY + CONFIGS.username.y);

      ctx.fillStyle = '#000';
      ctx.font = 'bold 20px Arial';

      ctx.fillText(
        abbreviate(Number(coins)),
        overlayX + CONFIGS.coins.x,
        overlayY + CONFIGS.coins.y
      );

      ctx.fillText(
        abbreviate(Number(bank)),
        overlayX + CONFIGS.bank.x,
        overlayY + CONFIGS.bank.y
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      const creditText = "Criado com o Sam";
      const creditTextWidth = ctx.measureText(creditText).width;
      ctx.fillText(creditText, canvas.width - creditTextWidth - 10, canvas.height - 10);

      res.setHeader('Content-Type', 'image/png');
      res.send(canvas.toBuffer('image/png'));
    } catch (error) {
      console.error('Erro ao gerar imagem do ATM:', error);
      res.status(500).send('Erro interno do servidor.');
    }
  });
};
