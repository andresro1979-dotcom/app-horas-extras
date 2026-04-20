function login() {
  const codigoIngresado = document.getElementById('codigo').value;
  const claveIngresada = document.getElementById('pin').value;

  const usuarios = [
    { codigo: '1', clave: '1001', nombre: 'Alejandro Guzman', rol: 'Usuario' },
    { codigo: '2', clave: '1002', nombre: 'Juan Donoso Torres', rol: 'Usuario' },
    { codigo: '3', clave: '1003', nombre: 'Ariel Gonzalez', rol: 'Admin' },
    { codigo: '4', clave: '1004', nombre: 'Bernardo Pérez Cofre', rol: 'Usuario' },
    { codigo: '5', clave: '1005', nombre: 'Claudio Sañueza De la Fuente', rol: 'Usuario' },
    { codigo: '6', clave: '1006', nombre: 'Edinson Castillo', rol: 'Usuario' },
    { codigo: '7', clave: '1007', nombre: 'Eduardo Xavier España', rol: 'Usuario' },
    { codigo: '8', clave: '1008', nombre: 'Fidel Navarrete Vulgron', rol: 'Usuario' },
    { codigo: '9', clave: '1009', nombre: 'Hernán Huaiquimilla Andrade', rol: 'Usuario' },
    { codigo: '10', clave: '1010', nombre: 'Johan Moncada', rol: 'Usuario' },
    { codigo: '11', clave: '1011', nombre: 'Jose Luis Sandoval', rol: 'Usuario' },
    { codigo: '12', clave: '1012', nombre: 'Luis Laurie Sáez', rol: 'Usuario' },
    { codigo: '13', clave: '1013', nombre: 'Maria Isabel Betancurt', rol: 'Usuario' },
    { codigo: '14', clave: '1014', nombre: 'Roberto Sepúlveda', rol: 'Usuario' },
    { codigo: '15', clave: '1015', nombre: 'Rodrigo Andres Pizarro Gonzalez', rol: 'Admin' },
    { codigo: '16', clave: '1016', nombre: 'Ulises Troncoso', rol: 'Usuario' }
  ];

  const usuario = usuarios.find(u =>
    u.codigo === codigoIngresado && u.clave === claveIngresada
  );

  if (!usuario) {
    alert('Código o contraseña incorrectos');
    return;
  }

  localStorage.setItem('nombreUsuario', usuario.nombre);
  localStorage.setItem('rolUsuario', usuario.rol);

  if (usuario.rol === 'Admin') {
    localStorage.setItem('esAdmin', 'si');
  } else {
    localStorage.setItem('esAdmin', 'no');
  }

  window.location.href = 'trabajador.html';
}