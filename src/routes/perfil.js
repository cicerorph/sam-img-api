const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { getUserInfo, abbreviate } = require('../helpers/disav');
const { drawAvatar, loadImageWithCache } = require('../utils/imageUtils');

module.exports = function(app) {
  app.get('/api/perfil', async (req, res) => {
    const userId = req.query.id || '1159667835761594449';
    
    const money = req.query.coins ? abbreviate(Number(req.query.coins)) : '0';  
    const reps = req.query.reps ? abbreviate(Number(req.query.reps)) : '0';   
    
    const status = req.query.status || 'Solteiro(a)';
    const aboutMe = req.query.aboutMe || 'Sou um entusiasta\nem tecnologia.';

    try {
      const userInfo = await getUserInfo(userId);
      userInfo.coins = money;
      userInfo.reps = reps;
      userInfo.status = status;
      userInfo.aboutMe = aboutMe;

      const width = 800;
      const height = 450;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      const bannerUrl = req.query.banner || path.join(__dirname, '../Bbanner.png');

      const banner = await loadImageWithCache(bannerUrl).catch(() => loadImageWithCache(path.join(__dirname, '../Bbanner.png')));
      const coinsIcon = await loadImageWithCache(path.join(__dirname, '../../assets/icons/coins.png'));
      const repsIcon = await loadImageWithCache(path.join(__dirname, '../../assets/icons/reps.png'));
      const statusIcon = await loadImageWithCache(path.join(__dirname, '../../assets/icons/status.png'));

      ctx.drawImage(banner, 0, 0, width, height / 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, height / 2, width, height / 2);

      const avatarSize = 130;
      const avatarX = 40;
      const avatarY = (height / 2) - (avatarSize / 2);

      await drawAvatar(ctx, userInfo.avatar, avatarX, avatarY, avatarSize, '#1a1a1a', 10);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Arial';
      const nameX = avatarX + avatarSize + 20;
      const nameY = avatarY + avatarSize / 2 + 30;
      // Use display name instead of username
      ctx.fillText(userInfo.displayName, nameX, nameY);

      const infoY = nameY + 30;
      const iconSize = 30;
      const rectHeight = 40;
      const rectPadding = 10;

      const infoImages = [coinsIcon, repsIcon, statusIcon];
      const infoValues = [
        `${userInfo.coins || 0}`,
        `${userInfo.reps || 0}`,
        userInfo.status || 'Solteiro(a)'
      ];

      let currentX = nameX;
      infoImages.forEach((icon, index) => {
        const text = infoValues[index];
        const rectWidth = ctx.measureText(text).width + iconSize + 20;
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(currentX, infoY, rectWidth, rectHeight);

        ctx.drawImage(icon, currentX + 5, infoY + (rectHeight - iconSize) / 2, iconSize, iconSize);

        ctx.fillStyle = '#ffffff';
        ctx.font = '18px Arial';
        ctx.fillText(text, currentX + iconSize + 10, infoY + 25);

        currentX += rectWidth + rectPadding;
      });

      const aboutMeRectWidth = 350;
      const aboutMeRectX = nameX;
      const aboutMeRectY = infoY + rectHeight + rectPadding * 2;
      const aboutMeRectHeight = 100;
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(aboutMeRectX, aboutMeRectY, aboutMeRectWidth, aboutMeRectHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Arial';
      const labelText = 'Sobre mim';
      const labelTextWidth = ctx.measureText(labelText).width;
      ctx.fillText(
        labelText,
        aboutMeRectX + (aboutMeRectWidth - labelTextWidth) / 2,
        aboutMeRectY + 20
      );

      const aboutMeLines = aboutMe.split('\n');
      const lineHeight = 20;

      const totalTextHeight = aboutMeLines.length * lineHeight;
      const startY = aboutMeRectY + (aboutMeRectHeight - totalTextHeight) / 2 + lineHeight;

      ctx.font = '16px Arial';
      aboutMeLines.forEach((line, index) => {
        const lineWidth = ctx.measureText(line).width;
        ctx.fillText(
          line,
          aboutMeRectX + (aboutMeRectWidth - lineWidth) / 2,
          startY + index * lineHeight
        );
      });

      const footerText = `Criado em ${new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      ctx.fillStyle = '#ffffff';
      ctx.font = '16px Arial';
      const footerTextWidth = ctx.measureText(footerText).width;
      ctx.fillText(footerText, width - footerTextWidth - 20, height - 20);

      const copyrightText = `© 2024 Sam Bot`;
      ctx.font = '14px Arial';
      const copyrightTextWidth = ctx.measureText(copyrightText).width;
      ctx.fillText(copyrightText, width - copyrightTextWidth - 20, height - 40);

      // Add "Criado com o Sam" text below the copyright
      const creditText = "Criado com o Sam";
      ctx.font = '14px Arial';
      const creditTextWidth = ctx.measureText(creditText).width;
      ctx.fillText(creditText, width - creditTextWidth - 20, height - 60);

      if (req.query.json === 'true') {
        return res.json(userInfo);
      }

      res.setHeader('Content-Type', 'image/png');
      res.send(canvas.toBuffer('image/png'));
    } catch (error) {
      console.error('Erro ao gerar perfil:', error);
      res.status(500).send('Erro interno do servidor.');
    }
  });
};
