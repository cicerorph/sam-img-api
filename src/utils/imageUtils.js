const { loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

// Cache for loaded images
const imageCache = new Map();
const IMAGE_CACHE_TTL = 3600000; // 1 hour in ms

// Default avatar path
const DEFAULT_AVATAR_PATH = path.join(__dirname, '../../assets/discordblue.png');

/**
 * Wraps text to fit within a specified length
 * @param {string} text - Text to wrap
 * @param {number} maxLength - Maximum line length
 * @returns {string[]} Array of lines
 */
function wrapText(text, maxLength) {
  const lines = [];
  const words = text.split(' ');
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length > maxLength) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine += (currentLine ? ' ' : '') + word;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Loads an image with caching for better performance
 * @param {string} url - Image URL or file path
 * @returns {Promise<Image>} - Canvas Image object
 */
async function loadImageWithCache(url) {
  // Check if image is in cache and not expired
  const cachedImage = imageCache.get(url);
  if (cachedImage && Date.now() - cachedImage.timestamp < IMAGE_CACHE_TTL) {
    return cachedImage.image;
  }
  
  try {
    const image = await loadImage(url);
    
    // Store in cache
    imageCache.set(url, {
      image,
      timestamp: Date.now()
    });
    
    return image;
  } catch (error) {
    throw new Error(`Failed to load image from ${url}: ${error.message}`);
  }
}

/**
 * Draws a circular avatar on a canvas with outline
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} avatarUrl - URL of the avatar image
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Size of the avatar
 * @param {string} outlineColor - Color of the outline (default: '#ffffff')
 * @param {number} outlineWidth - Width of the outline in pixels (default: 4)
 * @returns {Promise<void>}
 */
async function drawAvatar(ctx, avatarUrl, x, y, size, outlineColor = '#ffffff', outlineWidth = 4) {
  try {
    // Try to load the provided avatar first
    let avatarImage;

    if (!avatarUrl) avatarUrl = DEFAULT_AVATAR_PATH;
    
    try {
      avatarImage = await loadImageWithCache(avatarUrl);
    } catch (error) {
      // If avatar loading fails, use default avatar
      console.log(`Avatar load failed for ${avatarUrl}, using default`);
      avatarImage = await loadImageWithCache(DEFAULT_AVATAR_PATH);
    }
    
    // Draw the outline circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 + outlineWidth, 0, Math.PI * 2);
    ctx.fillStyle = outlineColor;
    ctx.fill();
    
    // Draw the avatar in a clipped circle
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatarImage, x, y, size, size);
    ctx.restore();
  } catch (error) {
    console.error(`Error drawing avatar: ${error.message}`);
    // Continue without drawing avatar rather than throwing error
  }
}

// Clean expired images from cache periodically
setInterval(() => {
  const now = Date.now();
  let removed = 0;
  for (const [url, cacheEntry] of imageCache.entries()) {
    if (now - cacheEntry.timestamp > IMAGE_CACHE_TTL) {
      imageCache.delete(url);
      removed++;
    }
  }
  if (removed > 0) {
    console.log(`Removed ${removed} expired images from cache.`);
  }
}, 300000);

module.exports = {
  wrapText,
  drawAvatar,
  loadImageWithCache
};
