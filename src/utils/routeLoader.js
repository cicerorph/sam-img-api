const fs = require('fs');
const path = require('path');

/**
 * Recursively loads all route files from the routes directory
 * @param {Express} app - Express application instance
 */
function loadRoutes(app) {
  const routesPath = path.join(__dirname, '../routes');
  
  // Check if routes directory exists
  if (!fs.existsSync(routesPath)) {
    console.error('Routes directory not found!');
    return;
  }
  
  // Use a Map to track loaded routes for better performance
  const loadedRoutes = new Map();
  
  // Function to recursively load routes from directories
  function loadRoutesFromDir(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          // Recursively load routes from subdirectories
          loadRoutesFromDir(itemPath);
        } else if (stats.isFile() && item.endsWith('.js')) {
          // Check if route already loaded (in case of symlinks)
          if (loadedRoutes.has(itemPath)) {
            continue;
          }
          
          // Load route file
          try {
            // Clear require cache to allow hot reloading in dev
            delete require.cache[require.resolve(itemPath)];
            
            const route = require(itemPath);
            if (typeof route === 'function') {
              route(app);
              loadedRoutes.set(itemPath, true);
              console.log(`Route loaded: ${itemPath}`);
            }
          } catch (error) {
            console.error(`Error loading route ${itemPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading directory ${dirPath}:`, error);
    }
  }
  
  loadRoutesFromDir(routesPath);
  console.log(`Total routes loaded: ${loadedRoutes.size}`);
}

module.exports = loadRoutes;
