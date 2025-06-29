#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

console.log('🚀 Iniciando build para Vercel...');

// Función para ejecutar comandos de forma más robusta
function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Ejecutando: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${command} completado exitosamente`);
        resolve();
      } else {
        console.error(`❌ ${command} falló con código ${code}`);
        reject(new Error(`${command} falló con código ${code}`));
      }
    });
    
    child.on('error', (error) => {
      console.error(`❌ Error ejecutando ${command}:`, error);
      reject(error);
    });
  });
}

async function build() {
  try {
    // Verificar que estamos en el directorio correcto
    console.log('📁 Directorio actual:', process.cwd());
    
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json no encontrado');
    }
    
    // Intentar diferentes métodos de build
    const buildMethods = [
      () => runCommand('npx', ['vite', 'build']),
      () => runCommand('npm', ['run', 'build']),
      () => runCommand('yarn', ['build']),
      () => runCommand('pnpm', ['build'])
    ];
    
    let buildSuccess = false;
    
    for (const method of buildMethods) {
      try {
        await method();
        buildSuccess = true;
        break;
      } catch (error) {
        console.log(`⚠️ Método falló, intentando siguiente...`);
        continue;
      }
    }
    
    if (!buildSuccess) {
      throw new Error('Todos los métodos de build fallaron');
    }
    
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
}

build(); 