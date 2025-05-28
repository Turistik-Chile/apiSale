import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import logger from '../config/logger.js';
import { handleFailedLogin, handleSuccessfulLogin } from '../middleware/rateLimit.memory.js';
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://usuarios.turistiktours.cl/api/v1',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Iniciando login para:', email);

    // Paso 1: Obtener token inicial
    const token = await obtenerTokenInicial();
    console.log('Token obtenido:', token);

    // Paso 2: Hacer login
    const loginResponse = await fetch('https://usuarios.turistiktours.cl/api/v2/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `${token}`
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(errorData.message || 'Error en el login');
    }

    const loginData = await loginResponse.json();
    console.log('Login exitoso');

    // Login exitoso - limpiar intentos fallidos
    await handleSuccessfulLogin(req);

    logger.info(`Login exitoso: ${email}`);
    return res.status(200).json({
      success: true,
      data: loginData
    });

  } catch (error) {
    logger.error('Error en login:', error);
    
    // Manejar intentos fallidos
    await handleFailedLogin(req);

    return res.status(401).json({
      success: false,
      message: error.message || 'Error al iniciar sesión'
    });
  }
};

// Paso 1: Obtener el token inicial
async function obtenerTokenInicial() {
  try {
    console.log('Intentando obtener token con:');
    
    const response = await fetch('https://usuarios.turistiktours.cl/api/v1/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: "sistemaTemplate",  // Cambiado de username a email
        password: "123456"
      })
    });

    console.log('Respuesta del servidor:', response);
    
    const data = await response.json();
    console.log('Datos recibidos:', data);

    if (!response.ok) {
      throw new Error(`Error al obtener token: ${data.message || response.statusText}`);
    }

    if (!data.token) {
      throw new Error('No se recibió token en la respuesta');
    }

    return data.token;
  } catch (error) {
    console.error('Error detallado al obtener token:', error);
    throw new Error(`Error al obtener token inicial: ${error.message}`);
  }
}

// Paso 2: Hacer login con el token
async function hacerLogin(token, email, password) {
  try {
    const response = await fetch('https://usuarios.turistiktours.cl/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${token}`
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      throw new Error('Error en el login');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error en el login:', error);
    throw error;
  }
}

// Función principal que ejecuta todo el proceso
async function iniciarSesion(email, password) {
  try {
    const response = await fetch('http://localhost:2000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    throw error;
  }
} 