const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const { getUserInfo, abbreviate } = require('../helpers/disav');
const { drawAvatar, loadImageWithCache } = require('../utils/imageUtils');

// Cache for rank images
let cachedRankImage = null;
let cachedRankImageTimestamp = 0;
const RANK_CACHE_TTL = 60000; // Reduced to 1 minute for faster updates during development

module.exports = function(app) {
  app.get('/api/rank', async (req, res) => {
    const startTime = Date.now();
    const { extraData, data } = req.query;

    if (!extraData || !data) {
      return res.status(400).send('Parâmetros "extraData" e "data" são obrigatórios.');
    }

    const cacheKey = `${extraData}_${data}`;
    
    if (cachedRankImage && 
        cachedRankImage.key === cacheKey && 
        (Date.now() - cachedRankImageTimestamp < RANK_CACHE_TTL)) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('X-Cache', 'HIT');
      return res.send(cachedRankImage.buffer);
    }

    const podiumEntries = extraData.split(',').map(entry => {
      const [id, coins] = entry.split(':');
      return { id: id?.trim(), coins: Number(coins) };
    }).filter(entry => entry.id && !isNaN(entry.coins));

    if (podiumEntries.length < 3) {
      return res.status(400).send('É necessário pelo menos 3 usuários válidos no parâmetro "extraData".');
    }

    const listEntries = data.split(',').map(entry => {
      const [id, coins] = entry.split(':');
      return { id: id?.trim(), coins: Number(coins) };
    }).filter(entry => entry.id && !isNaN(entry.coins));

    if (listEntries.length < 5) {
      return res.status(400).send('É necessário pelo menos 5 usuários válidos no parâmetro "data".');
    }

    try {
      const canvas = createCanvas(525, 350);
      const ctx = canvas.getContext('2d');

      // Use loadImageWithCache instead of loadImage for better performance
      const background = await loadImageWithCache('https://i.ibb.co/CsJcz3R/a78ddf4e2d1a.png');
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Pre-sort entries to avoid unnecessary sorting later
      podiumEntries.sort((a, b) => b.coins - a.coins);
      
      // Fetch user info in parallel for better performance
      const podiumInfo = await Promise.all(
        podiumEntries.slice(0, 3).map(async (user) => {
          try {
            const userInfo = await getUserInfo(user.id);
            return { ...userInfo, coins: user.coins };
          } catch (error) {
            return null;
          }
        })
      );

      const podiumPositions = [
        { x: 135, y: 250 },
        { x: 65, y: 280 },
        { x: 210, y: 295 },
      ];

      // Colors for each podium position
      const podiumColors = [
        '#FFD700', // Gold for 1st place
        '#C0C0C0', // Silver for 2nd place
        '#CD7F32'  // Bronze for 3rd place
      ];

      // Keep original positions and drawing logic, but use different colors
      for (let i = 0; i < 3; i++) {
        const user = podiumInfo[i];
        if (user) {
          const { x, y } = podiumPositions[i];
          
          // Use the improved drawAvatar with podium-specific colors
          await drawAvatar(
            ctx, 
            user.avatar, 
            x - 25, 
            y - 75, 
            50,
            podiumColors[i],  // Use position-specific color
            3                 // Outline width
          );

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          // Use display name instead of username
          ctx.fillText(user.displayName, x, y - 90);
        }
      }

      // Pre-sort list entries
      listEntries.sort((a, b) => b.coins - a.coins);
      
      // Fetch user info in parallel for list
      const listInfo = await Promise.all(
        listEntries.slice(0, 5).map(async (user) => {
          try {
            const userInfo = await getUserInfo(user.id);
            return { ...userInfo, coins: abbreviate(user.coins) };
          } catch (error) {
            return null;
          }
        })
      );

      let listY = 30;
      const avatarSize = 50;
      const iconSize = 24;
      const coinsOffset = 8;

      // Use loadImageWithCache for better performance
      const coinsIcon = await loadImageWithCache(path.join(__dirname, '../../assets/icons/coins.png'));

      for (const user of listInfo) {
        if (user) {
          // Use the improved drawAvatar with a subtle outline for list entries
          await drawAvatar(
            ctx, 
            user.avatar, 
            340, 
            listY - 20, 
            avatarSize,
            '#333333',  // Dark gray outline for list entries
            2           // Thinner outline
          );

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'left';
          // Use display name instead of username
          ctx.fillText(user.displayName, 400, listY);

          const iconX = 400;
          const iconY = listY + 7;

          if (coinsIcon) {
            ctx.drawImage(coinsIcon, iconX, iconY, iconSize, iconSize);
          }

          ctx.font = '12px Arial';
          ctx.fillText(`${user.coins}`, iconX + iconSize + coinsOffset, iconY + 17);

          listY += 65;
        }
      }

      // Add "Criado com o Sam" text at the bottom right
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      const creditText = "Criado com o Sam";
      const creditTextWidth = ctx.measureText(creditText).width;
      ctx.fillText(creditText, canvas.width - creditTextWidth - 10, canvas.height - 10);

      // Create the image buffer
      const buffer = canvas.toBuffer('image/png');

      // Cache the generated image
      cachedRankImage = {
        key: cacheKey,
        buffer: buffer
      };
      cachedRankImageTimestamp = Date.now();

      // Add generation time and cache status in headers
      const processingTime = Date.now() - startTime;
      res.setHeader('X-Processing-Time', `${processingTime}ms`);
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('Content-Type', 'image/png');
      res.send(buffer);
    } catch (error) {
      console.error('Erro ao gerar ranking:', error);
      res.status(500).send('Erro interno do servidor.');
    }
  });
};
