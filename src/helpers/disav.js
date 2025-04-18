/**
 * Truncates a string if it exceeds the maximum length
 * @param {string} name - String to truncate
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} - Truncated string with ellipsis if needed
 */
function truncateString(name, maxLength) {
    if (name.length > maxLength) {
        return name.slice(0, maxLength - 3) + '...';
    }
    return name;
}

const userCache = new Map();
const pendingRequests = new Map();
const CACHE_TTL = 3600000;
const BATCH_DELAY = 50;

/**
 * Checks if a string contains too many special characters
 * @param {string} str - String to check
 * @returns {boolean} - True if the string has more than 50% special characters
 */
function hasTooManySpecialChars(str) {
  if (!str) return true;
  
  // Count regular alphanumeric characters
  const alphanumericCount = (str.match(/[a-zA-Z0-9]/g) || []).length;
  
  // If more than 50% are special characters, return true
  return alphanumericCount < str.length / 2;
}

/**
 * Fetches user information from Discord API with caching
 * @param {string} userId - Discord user ID
 * @returns {Promise<Object>} - User information object
 */
async function getUserInfo(userId) {
  const token = process.env.Btoken;
  
  if (!token) {
    throw new Error('Discord bot token not found in environment variables');
  }

  const cachedData = userCache.get(userId);
  if (cachedData && (Date.now() - cachedData.timestamp < CACHE_TTL)) {
    return cachedData.data;
  }

  if (pendingRequests.has(userId)) {
    return pendingRequests.get(userId);
  }

  const requestPromise = new Promise(async (resolve, reject) => {
    try {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
      
      const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bot ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter informações do usuário: ${response.statusText}`);
      }

      const user = await response.json();
      
      // Determine display name, avoiding names with too many special characters
      const globalName = user.global_name;
      const shouldUseGlobalName = globalName && !hasTooManySpecialChars(globalName);
      
      const userData = {
        username: truncateString(user.username, 14),
        displayName: truncateString(shouldUseGlobalName ? globalName : user.username, 14),
        discriminator: user.discriminator,
        avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : null,
        id: user.id
      };

      userCache.set(userId, {
        data: userData,
        timestamp: Date.now()
      });

      pendingRequests.delete(userId);
      
      resolve(userData);
    } catch (error) {
      pendingRequests.delete(userId);
      console.error('Erro ao obter informações do usuário:', error);
      reject(new Error('Não foi possível obter informações do usuário.'));
    }
  });

  pendingRequests.set(userId, requestPromise);
  return requestPromise;
}

function clearExpiredCache() {
  const now = Date.now();
  let deletedCount = 0;
  
  for (const [userId, cacheEntry] of userCache.entries()) {
    if (now - cacheEntry.timestamp > CACHE_TTL) {
      userCache.delete(userId);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Cleaned ${deletedCount} expired cache entries. Current cache size: ${userCache.size}`);
  }
}

setInterval(clearExpiredCache, 60000);

/**
 * Abbreviates large numbers with suffixes like K, M, B
 * @param {number} value - Number to abbreviate
 * @param {number} [decimalPlaces=1] - Decimal places to show
 * @returns {string} - Abbreviated number string
 */
function abbreviate(value, decimalPlaces = 1) {
  if (isNaN(value)) {
    throw new Error("O valor fornecido não é um número válido.");
  }

  const abbreviations = [
    { value: 1e18, suffix: 'QQ' },
    { value: 1e15, suffix: 'Q' },
    { value: 1e12, suffix: 'T' },
    { value: 1e9, suffix: 'B' },
    { value: 1e6, suffix: 'M' },
    { value: 1e3, suffix: 'K' }
  ];

  if (value < 1000) return value.toString();

  for (let i = 0; i < abbreviations.length; i++) {
    if (value >= abbreviations[i].value) {
      const abbreviatedValue = (value / abbreviations[i].value).toFixed(decimalPlaces);
      return `${abbreviatedValue}${abbreviations[i].suffix}`;
    }
  }

  return value.toString();
}

module.exports = { getUserInfo, abbreviate };