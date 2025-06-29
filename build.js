const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build personalizado...');

try {
  // Verificar que estamos en el directorio correcto
  console.log('📁 Directorio actual:', process.cwd());
  
  // Verificar que package.json existe
  if (!fs.existsSync('package.json')) {
    throw new Error('package.json no encontrado');
  }
  
  // Instalar dependencias si es necesario
  console.log('📦 Instalando dependencias...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Ejecutar build con npx para evitar problemas de permisos
  console.log('🔨 Ejecutando build con npx...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Verificar que el build se completó
  if (fs.existsSync('dist')) {
    console.log('✅ Build completado exitosamente');
    console.log('📁 Contenido de dist:', fs.readdirSync('dist'));
  } else {
    throw new Error('Directorio dist no encontrado después del build');
  }
  
} catch (error) {
  console.error('❌ Error durante el build:', error.message);
  process.exit(1);
} 