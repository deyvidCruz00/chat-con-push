// Routes.js - Módulo de rutas
const express = require('express');
const router = express.Router();
const push = require('./push');

const mensajes = [

  {
    _id: 'XXX',
    user: 'spiderman',
    mensaje: 'Hola Mundo'
  }

];


// Get mensajes
router.get('/', function (req, res) {
  // res.json('Obteniendo mensajes');
  res.json( mensajes );
});


// Post mensaje
router.post('/', function (req, res) {
  
  const mensaje = {
    mensaje: req.body.mensaje,
    user: req.body.user
  };

  mensajes.push( mensaje );

  console.log(mensajes);


  res.json({
    ok: true,
    mensaje
  });
});


// Almacenar la suscripción
router.post('/subscribe', (req, res) => {


  const suscripcion = req.body;

  
  push.addSubscription( suscripcion );


  res.json('subscribe');

});

// Almacenar la suscripción
router.get('/key', (req, res) => {

  const key = push.getKey();

  res.json({ publicKey: key });

});


// Envar una notificación PUSH a las personas
// que nosotros queramos
// ES ALGO que se controla del lado del server
router.post('/push', (req, res) => {

  const post = {
    titulo: req.body.titulo || 'Notificación Push',
    cuerpo: req.body.cuerpo || 'Tienes una nueva actualización',
    usuario: req.body.usuario || 'spiderman',
    icon: req.body.icon,
    badge: req.body.badge,
    image: req.body.image,
    tag: req.body.tag,
    renotify: !!req.body.renotify,
    requireInteraction: !!req.body.requireInteraction,
    silent: !!req.body.silent,
    vibrate: Array.isArray(req.body.vibrate) ? req.body.vibrate : undefined,
    timestamp: Number.isFinite(req.body.timestamp) ? req.body.timestamp : Date.now(),
    lang: req.body.lang,
    dir: req.body.dir,
    actions: Array.isArray(req.body.actions) ? req.body.actions.slice(0, 2) : undefined,
    data: req.body.data || {}
  };

  post.data.url = post.data.url || '/';


  push.sendPush( post );

  res.json({ ok: true, post });

});





module.exports = router;